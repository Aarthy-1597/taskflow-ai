import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { TaskStatus, TaskPriority, PRIORITY_CONFIG } from '@/data/types';
import { useApp } from '@/context/AppContext';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { TaskCard } from '@/components/board/TaskCard';
import { TaskQuickEdit } from '@/components/board/TaskQuickEdit';
import { BoardFilters, SwimLane } from '@/components/board/BoardFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Task } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';

const columns: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export default function BoardPage() {
  const { tasks, projects, teamMembers, createTask, updateTask, selectedProjectId, setSelectedProjectId } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [swimLane, setSwimLane] = useState<SwimLane>('none');

  const projectTasks = selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : tasks;

  const allLabels = useMemo(() => [...new Set(projectTasks.flatMap(t => t.labels))], [projectTasks]);

  const filteredTasks = projectTasks.filter(t => {
    if (assigneeFilter !== 'all' && !t.assignees.includes(assigneeFilter)) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (labelFilter !== 'all' && !t.labels.includes(labelFilter)) return false;
    return true;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;
    if (columns.includes(overId as TaskStatus)) {
      updateTask(active.id as string, { status: overId as TaskStatus });
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) updateTask(active.id as string, { status: overTask.status });
    }
  };
  const handleDragEnd = (_event: DragEndEvent) => setActiveId(null);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  // Swimlane grouping
  const swimLaneGroups = useMemo(() => {
    if (swimLane === 'none') return [{ key: 'all', label: '', tasks: filteredTasks }];
    if (swimLane === 'assignee') {
      const groups = teamMembers.map(m => ({
        key: m.id,
        label: m.name,
        tasks: filteredTasks.filter(t => t.assignees.includes(m.id)),
      }));
      return groups.filter(g => g.tasks.length > 0);
    }
    if (swimLane === 'priority') {
      return (['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => ({
        key: p,
        label: PRIORITY_CONFIG[p].label,
        tasks: filteredTasks.filter(t => t.priority === p),
      })).filter(g => g.tasks.length > 0);
    }
    return [{ key: 'all', label: '', tasks: filteredTasks }];
  }, [swimLane, filteredTasks]);

  const openCreateForStatus = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  const effectiveProjectId = selectedProjectId ?? projects[0]?.id ?? null;
  const projectOptions = [{ id: 'all', name: 'All Projects' }, ...projects.map(p => ({ id: p.id, name: p.name }))];

  return (
    <AppLayout>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Board</h1>
              <p className="text-sm text-muted-foreground mt-1">Drag tasks between columns to update status</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedProjectId ?? 'all'}
                onValueChange={(v) => setSelectedProjectId(v === 'all' ? null : v)}
              >
                <SelectTrigger className="h-9 w-[220px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => openCreateForStatus('todo')} className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mb-4">
          <BoardFilters
            assigneeFilter={assigneeFilter}
            priorityFilter={priorityFilter}
            labelFilter={labelFilter}
            swimLane={swimLane}
            labels={allLabels}
            onAssigneeChange={setAssigneeFilter}
            onPriorityChange={setPriorityFilter}
            onLabelChange={setLabelFilter}
            onSwimLaneChange={setSwimLane}
          />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          {swimLaneGroups.map(group => (
            <div key={group.key} className="mb-6">
              {group.label && (
                <h2 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{group.label}</h2>
              )}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map(status => (
                  <KanbanColumn
                    key={`${group.key}-${status}`}
                    status={status}
                    tasks={group.tasks.filter(t => t.status === status)}
                    onTaskClick={setEditTask}
                    onCreateTask={openCreateForStatus}
                  />
                ))}
              </div>
            </div>
          ))}
          <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
        </DndContext>

        <TaskQuickEdit task={editTask} open={!!editTask} onOpenChange={open => !open && setEditTask(null)} />

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-base">New Task</DialogTitle>
            </DialogHeader>
            <CreateTaskForm
              projectId={effectiveProjectId}
              status={createStatus}
              teamMembers={teamMembers}
              tasks={tasks}
              projects={projects}
              onCancel={() => setCreateOpen(false)}
              onCreate={(payload) => {
                createTask(payload);
                setCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function CreateTaskForm({
  projectId,
  status,
  teamMembers,
  tasks,
  projects,
  onCancel,
  onCreate,
}: {
  projectId: string | null;
  status: TaskStatus;
  teamMembers: { id: string; name: string; email: string }[];
  tasks: Task[];
  projects: { id: string; name: string }[];
  onCancel: () => void;
  onCreate: (task: Omit<Task, 'id' | 'commentCount' | 'order'> & { commentCount?: number; order?: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [labelsRaw, setLabelsRaw] = useState('');
  const [blockedBy, setBlockedBy] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectIdLocal] = useState<string>(projectId ?? projects[0]?.id ?? '');

  const canSave = title.trim().length > 0 && selectedProjectId.length > 0;
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId), [tasks, selectedProjectId]);
  const blockerCandidates = projectTasks.filter(t => t.status !== 'done');

  const toggle = (id: string, set: (next: string[]) => void, cur: string[]) => {
    set(cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  };

  const labels = useMemo(() => {
    return labelsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [labelsRaw]);

  return (
    <>
      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Project</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectIdLocal}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={() => {}}>
              <SelectTrigger disabled><SelectValue /></SelectTrigger>
              <SelectContent>
                {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What needs to be done?" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
                  <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Due date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tags</label>
            <Input value={labelsRaw} onChange={(e) => setLabelsRaw(e.target.value)} placeholder="Bug, Feature, Design" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Assignees</label>
            <ScrollArea className="h-40 rounded-md border border-border">
              <div className="p-3 space-y-2">
                {teamMembers.map(m => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggle(m.id, setAssignees, assignees)}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 text-left">
                      <div className="text-sm text-card-foreground truncate">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>
                    </div>
                    <Checkbox checked={assignees.includes(m.id)} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Blocked by (optional)</label>
            <ScrollArea className="h-40 rounded-md border border-border">
              <div className="p-3 space-y-2">
                {blockerCandidates.length === 0 && (
                  <div className="text-xs text-muted-foreground">No tasks available.</div>
                )}
                {blockerCandidates.map(t => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggle(t.id, setBlockedBy, blockedBy)}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 text-left">
                      <div className="text-sm text-card-foreground truncate">{t.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.status.replace('_', ' ')}</div>
                    </div>
                    <Checkbox checked={blockedBy.includes(t.id)} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {labels.map(l => (
              <span key={l} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{l}</span>
            ))}
          </div>
        )}
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={!canSave}
          onClick={() => {
            if (!canSave) return;
            onCreate({
              title: title.trim(),
              description: description.trim(),
              status,
              priority,
              assignees,
              projectId: selectedProjectId,
              dueDate,
              labels,
              attachments: [],
              subtasks: [],
              blockedBy,
            });
          }}
        >
          Create
        </Button>
      </DialogFooter>
    </>
  );
}
