import { Task } from '@/data/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listTaskCommentsApi, addTaskCommentApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTask?: (task: Task) => void;
}

export function TaskCommentsDialog({ task, open, onOpenChange, onEditTask }: Props) {
  const { teamMembers, updateTask } = useApp();
  const [comments, setComments] = useState<{ id: string; userId: string; content: string; createdAt: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !task?.id) return;
    setNewComment('');
    const fetchComments = (showLoading = true) => {
      if (import.meta.env.VITE_API_URL) {
        if (showLoading) setLoading(true);
        listTaskCommentsApi(task.id)
          .then(comments => {
            setComments(comments);
            updateTask(task.id, { commentCount: comments.length });
          })
          .catch(() => setComments([]))
          .finally(() => setLoading(false));
      } else {
        setComments([]);
      }
    };
    fetchComments(true);
    const interval = setInterval(() => fetchComments(false), 10000);
    return () => clearInterval(interval);
  }, [open, task?.id]);

  const addComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !task) return;
    if (!import.meta.env.VITE_API_URL) {
      toast.info('API not configured');
      return;
    }
    try {
      const created = await addTaskCommentApi(task.id, trimmed);
      setComments(prev => [created, ...prev]);
      setNewComment('');
      updateTask(task.id, { commentCount: (task.commentCount ?? 0) + 1 });
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-display text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({loading ? '…' : comments.length})
            </DialogTitle>
            {onEditTask && (
              <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={() => { onOpenChange(false); onEditTask(task); }}>
                <Pencil className="h-3.5 w-3.5" />
                Edit task
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{task.title}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addComment();
                }
              }}
              placeholder="Add a comment..."
              className="text-sm"
            />
            <Button type="button" variant="secondary" onClick={addComment} disabled={!newComment.trim()}>
              Add
            </Button>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground py-4">Loading comments...</div>
          ) : comments.length > 0 ? (
            <ScrollArea className="h-[280px] rounded-md border border-border">
              <div className="p-3 space-y-4">
                {comments.map(c => {
                  const member = teamMembers.find(m => m.id === c.userId);
                  return (
                    <div key={c.id} className="flex gap-3">
                      <UserAvatar userId={c.userId} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-card-foreground">{member?.name ?? 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">No comments yet. Add one above.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
