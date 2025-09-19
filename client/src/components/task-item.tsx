import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface TaskItemProps {
  task: Task;
  rehearsalId: string;
  onReorder: (taskIds: string[]) => void;
}

export function TaskItem({ task, rehearsalId, onReorder }: TaskItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    deleteTaskMutation.mutate();
  };

  const isCompleted = task.status === "closed";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedTaskId = e.dataTransfer.getData("text/plain");
    
    if (draggedTaskId !== task.id) {
      // Get all task elements to determine new order
      const taskContainer = e.currentTarget.parentElement;
      if (taskContainer) {
        const taskElements = Array.from(taskContainer.children);
        const draggedElement = taskElements.find(el => 
          el.getAttribute('data-testid') === `task-item-${draggedTaskId}`
        );
        const targetElement = e.currentTarget;
        
        if (draggedElement && targetElement) {
          const draggedIndex = taskElements.indexOf(draggedElement);
          const targetIndex = taskElements.indexOf(targetElement);
          
          // Create new order array
          const taskIds = taskElements.map(el => {
            const testId = el.getAttribute('data-testid');
            return testId?.replace('task-item-', '') || '';
          }).filter(id => id);
          
          // Move the dragged item to new position
          const newTaskIds = [...taskIds];
          const [movedTask] = newTaskIds.splice(draggedIndex, 1);
          newTaskIds.splice(targetIndex, 0, movedTask);
          
          onReorder(newTaskIds);
        }
      }
    }
  };

  return (
    <>
      <div
        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors group"
        data-testid={`task-item-${task.id}`}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button
          onClick={handleToggleComplete}
          disabled={updateTaskMutation.isPending}
          className={`w-11 h-11 border-2 rounded-lg flex items-center justify-center transition-colors ${
            isCompleted
              ? "bg-primary border-primary"
              : "border-muted-foreground/50 hover:border-primary hover:bg-primary/10"
          }`}
          data-testid={`button-toggle-task-${task.id}`}
        >
          {isCompleted && <Check className="w-6 h-6 text-primary-foreground" />}
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

        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="default"
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
            className="text-muted-foreground hover:text-destructive"
            data-testid={`button-delete-task-${task.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="text-muted-foreground hover:text-foreground cursor-grab"
            data-testid={`button-drag-task-${task.id}`}
          >
            <GripVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid={`button-cancel-delete-task-${task.id}`}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid={`button-confirm-delete-task-${task.id}`}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
