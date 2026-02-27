import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskStatus, STATUS_CONFIG, Task } from '@/data/types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, onTaskClick }: Props) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${config.colorClass}`} />
          <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
            {config.label}
          </h3>
          <span className="text-xs text-muted-foreground font-display">{tasks.length}</span>
        </div>
        <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-1 rounded-lg transition-colors min-h-[200px] ${
          isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
