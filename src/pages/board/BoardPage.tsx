import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { TaskStatus, TaskPriority, PRIORITY_CONFIG } from '@/data/types';
import { useApp } from '@/context/AppContext';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { TaskCard } from '@/components/board/TaskCard';
import { TaskQuickEdit } from '@/components/board/TaskQuickEdit';
import { BoardFilters, SwimLane } from '@/components/board/BoardFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { teamMembers } from '@/data/mockData';
import { Task } from '@/data/types';

const columns: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export default function BoardPage() {
  const { tasks, updateTask, selectedProjectId } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [swimLane, setSwimLane] = useState<SwimLane>('none');

  const projectTasks = selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : tasks;

  const allLabels = useMemo(() => [...new Set(projectTasks.flatMap(t => t.labels))], [projectTasks]);

  const filteredTasks = projectTasks.filter(t => {
    if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;
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
        tasks: filteredTasks.filter(t => t.assignee === m.id),
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

  return (
    <AppLayout>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag tasks between columns to update status</p>
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
                  />
                ))}
              </div>
            </div>
          ))}
          <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
        </DndContext>

        <TaskQuickEdit task={editTask} open={!!editTask} onOpenChange={open => !open && setEditTask(null)} />
      </div>
    </AppLayout>
  );
}
