import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Pencil, Trash2, FileText, FolderOpen } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Note } from '@/data/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Swal from 'sweetalert2';

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, tasks, projects, getTeamMember } = useApp();
  const [filter, setFilter] = useState<'all' | 'task' | 'project'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<'task' | 'project'>('task');
  const [linkedId, setLinkedId] = useState('');

  const filtered = notes.filter(n => {
    if (filter === 'task') return !!n.taskId;
    if (filter === 'project') return !!n.projectId && !n.taskId;
    return true;
  });

  const openCreate = () => {
    setEditingNote(null);
    setContent('');
    setNoteType('task');
    setLinkedId('');
    setDialogOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setContent(note.content);
    setNoteType(note.taskId ? 'task' : 'project');
    setLinkedId(note.taskId || note.projectId || '');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    if (editingNote) {
      updateNote(editingNote.id, { content, updatedAt: now });
    } else {
      addNote({
        id: `n${Date.now()}`,
        content,
        taskId: noteType === 'task' ? linkedId : undefined,
        projectId: noteType === 'project' ? linkedId : (noteType === 'task' ? tasks.find(t => t.id === linkedId)?.projectId : undefined),
        userId: '1',
        createdAt: now,
        updatedAt: now,
      });
    }
    setDialogOpen(false);
  };

  const getLinkedLabel = (note: Note) => {
    if (note.taskId) {
      const task = tasks.find(t => t.id === note.taskId);
      return task ? `Task: ${task.title}` : 'Task';
    }
    if (note.projectId) {
      const project = projects.find(p => p.id === note.projectId);
      return project ? `Project: ${project.name}` : 'Project';
    }
    return 'General';
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete note?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      width: 360,
      padding: '1rem',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-base',
        htmlContainer: 'text-sm',
        confirmButton: 'px-3 py-1.5 text-sm',
        cancelButton: 'px-3 py-1.5 text-sm',
      },
    });

    if (!result.isConfirmed) return;

    deleteNote(id);

    await Swal.fire({
      title: 'Deleted',
      text: 'The note was deleted successfully.',
      icon: 'success',
      width: 320,
      padding: '0.875rem',
      timer: 1200,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-xl',
        title: 'text-base',
        htmlContainer: 'text-sm',
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Notes</h1>
            <p className="text-sm text-muted-foreground mt-1">Task and project notes</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Note
          </button>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'task', 'project'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'task' ? 'Task Notes' : 'Project Notes'}
            </button>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((note, i) => {
              const member = getTeamMember(note.userId);
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="group p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                      {note.taskId ? <FileText className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />}
                      {getLinkedLabel(note)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(note)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => void handleDelete(note.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <UserAvatar userId={note.userId} />
                      <span className="text-[10px] text-muted-foreground">{member?.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingNote && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                    <Select value={noteType} onValueChange={(v) => { setNoteType(v as 'task' | 'project'); setLinkedId(''); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task Note</SelectItem>
                        <SelectItem value="project">Project Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{noteType === 'task' ? 'Task' : 'Project'}</label>
                    <Select value={linkedId} onValueChange={setLinkedId}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {noteType === 'task'
                          ? tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)
                          : projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your note..."
                rows={5}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setDialogOpen(false)} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {editingNote ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
