import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, MapPin, Phone, Navigation, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Gig } from "@shared/schema";

interface GigCardProps {
  gig: Gig;
  onEdit: () => void;
}

export function GigCard({ gig, onEdit }: GigCardProps) {
  const { toast } = useToast();

  const handleGetDirections = () => {
    if (!gig.venueAddress) {
      toast({
        title: "No address available",
        description: "Please add the venue address to get directions",
        variant: "destructive",
      });
      return;
    }

    const encodedAddress = encodeURIComponent(gig.venueAddress);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, "_blank");
  };

  const handleContactVenue = () => {
    if (!gig.venueContact) {
      toast({
        title: "No contact available",
        description: "Please add the venue contact to reach out",
        variant: "destructive",
      });
      return;
    }

    if (gig.venueContact.includes("@")) {
      window.location.href = `mailto:${gig.venueContact}`;
    } else {
      window.location.href = `tel:${gig.venueContact}`;
    }
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "MMM d, h:mm a");
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "Not set";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "h:mm a");
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "Not set";
    return `$${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <Card className="bg-card border-border" data-testid={`gig-card-${gig.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg" data-testid={`text-venue-name-${gig.id}`}>
              {gig.venueName}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              <span data-testid={`text-gig-date-${gig.id}`}>
                {formatDateTime(gig.date)}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
            data-testid={`button-edit-gig-${gig.id}`}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Gig Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Call Time
            </p>
            <p className="text-sm" data-testid={`text-call-time-${gig.id}`}>
              {formatTime(gig.callTime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Pay
            </p>
            <p className="text-sm font-medium text-green-400" data-testid={`text-compensation-${gig.id}`}>
              {formatCurrency(gig.compensation)}
            </p>
          </div>
        </div>

        {/* Venue Info */}
        {(gig.venueAddress || gig.venueContact) && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Venue
            </p>
            {gig.venueAddress && (
              <p className="text-sm flex items-center mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span data-testid={`text-venue-address-${gig.id}`}>
                  {gig.venueAddress}
                </span>
              </p>
            )}
            {gig.venueContact && (
              <p className="text-sm text-muted-foreground" data-testid={`text-venue-contact-${gig.id}`}>
                {gig.venueContact}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {gig.notes && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Notes
            </p>
            <p className="text-sm" data-testid={`text-gig-notes-${gig.id}`}>
              {gig.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleGetDirections}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid={`button-directions-${gig.id}`}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
          <Button
            onClick={handleContactVenue}
            className="flex-1 bg-secondary text-white hover:bg-secondary/90"
            data-testid={`button-contact-${gig.id}`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
