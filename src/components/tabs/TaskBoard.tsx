import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasks as fallbackTasks, Task } from '@/data/mockData';
import GlassCard from '@/components/GlassCard';
import { fetchTasks, updateTaskColumn } from '@/features/tasks/api';

const columns = [
  { id: 'todo' as const, label: 'To Do', color: 'text-muted-foreground', glowColor: 'bg-muted-foreground' },
  { id: 'doing' as const, label: 'Doing', color: 'text-accent', glowColor: 'bg-accent' },
  { id: 'needs-input' as const, label: 'Needs Input', color: 'text-warning', glowColor: 'bg-warning' },
  { id: 'done' as const, label: 'Done', color: 'text-primary', glowColor: 'bg-primary' },
];

const priorityBorder: Record<string, string> = {
  low: 'priority-border-low',
  medium: 'priority-border-medium',
  high: 'priority-border-high',
  urgent: 'priority-border-urgent',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-accent',
  high: 'bg-warning',
  urgent: 'bg-destructive',
};

const TASKS_QUERY_KEY = ['tasks'];

const TaskBoard = () => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
  });

  const tasks = useMemo(() => {
    if (isError) return fallbackTasks;
    return data ?? [];
  }, [data, isError]);

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, column }: { taskId: string; column: Task['column'] }) =>
      updateTaskColumn(taskId, column),
    onMutate: async ({ taskId, column }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current) =>
        (current ?? []).map((t) => (t.id === taskId ? { ...t, column } : t)),
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);

  const handleDrop = (columnId: Task['column']) => {
    if (!draggedTask) return;

    moveTaskMutation.mutate({ taskId: draggedTask, column: columnId });
    setDraggedTask(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
      {columns.map((col, ci) => (
        <motion.div
          key={col.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.1 }}
          className="min-w-[260px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.id)}
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <h3 className={`text-sm font-semibold font-heading ${col.color}`}>{col.label}</h3>
            <span className="text-xs font-mono text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              {tasks.filter(t => t.column === col.id).length}
            </span>
            <div className="flex-1" />
            <div className={`h-0.5 w-8 rounded-full ${col.glowColor} opacity-40`} />
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.column === col.id).map((task, i) => (
              <GlassCard
                key={task.id}
                hover
                className={`cursor-grab active:cursor-grabbing p-4 ${priorityBorder[task.priority]}`}
                draggable
                onDragStart={() => handleDragStart(task.id)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ci * 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                  <span className="text-xs text-muted-foreground font-mono capitalize">{task.priority}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{task.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm" title={task.agentName}>{task.agentEmoji}</span>
                  {task.progress !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{task.progress}%</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TaskBoard;
