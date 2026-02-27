import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeTracker } from '@/components/time/TimeTracker';
import { TimeEntryForm } from '@/components/time/TimeEntryForm';
import { TimesheetFilters } from '@/components/time/TimesheetFilters';
import { TimeReports } from '@/components/time/TimeReports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeEntry } from '@/data/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TimePage() {
  const { timeEntries, tasks, projects, getTeamMember, deleteTimeEntry, refreshTimeEntries } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [userFilter, setUserFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const params: Record<string, string> = {};
    if (userFilter !== 'all') params.user_id = userFilter;
    if (projectFilter !== 'all') params.project_id = projectFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    refreshTimeEntries(Object.keys(params).length ? params : undefined);
  }, [userFilter, projectFilter, dateFrom, dateTo, refreshTimeEntries]);

  const filteredEntries = timeEntries;

  const totalBillable = filteredEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const totalNonBillable = filteredEntries.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0);

  const handleAddEntry = () => {
    setEditEntry(null);
    setFormOpen(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditEntry(entry);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditEntry(null);
  };

  const handleDelete = (id: string) => {
    deleteTimeEntry(id);
    setDeleteId(null);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Time Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage your work hours</p>
          </div>
          <Button onClick={handleAddEntry} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Log Time
          </Button>
        </motion.div>

        {/* Timer */}
        <TimeTracker />

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Hours</span>
            </div>
            <p className="text-xl font-display font-bold text-card-foreground">{(totalBillable + totalNonBillable).toFixed(1)}h</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Billable</span>
            </div>
            <p className="text-xl font-display font-bold text-card-foreground">{totalBillable.toFixed(1)}h</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Non-Billable</span>
            </div>
            <p className="text-xl font-display font-bold text-card-foreground">{totalNonBillable.toFixed(1)}h</p>
          </div>
        </div>

        <Tabs defaultValue="timesheet" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="timesheet" className="space-y-4">
            <TimesheetFilters
              userFilter={userFilter}
              projectFilter={projectFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              projects={projects}
              onUserChange={setUserFilter}
              onProjectChange={setProjectFilter}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />

            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <div className="grid grid-cols-[minmax(120px,1fr)_minmax(100px,1fr)_70px_70px_70px_44px] gap-3 px-4 py-2 border-b border-border text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider min-w-[500px]">
                <span>Task</span>
                <span>Description</span>
                <span>Hours</span>
                <span>Date</span>
                <span>Type</span>
                <span></span>
              </div>
              {filteredEntries.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">No time entries found</div>
              ) : (
                filteredEntries.map(entry => {
                  const task = tasks.find(t => t.id === entry.taskId);
                  const user = getTeamMember(entry.userId);
                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[minmax(120px,1fr)_minmax(100px,1fr)_70px_70px_70px_44px] gap-3 px-4 py-3 border-b border-border/50 text-sm hover:bg-muted/30 transition-colors items-center min-w-[500px]"
                    >
                      <div>
                        <span className="text-card-foreground font-medium block truncate">{task?.title || 'Unknown'}</span>
                        {user && <span className="text-xs text-muted-foreground">{user.name}</span>}
                      </div>
                      <span className="text-muted-foreground truncate">{entry.description}</span>
                      <span className="font-display text-card-foreground">{entry.hours}h</span>
                      <span className="text-muted-foreground text-xs">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className={`text-xs font-medium ${entry.billable ? 'text-success' : 'text-muted-foreground'}`}>
                        {entry.billable ? 'Billable' : 'Internal'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                            <Pencil className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(entry.id)} className="text-destructive">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <TimeReports
              filteredEntries={filteredEntries}
              tasks={tasks}
              projects={projects}
            />
          </TabsContent>
        </Tabs>

        <TimeEntryForm open={formOpen} onOpenChange={handleFormClose} entry={editEntry} />
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
