import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Calendar, Plus, Trash2, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Project, ProjectStatus } from '@/data/types';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, teamMembers, createProject, updateProject, deleteProject, setSelectedProjectId } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [color, setColor] = useState('#6366f1');
  const [members, setMembers] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setDueDate('');
    setStatus('active');
    setColor('#6366f1');
    setMembers([]);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description);
    setDueDate(p.dueDate);
    setStatus(p.status);
    setColor(p.color);
    setMembers(p.members);
    setOpen(true);
  };

  const toggleMember = (id: string) => {
    setMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSave = name.trim().length > 0 && dueDate.trim().length > 0;

  const memberLookup = useMemo(() => {
    return new Map(teamMembers.map((m) => [m.id, m]));
  }, [teamMembers]);

  const handleSave = () => {
    if (!canSave) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      dueDate,
      status,
      color,
      members,
      startDate: editing?.startDate ?? new Date().toISOString().slice(0, 10),
      progress: editing?.progress ?? 0,
    };

    if (editing) {
      updateProject(editing.id, payload);
    } else {
      createProject(payload);
    }
    setOpen(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteProject(editing.id);
    setOpen(false);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground mt-1">Create and manage your team’s projects</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-lg border border-border bg-card hover-lift cursor-pointer group"
              onClick={() => {
                setSelectedProjectId(project.id);
                navigate('/board');
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h3 className="text-sm font-display font-semibold text-card-foreground">{project.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    project.status === 'active' ? 'bg-success/10 text-success' :
                    project.status === 'on_hold' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {project.status === 'active' ? 'Active' : project.status === 'on_hold' ? 'On Hold' : 'Done'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(project); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Edit project"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">{project.description}</p>

              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {project.members.slice(0, 3).map(m => (
                    <UserAvatar key={m} userId={m} />
                  ))}
                  {project.members.length > 3 && (
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border-2 border-card">
                      +{project.members.length - 3}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'No due date'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              {editing ? 'Edit Project' : 'New Project'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Due date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What’s this project about?" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Color</label>
                <div className="flex items-center gap-3">
                  <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 p-1" />
                  <div className="text-xs text-muted-foreground">{color}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Team members</label>
              <ScrollArea className="h-44 rounded-md border border-border">
                <div className="p-3 space-y-2">
                  {teamMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar userId={m.id} />
                        <div className="min-w-0 text-left">
                          <div className="text-sm text-card-foreground truncate">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>
                        </div>
                      </div>
                      <Checkbox checked={members.includes(m.id)} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {members.length > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  {members.length} selected
                  {members.length <= 3 && (
                    <>: {members.map((id) => memberLookup.get(id)?.name).filter(Boolean).join(', ')}</>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <div className="flex items-center gap-2 mr-auto">
              {editing && (
                <Button variant="destructive" onClick={handleDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
