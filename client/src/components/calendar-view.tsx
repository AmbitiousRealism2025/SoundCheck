import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Music, Mic, Plus, ExternalLink } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import type { RehearsalWithTasks, Gig } from "@shared/schema";

interface CalendarViewProps {
  rehearsals: RehearsalWithTasks[];
  gigs: Gig[];
  isLoading: boolean;
  onDateSelect?: (date: Date) => void;
  onCreateRehearsal?: (initialDate?: Date) => void;
  onCreateGig?: (initialDate?: Date) => void;
}

interface CalendarEvent {
  id: string;
  type: "rehearsal" | "gig";
  title: string;
  time: string;
  location?: string;
  compensation?: string;
  data: RehearsalWithTasks | Gig;
}

export function CalendarView({
  rehearsals,
  gigs,
  isLoading,
  onDateSelect,
  onCreateRehearsal,
  onCreateGig,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>();

  // Process rehearsals
  rehearsals.forEach((rehearsal) => {
    const date = new Date(rehearsal.date);
    const dateKey = format(date, "yyyy-MM-dd");
    const event: CalendarEvent = {
      id: rehearsal.id,
      type: "rehearsal",
      title: rehearsal.eventName,
      time: format(date, "h:mm a"),
      location: rehearsal.location,
      data: rehearsal,
    };

    const existing = eventsByDate.get(dateKey) || [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  });

  // Process gigs
  gigs.forEach((gig) => {
    const date = new Date(gig.date);
    const dateKey = format(date, "yyyy-MM-dd");
    const event: CalendarEvent = {
      id: gig.id,
      type: "gig",
      title: gig.venueName,
      time: format(date, "h:mm a"),
      location: gig.venueAddress || undefined,
      compensation: gig.compensation || undefined,
      data: gig,
    };

    const existing = eventsByDate.get(dateKey) || [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  });

  // Get events for selected date
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateEvents = eventsByDate.get(selectedDateKey) || [];

  // Get days with events for visual highlighting
  const daysWithEvents = Array.from(eventsByDate.keys()).map(dateKey => {
    // Parse dateKey (YYYY-MM-DD) to prevent UTC midnight interpretation
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const modifiers = {
    hasEvents: daysWithEvents,
  };

  // Use a subtle dot to indicate days with events to avoid clashing with selection styles
  const modifiersClassNames = {
    hasEvents:
      "relative after:block after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary after:mx-auto after:mt-1.5",
  } as const;

  const generateCalendarFile = () => {
    const allEvents = [...rehearsals, ...gigs];
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    
    // Helper function to escape text for iCal format
    const escapeText = (text: string) => {
      if (!text) return "";
      return text
        .replace(/\\/g, "\\\\")  // Escape backslashes
        .replace(/;/g, "\\;")    // Escape semicolons
        .replace(/,/g, "\\,")    // Escape commas
        .replace(/\n/g, "\\n")   // Escape newlines
        .replace(/\r/g, "");     // Remove carriage returns
    };

    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SoundCheck//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    allEvents.forEach((event) => {
      const date = new Date(event.date);
      
      // Convert to proper UTC before formatting with Z suffix
      const startTime = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      
      // Set duration based on event type - gigs are typically longer
      const isRehearsal = 'eventName' in event;
      const durationHours = isRehearsal ? 2 : 4; // Rehearsals: 2 hours, Gigs: 4 hours
      const endDate = new Date(date.getTime() + durationHours * 60 * 60 * 1000);
      const endTime = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      
      const title = escapeText(isRehearsal ? event.eventName : event.venueName);
      const location = escapeText(isRehearsal ? event.location : event.venueAddress || "");
      
      // Build description with more details
      let description = isRehearsal ? "Rehearsal" : "Gig";
      if (!isRehearsal && (event as Gig).compensation) {
        description += ` - Compensation: $${(event as Gig).compensation}`;
      }
      if (!isRehearsal && (event as Gig).callTime) {
        const callTime = new Date((event as Gig).callTime!);
        description += ` - Call Time: ${format(callTime, "h:mm a")}`;
      }
      if (!isRehearsal && (event as Gig).notes) {
        description += ` - Notes: ${(event as Gig).notes}`;
      }

      icalContent.push(
        "BEGIN:VEVENT",
        `UID:${event.id}@soundcheck.app`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${title}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${escapeText(description)}`,
        `STATUS:CONFIRMED`,
        `TRANSP:OPAQUE`,
        "END:VEVENT"
      );
    });

    icalContent.push("END:VCALENDAR");
    return icalContent.join("\r\n");
  };

  const downloadCalendar = () => {
    const icalContent = generateCalendarFile();
    const blob = new Blob([icalContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soundcheck-calendar.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-4"></div>
          <div className="h-80 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Schedule</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCalendar}
          data-testid="button-export-calendar"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 overflow-x-hidden">
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-hidden">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border w-full max-w-full overflow-hidden"
              data-testid="calendar-picker"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span>Days with events</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(selectedDate, "MMM d, yyyy")}
              </CardTitle>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateRehearsal?.(selectedDate)}
                  data-testid="button-add-rehearsal"
                >
                  <Music className="w-3 h-3 mr-1" />
                  Rehearsal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateGig?.(selectedDate)}
                  data-testid="button-add-gig"
                >
                  <Mic className="w-3 h-3 mr-1" />
                  Gig
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8" data-testid="no-events">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-3">No events scheduled</p>
                <div className="flex space-x-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateRehearsal?.(selectedDate)}
                    data-testid="button-create-rehearsal"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Add Rehearsal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateGig?.(selectedDate)}
                    data-testid="button-create-gig"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Add Gig
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents
                  .sort((a, b) => {
                    // Sort by actual date/time instead of formatted string
                    const dateA = new Date(a.data.date);
                    const dateB = new Date(b.data.date);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className="p-3 bg-muted rounded-lg space-y-2"
                      data-testid={`event-${event.type}-${event.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {event.type === "rehearsal" ? (
                            <Music className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Mic className="w-4 h-4 text-green-600" />
                          )}
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {event.time}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={event.type === "rehearsal" ? "secondary" : "default"}
                          data-testid={`badge-${event.type}`}
                        >
                          {event.type === "rehearsal" ? "Rehearsal" : "Gig"}
                        </Badge>
                      </div>
                      
                      {event.location && (
                        <div className="text-sm text-muted-foreground">
                          📍 {event.location}
                        </div>
                      )}
                      
                      {event.compensation && (
                        <div className="text-sm text-green-600 font-medium">
                          💰 ${event.compensation}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {rehearsals.filter(r => {
                  const date = new Date(r.date);
                  return date.getMonth() === selectedDate.getMonth() && 
                         date.getFullYear() === selectedDate.getFullYear();
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Rehearsals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {gigs.filter(g => {
                  const date = new Date(g.date);
                  return date.getMonth() === selectedDate.getMonth() && 
                         date.getFullYear() === selectedDate.getFullYear();
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Gigs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set([...rehearsals, ...gigs].map(event => {
                  const date = new Date(event.date);
                  if (date.getMonth() === selectedDate.getMonth() && 
                      date.getFullYear() === selectedDate.getFullYear()) {
                    return format(date, "yyyy-MM-dd");
                  }
                  return null;
                }).filter(Boolean)).size}
              </div>
              <div className="text-sm text-muted-foreground">Busy Days</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
