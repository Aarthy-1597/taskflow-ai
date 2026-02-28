import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, ToggleLeft, ToggleRight, Trash2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createAutomationRuleApi, deleteAutomationRuleApi, listAutomationRulesApi, testAutomationRuleTeamsApi, updateAutomationRuleApi } from '@/lib/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AutomationPage() {
  const { automationRules, setAutomationRules } = useApp();
  const [rules, setRules] = useState(automationRules);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newTrigger, setNewTrigger] = useState('status_changed');
  const [newTriggerValue, setNewTriggerValue] = useState('');
  const [newAction, setNewAction] = useState('send_notification');
  const [newActionValue, setNewActionValue] = useState('');

  useEffect(() => {
    setRules(automationRules);
  }, [automationRules]);

  useEffect(() => {
    let cancelled = false;
    void listAutomationRulesApi().then(data => {
      if (!cancelled && data.length) setRules(data);
    }).catch(() => {
      // keep fallback data
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleRule = (id: string) => {
    const current = rules.find(r => r.id === id);
    if (!current) return;
    const next = !current.enabled;
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: next } : r));
    void updateAutomationRuleApi(id, { enabled: next }).catch(() => {
      // rollback on failure
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: current.enabled } : r));
      toast.error('Failed to update automation rule');
    });
  };

  const handleDeleteRule = async (rule: { id: string; name: string }) => {
    const result = await Swal.fire({
      title: 'Delete rule?',
      text: `"${rule.name}" will be removed. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'hsl(var(--destructive))',
      cancelButtonColor: 'hsl(var(--muted-foreground))',
      confirmButtonText: 'Delete',
      width: 380,
      customClass: { popup: 'rounded-lg' },
    });
    if (!result.isConfirmed) return;
    try {
      await deleteAutomationRuleApi(rule.id);
      setRules(prev => prev.filter(r => r.id !== rule.id));
      setAutomationRules(prev => prev.filter(r => r.id !== rule.id));
      toast.success('Rule deleted');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Failed to delete rule');
    }
  };

  const handleTestTeams = async (rule: { id: string; name: string; action: string }) => {
    if (rule.action !== 'send_teams_message') {
      toast.error('Only "Send Teams message" rules can be tested.');
      return;
    }
    try {
      await testAutomationRuleTeamsApi(rule.id);
      toast.success('Test message sent to Teams. Check your channel.');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Failed to send test to Teams');
    }
  };

  const triggerLabels: Record<string, string> = {
    status_changed: 'Task status changed',
    task_assigned: 'Task assigned',
    task_created: 'Task created',
    due_date_approaching: 'Due date approaching',
    task_overdue: 'Task overdue',
    priority_changed: 'Priority changed',
  };

  const actionLabels: Record<string, string> = {
    send_notification: 'Send notification',
    assign_task: 'Assign task',
    change_status: 'Change status',
    change_priority: 'Change priority',
    add_comment: 'Add comment',
    send_teams_message: 'Send Teams message',
    create_subtask: 'Create subtask',
  };

  const statusOptions = ['To Do', 'In Progress', 'In Review', 'Done'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

  const handleCreateRule = async () => {
    if (!newRuleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    const hasApi = typeof import.meta !== 'undefined' && !!import.meta.env.VITE_API_URL;
    if (!hasApi) {
      toast.error('Set VITE_API_URL (e.g. http://localhost:3000) in .env to create rules via API');
      return;
    }

    try {
      const created = await createAutomationRuleApi({
        name: newRuleName.trim(),
        trigger: newTrigger,
        triggerValue: newTriggerValue.trim(),
        action: newAction,
        actionValue: newActionValue.trim(),
        enabled: true,
        projectId: '',
      });
      setRules(prev => [created, ...prev]);
      setAutomationRules(prev => [created, ...prev]);
      setNewRuleOpen(false);
      setNewRuleName('');
      setNewTrigger('status_changed');
      setNewTriggerValue('');
      setNewAction('send_notification');
      setNewActionValue('');
      toast.success('Automation rule created');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Failed to create automation rule');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-warning" /> Automation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Automate repetitive workflows with smart rules</p>
          </div>
          <button
            onClick={() => setNewRuleOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + New Rule
          </button>
        </motion.div>

        <p className="text-sm text-muted-foreground">
          Format: <strong>WHEN [Trigger]</strong> → <strong>THEN [Action]</strong>. Rules run automatically on task events (create, status change, assign, due date) and hourly for due/overdue.
        </p>
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-lg border bg-card transition-all ${rule.enabled ? 'border-primary/30' : 'border-border opacity-60'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <button onClick={() => toggleRule(rule.id)} className="text-primary shrink-0" title={rule.enabled ? 'Disable' : 'Enable'}>
                    {rule.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-card-foreground">{rule.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-muted font-medium">
                        WHEN {triggerLabels[rule.trigger] || rule.trigger}
                        {rule.triggerValue && ` = "${rule.triggerValue}"`}
                      </span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        THEN {actionLabels[rule.action] || rule.action}
                        {rule.actionValue && ` ${rule.actionValue}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {rule.action === 'send_teams_message' && (
                    <button
                      type="button"
                      onClick={() => void handleTestTeams(rule)}
                      className="p-2 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Send test message to Teams"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDeleteRule(rule)}
                    className="p-2 rounded-md border border-border bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Rule Name</label>
                <Input
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Notify PM on review"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">WHEN (Trigger)</label>
                  <Select value={newTrigger} onValueChange={(v) => { setNewTrigger(v); setNewTriggerValue(''); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status_changed">Task status changed</SelectItem>
                      <SelectItem value="task_assigned">Task assigned</SelectItem>
                      <SelectItem value="task_created">Task created</SelectItem>
                      <SelectItem value="due_date_approaching">Due date approaching</SelectItem>
                      <SelectItem value="task_overdue">Task overdue</SelectItem>
                      <SelectItem value="priority_changed">Priority changed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">THEN (Action)</label>
                  <Select value={newAction} onValueChange={(v) => { setNewAction(v); setNewActionValue(''); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_notification">Send notification</SelectItem>
                      <SelectItem value="assign_task">Assign task</SelectItem>
                      <SelectItem value="change_status">Change status</SelectItem>
                      <SelectItem value="change_priority">Change priority</SelectItem>
                      <SelectItem value="add_comment">Add comment</SelectItem>
                      <SelectItem value="send_teams_message">Send Teams message</SelectItem>
                      <SelectItem value="create_subtask">Create subtask</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {newTrigger === 'status_changed' ? 'Status equals (optional)' : newTrigger === 'priority_changed' ? 'Priority equals (optional)' : 'Trigger value (optional)'}
                  </label>
                  {newTrigger === 'status_changed' ? (
                    <Select value={newTriggerValue || '_any'} onValueChange={(v) => setNewTriggerValue(v === '_any' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_any">Any status</SelectItem>
                        {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : newTrigger === 'priority_changed' ? (
                    <Select value={newTriggerValue || '_any'} onValueChange={(v) => setNewTriggerValue(v === '_any' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Any priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_any">Any priority</SelectItem>
                        {priorityOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={newTriggerValue} onChange={(e) => setNewTriggerValue(e.target.value)} placeholder="Optional" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {newAction === 'change_status' ? 'New status' : newAction === 'change_priority' ? 'New priority' : newAction === 'assign_task' ? 'User ID(s), comma-separated' : newAction === 'add_comment' || newAction === 'create_subtask' ? 'Text / title' : 'Action value (optional)'}
                  </label>
                  {newAction === 'change_status' ? (
                    <Select value={newActionValue} onValueChange={setNewActionValue}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : newAction === 'change_priority' ? (
                    <Select value={newActionValue} onValueChange={setNewActionValue}>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={newActionValue}
                      onChange={(e) => setNewActionValue(e.target.value)}
                      placeholder={newAction === 'assign_task' ? 'e.g. userId1, userId2' : newAction === 'add_comment' ? 'Comment text' : newAction === 'create_subtask' ? 'Subtask title' : 'Optional'}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewRuleOpen(false)}>Cancel</Button>
                <Button onClick={() => void handleCreateRule()}>Create Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
