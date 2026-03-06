import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNowStrict, isPast, parseISO } from 'date-fns';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, User, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import {
  addAssignee,
  addSubtask,
  BoardColumn,
  BoardTask,
  createTask,
  deleteSubtask,
  deleteTask,
  fetchBoardColumns,
  fetchBoardTasks,
  removeAssignee,
  updateSubtask,
  updateTask,
} from '@/features/board/api';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-300 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  low: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
};

const FALLBACK_COLORS: Record<string, string> = {
  'to do': '#ef4444',
  doing: '#f59e0b',
  'needs input': '#8b5cf6',
  done: '#10b981',
  canceled: '#6b7280',
};

const queryKeys = {
  columns: ['board-columns'],
  tasks: ['board-tasks'],
};

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function assigneeColor(name: string) {
  const colors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0ea5e9'];
  const hash = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function relativeDueDate(dateString: string) {
  const date = parseISO(dateString);
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

function progress(subtasks: BoardTask['subtasks']) {
  const total = subtasks.length;
  const done = subtasks.filter((s) => s.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

const TaskBoard = () => {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const { data: columns = [] } = useQuery({ queryKey: queryKeys.columns, queryFn: fetchBoardColumns });
  const { data: tasks = [] } = useQuery({ queryKey: queryKeys.tasks, queryFn: fetchBoardTasks });

  useEffect(() => {
    const channel = supabase
      .channel('kanban-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      setNewDialogOpen(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, patch }: { taskId: string; patch: Partial<BoardTask> }) =>
      updateTask(taskId, patch as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      setActiveTaskId(null);
    },
  });

  const columnTasks = (columnId: string) => tasks.filter((t) => t.board_column_id === columnId);
  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) || null : null;

  const onDrop = (columnId: string) => {
    if (!draggedTaskId) return;
    updateTaskMutation.mutate({ taskId: draggedTaskId, patch: { board_column_id: columnId } as never });
    setDraggedTaskId(null);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#0a0a0f] text-zinc-100 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Board
        </h2>

        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <NewTaskForm
              columns={columns}
              onCreate={(payload) => createTaskMutation.mutate(payload)}
              loading={createTaskMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="md:hidden flex gap-2 overflow-x-auto mb-4 pb-1">
        {columns.map((c) => (
          <div key={c.id} className="shrink-0 px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-sm">
            {c.name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {columns.map((column) => {
          const items = columnTasks(column.id);
          const color = column.color || FALLBACK_COLORS[column.name.toLowerCase()] || '#6b7280';

          return (
            <div
              key={column.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] min-h-[70vh] flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(column.id)}
            >
              <div className="p-3 border-b border-white/10" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{column.name}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="h-1 mt-2 rounded" style={{ backgroundColor: color }} />
              </div>

              <div className="p-3 space-y-3 overflow-y-auto">
                {!items.length && (
                  <div className="border border-dashed border-white/15 rounded-lg p-6 text-center text-zinc-400 text-sm">No tasks</div>
                )}

                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => setActiveTaskId(task.id)}
                    onDragStart={() => setDraggedTaskId(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeTask && (
          <TaskDetailsDialog
            task={activeTask}
            columns={columns}
            onClose={() => setActiveTaskId(null)}
            onUpdate={async (patch) => {
              await updateTaskMutation.mutateAsync({ taskId: activeTask.id, patch: patch as never });
            }}
            onDelete={async () => {
              await deleteTaskMutation.mutateAsync(activeTask.id);
            }}
            onMutationDone={async () => {
              await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function TaskCard({ task, onOpen, onDragStart }: { task: BoardTask; onOpen: () => void; onDragStart: () => void }) {
  const pr = progress(task.subtasks);
  const due = task.due_date ? parseISO(task.due_date) : null;
  const overdue = due ? isPast(due) : false;

  return (
    <motion.button
      type="button"
      className="w-full text-left rounded-lg p-3 bg-[rgba(17,24,39,0.7)] backdrop-blur border border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg transition"
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold truncate">{task.title}</p>
        <Badge className={`border ${PRIORITY_COLORS[(task.priority || 'medium').toLowerCase()] || PRIORITY_COLORS.medium}`}>
          {task.priority || 'Medium'}
        </Badge>
      </div>

      {task.description && <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{task.description}</p>}

      {task.subtasks.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-zinc-400 mb-1">{pr.done}/{pr.total} subtasks</div>
          <div className="h-1.5 rounded bg-zinc-800 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${pr.pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {task.assignees.length === 0 ? (
            <div className="h-7 w-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center">
              <User className="h-4 w-4 text-zinc-300" />
            </div>
          ) : (
            <>
              {task.assignees.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="h-7 w-7 rounded-full border border-zinc-900 text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: assigneeColor(a.display_name) }}
                  title={a.display_name}
                >
                  {initials(a.display_name)}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="h-7 w-7 rounded-full bg-zinc-700 border border-zinc-600 text-[10px] font-bold flex items-center justify-center">
                  +{task.assignees.length - 3}
                </div>
              )}
            </>
          )}
        </div>

        {task.due_date && (
          <span className={`text-xs ${overdue ? 'text-red-400' : 'text-zinc-400'}`}>{relativeDueDate(task.due_date)}</span>
        )}
      </div>
    </motion.button>
  );
}

function NewTaskForm({
  columns,
  onCreate,
  loading,
}: {
  columns: BoardColumn[];
  onCreate: (payload: { title: string; description?: string; priority: string; board_column_id: string; due_date?: string | null }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [columnId, setColumnId] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ title, description, priority, board_column_id: columnId || columns[0]?.id, due_date: dueDate || null });
      }}
    >
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {['Urgent', 'High', 'Medium', 'Low'].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={columnId} onValueChange={setColumnId}>
          <SelectTrigger>
            <SelectValue placeholder="Column" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <Button type="submit" disabled={loading || !title || (!columnId && !columns[0]?.id)}>
        {loading ? 'Creating...' : 'Create Task'}
      </Button>
    </form>
  );
}

function TaskDetailsDialog({
  task,
  columns,
  onClose,
  onUpdate,
  onDelete,
  onMutationDone,
}: {
  task: BoardTask;
  columns: BoardColumn[];
  onClose: () => void;
  onUpdate: (patch: Partial<BoardTask>) => Promise<void>;
  onDelete: () => Promise<void>;
  onMutationDone: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'Medium');
  const [columnId, setColumnId] = useState(task.board_column_id);
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [newAssignee, setNewAssignee] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const html = DOMPurify.sanitize(marked.parse(description || '') as string);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />

          <div className="grid grid-cols-3 gap-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Urgent', 'High', 'Medium', 'Low'].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={dueDate || ''} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <p className="text-sm mb-2 text-zinc-300">Description preview (markdown)</p>
            <div className="prose prose-invert max-w-none text-sm bg-zinc-800/50 rounded-md p-3" dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <div>
            <p className="text-sm mb-2 text-zinc-300">Assignees</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {task.assignees.map((a) => (
                <Badge key={a.id} variant="secondary" className="gap-2">
                  {a.display_name}
                  <button
                    type="button"
                    onClick={async () => {
                      await removeAssignee(a.id);
                      await onMutationDone();
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="Add assignee by name" />
              <Button
                type="button"
                onClick={async () => {
                  if (!newAssignee.trim()) return;
                  await addAssignee(task.id, newAssignee.trim());
                  setNewAssignee('');
                  await onMutationDone();
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm mb-2 text-zinc-300">Subtasks</p>
            <div className="space-y-2 mb-2">
              {task.subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={s.completed}
                    onCheckedChange={async (checked) => {
                      await updateSubtask(s.id, { completed: !!checked });
                      await onMutationDone();
                    }}
                  />
                  <span className={`text-sm ${s.completed ? 'line-through text-zinc-500' : ''}`}>{s.title}</span>
                  <button
                    type="button"
                    className="ml-auto text-zinc-400 hover:text-zinc-200"
                    onClick={async () => {
                      await deleteSubtask(s.id);
                      await onMutationDone();
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="New subtask" />
              <Button
                type="button"
                onClick={async () => {
                  if (!newSubtask.trim()) return;
                  await addSubtask(task.id, newSubtask.trim());
                  setNewSubtask('');
                  await onMutationDone();
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="destructive" onClick={onDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Task
            </Button>

            <Button
              onClick={async () => {
                await onUpdate({ title, description, priority, board_column_id: columnId, due_date: dueDate || null } as never);
                await onMutationDone();
                onClose();
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TaskBoard;
