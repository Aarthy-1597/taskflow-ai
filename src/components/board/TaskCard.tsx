import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/data/types';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { MessageSquare, Paperclip, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      onClick={onClick}
      className={`group p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-xl scale-105' : 'hover-lift'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-card-foreground leading-tight">{task.title}</h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(label => (
            <span key={label} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <UserAvatar userId={task.assignee} />
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" /> {task.commentCount}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Paperclip className="h-3 w-3" /> {task.attachmentCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
