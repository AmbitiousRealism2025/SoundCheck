import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { RehearsalCard } from "@/components/rehearsal-card";
import { GigCard } from "@/components/gig-card";
import { FloatingActionButton } from "@/components/floating-action-button";
import { RehearsalFormModal } from "@/components/rehearsal-form-modal";
import { GigFormModal } from "@/components/gig-form-modal";
import { EarningsTracker } from "@/components/earnings-tracker";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { RehearsalWithTasks, Gig } from "@shared/schema";

type Tab = "rehearsals" | "gigs" | "earnings";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>("rehearsals");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRehearsalModal, setShowRehearsalModal] = useState(false);
  const [showGigModal, setShowGigModal] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<RehearsalWithTasks | null>(null);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  
  const [onboardingCompleted, setOnboardingCompleted] = useLocalStorage(
    "soundcheck-onboarding-completed",
    false
  );

  const {
    data: rehearsals = [],
    isLoading: rehearsalsLoading,
    error: rehearsalsError
  } = useQuery<RehearsalWithTasks[]>({
    queryKey: ["/api/rehearsals"],
  });

  const {
    data: gigs = [],
    isLoading: gigsLoading,
    error: gigsError
  } = useQuery<Gig[]>({
    queryKey: ["/api/gigs"],
  });

  useEffect(() => {
    if (!onboardingCompleted) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };

  const handleCreateRehearsal = () => {
    setEditingRehearsal(null);
    setShowRehearsalModal(true);
  };

  const handleEditRehearsal = (rehearsal: RehearsalWithTasks) => {
    setEditingRehearsal(rehearsal);
    setShowRehearsalModal(true);
  };

  const handleCreateGig = () => {
    setEditingGig(null);
    setShowGigModal(true);
  };

  const handleEditGig = (gig: Gig) => {
    setEditingGig(gig);
    setShowGigModal(true);
  };

  if (rehearsalsError || gigsError) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="text-destructive-foreground text-2xl" />
          </div>
          <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">
            {rehearsalsError ? "Failed to load rehearsals. " : ""}
            {gigsError ? "Failed to load gigs. " : ""}
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-md mx-auto bg-background min-h-screen relative">
        {/* Header */}
        <header className="bg-card border-b border-border p-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 stage-lighting rounded-lg flex items-center justify-center">
                <Music className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold" data-testid="text-app-title">SoundCheck</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="bg-card border-b border-border" data-testid="tab-navigation">
          <div className="flex">
            <button
              onClick={() => setCurrentTab("rehearsals")}
              className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                currentTab === "rehearsals"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid="tab-rehearsals"
            >
              Rehearsals
            </button>
            <button
              onClick={() => setCurrentTab("gigs")}
              className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                currentTab === "gigs"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid="tab-gigs"
            >
              Gigs
            </button>
            <button
              onClick={() => setCurrentTab("earnings")}
              className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                currentTab === "earnings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid="tab-earnings"
            >
              Earnings
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pb-20">
          {/* Rehearsals Tab */}
          {currentTab === "rehearsals" && (
            <div className="p-4 space-y-4" data-testid="rehearsals-content">
              {rehearsalsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading rehearsals...</p>
                </div>
              ) : rehearsals.length === 0 ? (
                <div className="text-center py-12" data-testid="rehearsals-empty">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="text-muted-foreground text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No rehearsals scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    Tap the + button to schedule your first practice session
                  </p>
                </div>
              ) : (
                rehearsals.map((rehearsal) => (
                  <RehearsalCard
                    key={rehearsal.id}
                    rehearsal={rehearsal}
                    onEdit={() => handleEditRehearsal(rehearsal)}
                  />
                ))
              )}
            </div>
          )}

          {/* Gigs Tab */}
          {currentTab === "gigs" && (
            <div className="p-4 space-y-4" data-testid="gigs-content">
              {gigsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading gigs...</p>
                </div>
              ) : gigs.length === 0 ? (
                <div className="text-center py-12" data-testid="gigs-empty">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="text-muted-foreground text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No gigs scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    Tap the + button to add your first gig
                  </p>
                </div>
              ) : (
                gigs.map((gig) => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    onEdit={() => handleEditGig(gig)}
                  />
                ))
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {currentTab === "earnings" && (
            <div className="p-4" data-testid="earnings-content">
              <EarningsTracker gigs={gigs} isLoading={gigsLoading} />
            </div>
          )}
        </main>

        {/* Floating Action Button */}
        <FloatingActionButton
          onCreateRehearsal={handleCreateRehearsal}
          onCreateGig={handleCreateGig}
        />
      </div>

      {/* Modals */}
      <OnboardingTutorial
        open={showOnboarding}
        onClose={handleOnboardingComplete}
      />

      <RehearsalFormModal
        open={showRehearsalModal}
        onClose={() => setShowRehearsalModal(false)}
        rehearsal={editingRehearsal}
      />

      <GigFormModal
        open={showGigModal}
        onClose={() => setShowGigModal(false)}
        gig={editingGig}
      />
    </>
  );
}
