import { useState } from "react";
import { Plus, Calendar, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onCreateRehearsal: () => void;
  onCreateGig: () => void;
}

export function FloatingActionButton({
  onCreateRehearsal,
  onCreateGig,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleCreateRehearsal = () => {
    setIsOpen(false);
    onCreateRehearsal();
  };

  const handleCreateGig = () => {
    setIsOpen(false);
    onCreateGig();
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-md w-full flex justify-end pr-6" data-testid="floating-action-button">
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <Button
            onClick={handleCreateRehearsal}
            className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-all transform hover:translate-x-1"
            data-testid="button-new-rehearsal"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">New Rehearsal</span>
          </Button>
          <Button
            onClick={handleCreateGig}
            className="flex items-center bg-secondary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-secondary/90 transition-all transform hover:translate-x-1"
            data-testid="button-new-gig"
          >
            <Mic className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">New Gig</span>
          </Button>
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={toggleMenu}
        className="w-14 h-14 stage-lighting rounded-full shadow-lg hover:scale-110 transition-transform p-0"
        data-testid="button-fab-toggle"
      >
        {isOpen ? (
          <X className="text-white w-5 h-5 transform rotate-90 transition-transform" />
        ) : (
          <Plus className="text-white w-5 h-5 transform rotate-0 transition-transform" />
        )}
      </Button>
    </div>
  );
}
