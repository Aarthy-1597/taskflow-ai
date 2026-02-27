import { PRIORITY_CONFIG, TaskPriority } from '@/data/types';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-primary-foreground ${config.colorClass}`}>
      {config.label}
    </span>
  );
}
