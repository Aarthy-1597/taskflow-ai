import { TaskPriority } from '@/data/types';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Filter, Users, Flag, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';

export type SwimLane = 'none' | 'assignee' | 'priority';

interface Props {
  assigneeFilter: string;
  priorityFilter: string;
  labelFilter: string;
  swimLane: SwimLane;
  labels: string[];
  onAssigneeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onLabelChange: (v: string) => void;
  onSwimLaneChange: (v: SwimLane) => void;
}

export function BoardFilters({
  assigneeFilter, priorityFilter, labelFilter, swimLane, labels,
  onAssigneeChange, onPriorityChange, onLabelChange, onSwimLaneChange,
}: Props) {
  const { teamMembers } = useApp();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-medium">Filters</span>
      </div>

      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <Users className="h-3 w-3 mr-1" />
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {teamMembers.map(m => (
            <SelectItem key={m.id} value={m.id}>
              <div className="flex items-center gap-2"><UserAvatar userId={m.id} />{m.name}</div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <Flag className="h-3 w-3 mr-1" />
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={labelFilter} onValueChange={onLabelChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Labels</SelectItem>
          {labels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={swimLane} onValueChange={v => onSwimLaneChange(v as SwimLane)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Swimlane" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Swimlane</SelectItem>
            <SelectItem value="assignee">By Assignee</SelectItem>
            <SelectItem value="priority">By Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
