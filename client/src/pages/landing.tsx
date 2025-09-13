import { Music, Calendar, Mic, MapPin, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Hero Section */}
      <header className="text-center pt-16 pb-8 px-6">
        <div className="w-16 h-16 stage-lighting rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Music className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-3" data-testid="text-app-title">SoundCheck</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Your complete gig assistant for rehearsal prep and show management
        </p>
      </header>

      {/* Features Grid */}
      <div className="px-6 mb-12">
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Rehearsal Planning</h3>
              <p className="text-sm text-muted-foreground">
                Organize practice sessions with task lists and preparation notes
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mic className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Gig Management</h3>
              <p className="text-sm text-muted-foreground">
                Track venues, compensation, call times, and show details
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Venue Navigation</h3>
              <p className="text-sm text-muted-foreground">
                One-tap directions and instant venue contact access
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Professional Tools</h3>
              <p className="text-sm text-muted-foreground">
                Mobile-optimized design for musicians on the go
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-6 pb-8">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to get organized?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Join musicians who trust SoundCheck for their gig management
          </p>
          <Button
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3"
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-8 px-6">
        <p className="text-xs text-muted-foreground">
          Professional gig management for serious musicians
        </p>
      </footer>
    </div>
  );
}