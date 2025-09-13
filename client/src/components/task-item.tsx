import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface TaskItemProps {
  task: Task;
  rehearsalId: string;
  onReorder: (taskIds: string[]) => void;
}

export function TaskItem({ task, rehearsalId, onReorder }: TaskItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTaskMutation = useMutation({
    mutationFn: async (updateData: Partial<Task>) => {
      const response = await apiRequest(
        "PUT",
        `/api/tasks/${task.id}`,
        updateData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
      toast({
        title: "Task deleted",
        description: "The task has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleToggleComplete = () => {
    const newStatus = task.status === "open" ? "closed" : "open";
    updateTaskMutation.mutate({ status: newStatus });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const isCompleted = task.status === "closed";

  return (
    <div
      className="flex items-center space-x-3 p-2 rounded hover:bg-muted transition-colors group"
      data-testid={`task-item-${task.id}`}
    >
      <button
        onClick={handleToggleComplete}
        disabled={updateTaskMutation.isPending}
        className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
          isCompleted
            ? "bg-primary border-primary"
            : "border-primary hover:bg-primary"
        }`}
        data-testid={`button-toggle-task-${task.id}`}
      >
        {isCompleted && <Check className="w-3 h-3 text-primary-foreground" />}
      </button>

      <div className="flex-1">
        <p
          className={`text-sm ${
            isCompleted ? "line-through text-muted-foreground" : ""
          }`}
          data-testid={`text-task-title-${task.id}`}
        >
          {task.title}
        </p>
        {task.note && (
          <p
            className="text-xs text-muted-foreground"
            data-testid={`text-task-note-${task.id}`}
          >
            {task.note}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleteTaskMutation.isPending}
          className="text-muted-foreground hover:text-destructive p-1 h-auto"
          data-testid={`button-delete-task-${task.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground cursor-grab p-1 h-auto"
          data-testid={`button-drag-task-${task.id}`}
        >
          <GripVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
