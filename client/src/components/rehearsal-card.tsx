import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, MapPin, MoreVertical, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RehearsalWithTasks, Task, InsertTask } from "@shared/schema";

interface RehearsalCardProps {
  rehearsal: RehearsalWithTasks;
  onEdit: () => void;
}

export function RehearsalCard({ rehearsal, onEdit }: RehearsalCardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: InsertTask) => {
      const response = await apiRequest(
        "POST",
        `/api/rehearsals/${rehearsal.id}/tasks`,
        taskData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
      setNewTaskTitle("");
      setShowAddTask(false);
      toast({
        title: "Task added",
        description: "New task has been added to the rehearsal",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const response = await apiRequest(
        "POST",
        `/api/rehearsals/${rehearsal.id}/tasks/reorder`,
        { taskIds }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const taskData: InsertTask = {
      rehearsalId: rehearsal.id,
      title: newTaskTitle.trim(),
      note: "",
      status: "open",
      order: rehearsal.tasks.length,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleTaskReorder = (taskIds: string[]) => {
    reorderTasksMutation.mutate(taskIds);
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "MMM d, h:mm a");
  };

  return (
    <Card className="bg-card border-border" data-testid={`rehearsal-card-${rehearsal.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg" data-testid={`text-rehearsal-name-${rehearsal.id}`}>
              {rehearsal.eventName}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              <span data-testid={`text-rehearsal-date-${rehearsal.id}`}>
                {formatDateTime(rehearsal.date)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span data-testid={`text-rehearsal-location-${rehearsal.id}`}>
                {rehearsal.location}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
            data-testid={`button-edit-rehearsal-${rehearsal.id}`}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Tasks Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Tasks
          </h4>

          {/* Task List */}
          <div className="space-y-2" data-testid={`tasks-list-${rehearsal.id}`}>
            {rehearsal.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                rehearsalId={rehearsal.id}
                onReorder={handleTaskReorder}
              />
            ))}
          </div>

          {/* Add Task Input */}
          {showAddTask ? (
            <div className="flex space-x-2 p-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                  if (e.key === "Escape") {
                    setShowAddTask(false);
                    setNewTaskTitle("");
                  }
                }}
                autoFocus
                data-testid={`input-new-task-${rehearsal.id}`}
              />
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                size="sm"
                data-testid={`button-save-task-${rehearsal.id}`}
              >
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddTask(false);
                  setNewTaskTitle("");
                }}
                size="sm"
                data-testid={`button-cancel-task-${rehearsal.id}`}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddTask(true)}
              className="w-full border-dashed text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              data-testid={`button-add-task-${rehearsal.id}`}
            >
              + Add Task
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
