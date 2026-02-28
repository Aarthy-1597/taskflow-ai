import { teamMembers } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Users, FolderKanban, Calendar } from 'lucide-react';

interface Props {
  userFilter: string;
  projectFilter: string;
  dateFrom: string;
  dateTo: string;
  projects: { id: string; name: string }[];
  onUserChange: (v: string) => void;
  onProjectChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  /** Label for the filter section (default: "Filters") */
  label?: string;
}

export function TimesheetFilters({
  userFilter, projectFilter, dateFrom, dateTo, projects,
  onUserChange, onProjectChange, onDateFromChange, onDateToChange,
  label = 'Filters',
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-medium">{label}</span>
      </div>
      <div>
        <Label className="text-xs sr-only">User</Label>
        <Select value={userFilter} onValueChange={onUserChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <Users className="h-3 w-3 mr-1" />
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {teamMembers.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs sr-only">Project</Label>
        <Select value={projectFilter} onValueChange={onProjectChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <FolderKanban className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <div>
          <Label className="text-xs sr-only">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            className="h-8 w-[130px] text-xs"
          />
        </div>
        <span className="text-muted-foreground text-xs">–</span>
        <div>
          <Label className="text-xs sr-only">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            className="h-8 w-[130px] text-xs"
          />
        </div>
      </div>
    </div>
  );
}
