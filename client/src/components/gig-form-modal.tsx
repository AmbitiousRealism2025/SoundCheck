import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertGigSchema, type Gig } from "@shared/schema";

const formSchema = insertGigSchema.extend({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Show time is required"),
  callTimeInput: z.string().optional(),
  compensationInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface GigFormModalProps {
  open: boolean;
  onClose: () => void;
  gig?: Gig | null;
}

export function GigFormModal({ open, onClose, gig }: GigFormModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!gig;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      venueName: "",
      venueAddress: "",
      venueContact: "",
      date: "",
      time: "",
      callTimeInput: "",
      compensationInput: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Combine date and time into a single DateTime for show time
      const showDateTime = new Date(`${data.date}T${data.time}`);
      
      // Handle call time if provided
      let callDateTime = null;
      if (data.callTimeInput) {
        callDateTime = new Date(`${data.date}T${data.callTimeInput}`);
      }

      const requestData = {
        venueName: data.venueName,
        venueAddress: data.venueAddress || null,
        venueContact: data.venueContact || null,
        date: showDateTime.toISOString(),
        callTime: callDateTime?.toISOString() || null,
        compensation: data.compensationInput || null,
        notes: data.notes || null,
      };

      const response = await apiRequest("POST", "/api/gigs", requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Gig created",
        description: "Your new gig has been added",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create gig",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!gig) throw new Error("No gig to update");
      
      // Combine date and time into a single DateTime for show time
      const showDateTime = new Date(`${data.date}T${data.time}`);
      
      // Handle call time if provided
      let callDateTime = null;
      if (data.callTimeInput) {
        callDateTime = new Date(`${data.date}T${data.callTimeInput}`);
      }

      const requestData = {
        venueName: data.venueName,
        venueAddress: data.venueAddress || null,
        venueContact: data.venueContact || null,
        date: showDateTime.toISOString(),
        callTime: callDateTime?.toISOString() || null,
        compensation: data.compensationInput || null,
        notes: data.notes || null,
      };

      const response = await apiRequest("PUT", `/api/gigs/${gig.id}`, requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Gig updated",
        description: "Your gig has been updated",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update gig",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!gig) throw new Error("No gig to delete");
      await apiRequest("DELETE", `/api/gigs/${gig.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Gig deleted",
        description: "Your gig has been deleted",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete gig",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (gig && open) {
      const gigDate = new Date(gig.date);
      const dateString = gigDate.toISOString().split('T')[0];
      const timeString = gigDate.toTimeString().slice(0, 5);
      
      let callTimeString = "";
      if (gig.callTime) {
        const callTime = new Date(gig.callTime);
        callTimeString = callTime.toTimeString().slice(0, 5);
      }

      form.reset({
        venueName: gig.venueName,
        venueAddress: gig.venueAddress || "",
        venueContact: gig.venueContact || "",
        date: dateString,
        time: timeString,
        callTimeInput: callTimeString,
        compensationInput: gig.compensation || "",
        notes: gig.notes || "",
      });
    } else if (open && !gig) {
      form.reset({
        venueName: "",
        venueAddress: "",
        venueContact: "",
        date: "",
        time: "",
        callTimeInput: "",
        compensationInput: "",
        notes: "",
      });
    }
  }, [gig, open, form]);

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
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-screen overflow-y-auto" data-testid="gig-form-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="text-modal-title">
              {isEditing ? "Edit Gig" : "New Gig"}
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
              name="venueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="The Blue Note"
                      className="bg-input border-border"
                      data-testid="input-venue-name"
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
                    <FormLabel>Show Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="bg-input border-border"
                        data-testid="input-show-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="callTimeInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Time</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      className="bg-input border-border"
                      data-testid="input-call-time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venueAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="131 W 3rd St, New York, NY"
                      className="bg-input border-border"
                      data-testid="input-venue-address"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venueContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="booking@venue.com"
                      className="bg-input border-border"
                      data-testid="input-venue-contact"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compensationInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compensation</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="500"
                      className="bg-input border-border"
                      data-testid="input-compensation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="2 sets, 45 mins each. Backline provided."
                      className="bg-input border-border h-20"
                      data-testid="input-notes"
                      value={field.value ?? ""}
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
                  data-testid="button-delete-gig"
                >
                  Delete Gig
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
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Gig</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this gig? This action cannot be undone.
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
    </>
  );
}
