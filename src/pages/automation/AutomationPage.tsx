import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createAutomationRuleApi, listAutomationRulesApi, updateAutomationRuleApi } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AutomationPage() {
  const { automationRules } = useApp();
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

  const triggerLabels: Record<string, string> = {
    status_changed: 'Status Changed',
    task_overdue: 'Task Overdue',
    task_assigned: 'Task Assigned',
    task_created: 'Task Created',
  };

  const actionLabels: Record<string, string> = {
    send_notification: 'Send Notification',
    change_priority: 'Change Priority',
    send_teams_message: 'Send Teams Message',
    assign_task: 'Assign Task',
    add_comment: 'Add Comment',
  };

  const handleCreateRule = async () => {
    if (!newRuleName.trim()) {
      toast.error('Rule name is required');
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
      setNewRuleOpen(false);
      setNewRuleName('');
      setNewTrigger('status_changed');
      setNewTriggerValue('');
      setNewAction('send_notification');
      setNewActionValue('');
      toast.success('Automation rule created');
    } catch {
      toast.error('Failed to create automation rule');
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

        <div className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-lg border bg-card transition-all ${rule.enabled ? 'border-primary/30' : 'border-border opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleRule(rule.id)} className="text-primary">
                    {rule.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">{rule.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted font-medium">
                        WHEN {triggerLabels[rule.trigger] || rule.trigger}
                        {rule.triggerValue && ` = "${rule.triggerValue}"`}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        THEN {actionLabels[rule.action] || rule.action}
                      </span>
                    </div>
                  </div>
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
                  <label className="text-xs text-muted-foreground">Trigger</label>
                  <Select value={newTrigger} onValueChange={setNewTrigger}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status_changed">Status Changed</SelectItem>
                      <SelectItem value="task_overdue">Task Overdue</SelectItem>
                      <SelectItem value="task_assigned">Task Assigned</SelectItem>
                      <SelectItem value="task_created">Task Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Action</label>
                  <Select value={newAction} onValueChange={setNewAction}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_notification">Send Notification</SelectItem>
                      <SelectItem value="change_priority">Change Priority</SelectItem>
                      <SelectItem value="send_teams_message">Send Teams Message</SelectItem>
                      <SelectItem value="assign_task">Assign Task</SelectItem>
                      <SelectItem value="add_comment">Add Comment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Trigger Value</label>
                  <Input
                    value={newTriggerValue}
                    onChange={(e) => setNewTriggerValue(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Action Value</label>
                  <Input
                    value={newActionValue}
                    onChange={(e) => setNewActionValue(e.target.value)}
                    placeholder="Optional"
                  />
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
