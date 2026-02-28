import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/data/types';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { MessageSquare, Paperclip, Calendar, Link2, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  const blockerCount = task.blockedBy.length;
  const isBlocked = blockerCount > 0 && task.status !== 'done';
  const attachmentCount = task.attachments.length;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      onClick={onClick}
      className={`group relative pl-8 pr-3 py-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-xl scale-105' : 'hover-lift'
      }`}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        title="Drag to move"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>
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
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex -space-x-1.5">
            {(task.assignees.length ? task.assignees : ['unassigned']).slice(0, 3).map((id, idx) => (
              id === 'unassigned'
                ? <div key={`un-${idx}`} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border-2 border-card">?</div>
                : <UserAvatar key={id} userId={id} />
            ))}
            {task.assignees.length > 3 && (
              <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border-2 border-card">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {isBlocked && (
            <span className="flex items-center gap-0.5 text-[10px] text-warning">
              <Link2 className="h-3 w-3" /> Blocked{blockerCount > 1 ? ` (${blockerCount})` : ''}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" /> {task.commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Paperclip className="h-3 w-3" /> {attachmentCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
