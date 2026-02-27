import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { TaskStatus } from '@/data/types';
import { useApp } from '@/context/AppContext';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { TaskCard } from '@/components/board/TaskCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';

const columns: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export default function BoardPage() {
  const { tasks, updateTask, selectedProjectId } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredTasks = selectedProjectId
    ? tasks.filter(t => t.projectId === selectedProjectId)
    : tasks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    if (columns.includes(overId as TaskStatus)) {
      updateTask(active.id as string, { status: overId as TaskStatus });
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        updateTask(active.id as string, { status: overTask.status });
      }
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <AppLayout>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag tasks between columns to update status</p>
        </motion.div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={filteredTasks.filter(t => t.status === status)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  );
}
