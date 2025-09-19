import { Music, Calendar, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface OnboardingTutorialProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingTutorial({ open, onClose }: OnboardingTutorialProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-8" data-testid="onboarding-modal">
        <div className="text-center mb-6">
          <div className="w-16 h-16 stage-lighting rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="text-primary-foreground text-2xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome-title">
            Welcome to SoundCheck
          </h2>
          <p className="text-muted-foreground" data-testid="text-welcome-subtitle">
            Your all-in-one assistant for managing rehearsals and gigs
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Calendar className="text-primary-foreground text-sm" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-rehearsals-feature">
                Rehearsals Tab
              </p>
              <p className="text-sm text-muted-foreground">Manage practice sessions and tasks</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Mic className="text-secondary-foreground text-sm" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-gigs-feature">
                Gigs Tab
              </p>
              <p className="text-sm text-muted-foreground">Track venues, pay, and logistics</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <Plus className="text-accent-foreground text-sm" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-quick-add-feature">
                Quick Add
              </p>
              <p className="text-sm text-muted-foreground">Use the + button to create new events</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-get-started"
        >
          Get Started
        </Button>
      </DialogContent>
    </Dialog>
  );
}
