import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertRehearsalSchema, type RehearsalWithTasks } from "@shared/schema";

const formSchema = insertRehearsalSchema.extend({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type FormData = z.infer<typeof formSchema>;

interface RehearsalFormModalProps {
  open: boolean;
  onClose: () => void;
  rehearsal?: RehearsalWithTasks | null;
  initialDate?: Date | null;
}

export function RehearsalFormModal({ open, onClose, rehearsal, initialDate }: RehearsalFormModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!rehearsal;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      location: "",
      date: "",
      time: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Combine date and time into a single DateTime
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      const requestData = {
        eventName: data.eventName,
        location: data.location,
        date: dateTime.toISOString(),
      };

      const response = await apiRequest("POST", "/api/rehearsals", requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
      toast({
        title: "Rehearsal created",
        description: "Your new rehearsal has been scheduled",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create rehearsal",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!rehearsal) throw new Error("No rehearsal to update");
      
      // Combine date and time into a single DateTime
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      const requestData = {
        eventName: data.eventName,
        location: data.location,
        date: dateTime.toISOString(),
      };

      const response = await apiRequest("PUT", `/api/rehearsals/${rehearsal.id}`, requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
      toast({
        title: "Rehearsal updated",
        description: "Your rehearsal has been updated",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rehearsal",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!rehearsal) throw new Error("No rehearsal to delete");
      await apiRequest("DELETE", `/api/rehearsals/${rehearsal.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rehearsals"] });
      toast({
        title: "Rehearsal deleted",
        description: "Your rehearsal has been deleted",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rehearsal",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (rehearsal && open) {
      const rehearsalDate = new Date(rehearsal.date);
      const dateString = format(rehearsalDate, 'yyyy-MM-dd');
      const timeString = format(rehearsalDate, 'HH:mm');

      form.reset({
        eventName: rehearsal.eventName,
        location: rehearsal.location,
        date: dateString,
        time: timeString,
      });
    } else if (open && !rehearsal) {
      // Set initial date if provided, otherwise use empty values
      const dateString = initialDate ? format(initialDate, 'yyyy-MM-dd') : "";
      
      form.reset({
        eventName: "",
        location: "",
        date: dateString,
        time: "",
      });
    }
  }, [rehearsal, open, initialDate, form]);

  const handleSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    deleteMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-screen overflow-y-auto" data-testid="rehearsal-form-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="text-modal-title">
              {isEditing ? "Edit Rehearsal" : "New Rehearsal"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 h-auto"
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Jazz trio practice"
                      className="bg-input border-border"
                      data-testid="input-event-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-input border-border"
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="bg-input border-border"
                        data-testid="input-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Studio 5, Downtown"
                      className="bg-input border-border"
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={`flex space-x-3 pt-4 ${isEditing ? 'flex-col space-y-3 space-x-0' : ''}`}>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                  data-testid="button-delete-rehearsal"
                >
                  Delete Rehearsal
                </Button>
              )}
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-submit"
                >
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rehearsal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rehearsal? All associated tasks will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
