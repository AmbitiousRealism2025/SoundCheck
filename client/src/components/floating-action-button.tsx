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
    <>
      {/* Menu Items */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-6 bottom-safe-20 right-safe-6 space-y-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 floating-action-button"
          role="menu"
          aria-labelledby="fab-button"
          data-testid="fab-menu"
        >
          <Button
            onClick={handleCreateRehearsal}
            variant="default"
            size="lg"
            className="w-full justify-start shadow-lg transition-all transform hover:-translate-x-1"
            data-testid="button-new-rehearsal"
            role="menuitem"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">New Rehearsal</span>
          </Button>
          <Button
            onClick={handleCreateGig}
            variant="secondary"
            size="lg"
            className="w-full justify-start shadow-lg transition-all transform hover:-translate-x-1"
            data-testid="button-new-gig"
            role="menuitem"
          >
            <Mic className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">New Gig</span>
          </Button>
        </div>
      )}

      {/* Main FAB */}
      <Button
        id="fab-button"
        onClick={toggleMenu}
        size="icon"
        className="fixed bottom-6 right-6 bottom-safe-6 right-safe-6 stage-lighting rounded-full shadow-lg hover:scale-110 transition-transform floating-action-button"
        data-testid="button-fab-toggle"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? "Close menu" : "Open create menu"}
      >
        {isOpen ? (
          <X className="text-primary-foreground w-5 h-5 transform rotate-90 transition-transform" />
        ) : (
          <Plus className="text-primary-foreground w-5 h-5 transform rotate-0 transition-transform" />
        )}
      </Button>
    </>
  );
}
