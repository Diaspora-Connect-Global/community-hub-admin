/**
 * EventDetailModal
 *
 * The "View Event Details" dialog with four tabs:
 *   Overview | Analytics | Attendees | Group Chat (conditional)
 *
 * Receives all state it needs; no internal fetching — the parent
 * (Events.tsx) is responsible for triggering loadStats and loadAttendees.
 */
import {
  Edit, Share2, XCircle, Loader2,
  Calendar as CalendarIcon, MapPin, Globe, Clock, Users,
  MessageSquare, TrendingUp, PieChart, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Event } from "@/pages/events/types";
import { STATUS_COLORS, formatDateTime } from "@/pages/events/types";
import type { EventStats } from "@/services/graphql/events";
import { EventAttendeesPanel } from "@/pages/events/EventAttendeesPanel";
import { EventTicketsPanel } from "@/pages/events/EventTicketsPanel";

interface EventDetailModalProps {
  open: boolean;
  event: Event | null;
  detailTab: string;
  eventStats: EventStats | null;
  statsLoading: boolean;
  attendeesLoading: boolean;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  onEdit: (event: Event) => void;
  onCancelEvent: (event: Event) => void;
  onCheckIn: (attendeeId: string) => void;
}

export function EventDetailModal({
  open,
  event,
  detailTab,
  eventStats,
  statsLoading,
  attendeesLoading,
  onTabChange,
  onClose,
  onEdit,
  onCancelEvent,
  onCheckIn,
}: EventDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{event?.title}</DialogTitle>
          <DialogDescription>Event Details</DialogDescription>
        </DialogHeader>

        {event && (
          <Tabs value={detailTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              {event.createGroup && <TabsTrigger value="group">Group Chat</TabsTrigger>}
            </TabsList>

            {/* ---------------------------------------------------------------- */}
            {/* Overview                                                          */}
            {/* ---------------------------------------------------------------- */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={event.banner}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={STATUS_COLORS[event.status]}>{event.status}</Badge>
                <Badge variant="outline">{event.category}</Badge>
                <Badge variant="outline">
                  {event.pricingType === "Free"
                    ? "Free"
                    : event.ticketCategories.length > 0
                      ? `${event.ticketCategories.length} Ticket Types`
                      : "Paid"}
                </Badge>
                <Badge variant="outline">
                  {event.eventType === "Physical" ? "In-Person" : "Online"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Start: {formatDateTime(event.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>End: {formatDateTime(event.endDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {event.eventType === "Physical" ? (
                    <>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.venue}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={event.onlineLink}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Online
                      </a>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.registrations} registered •{" "}
                    {event.remainingSlots === "Unlimited"
                      ? "Unlimited"
                      : event.remainingSlots}{" "}
                    slots left
                  </span>
                </div>
              </div>

              {event.pricingType === "Paid" && (
                <EventTicketsPanel
                  ticketCategories={event.ticketCategories}
                  refundPolicy={event.refundPolicy}
                />
              )}

              <div className="prose prose-sm max-w-none">
                <h4 className="text-foreground font-medium">Description</h4>
                <p className="text-muted-foreground">{event.description}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { onClose(); onEdit(event); }}
                >
                  <Edit className="h-4 w-4 mr-2" />Edit Event
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />Share Event
                </Button>
                {event.status !== "Cancelled" && event.status !== "Completed" && (
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => { onClose(); onCancelEvent(event); }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />Cancel Event
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* ---------------------------------------------------------------- */}
            {/* Analytics                                                         */}
            {/* ---------------------------------------------------------------- */}
            <TabsContent value="analytics" className="space-y-6 mt-4">
              {statsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  Loading analytics…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Registrations</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {eventStats?.registrations ?? event.registrations}
                      </div>
                      <p className="text-xs text-muted-foreground">Total registrations</p>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <PieChart className="h-4 w-4" />
                        <span className="text-sm">Ticket types</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {event.ticketCategories.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Configured categories</p>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Saves</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {eventStats?.saveCount ?? "—"}
                      </div>
                      <p className="text-xs text-muted-foreground">Save count (backend)</p>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {(["pending", "cancelled", "checkIns", "revenue"] as const).map((key) => (
                      <div key={key} className="p-3 rounded-lg border border-border">
                        <span className="text-muted-foreground">
                          {key === "checkIns"
                            ? "Check-ins"
                            : key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <div className="font-semibold text-foreground">
                          {key === "revenue"
                            ? eventStats?.revenue != null
                              ? `$${Number(eventStats.revenue).toFixed(2)}`
                              : "—"
                            : (eventStats?.[key] ?? "—")}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground text-sm">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Trend charts and ticket-mix breakdown are not available from the API yet.</p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ---------------------------------------------------------------- */}
            {/* Attendees                                                         */}
            {/* ---------------------------------------------------------------- */}
            <TabsContent value="attendees">
              <EventAttendeesPanel
                attendees={event.attendees}
                loading={attendeesLoading}
                onCheckIn={onCheckIn}
              />
            </TabsContent>

            {/* ---------------------------------------------------------------- */}
            {/* Group Chat (conditional)                                          */}
            {/* ---------------------------------------------------------------- */}
            {event.createGroup && (
              <TabsContent value="group" className="space-y-4 mt-4">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{event.groupName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.registrations} members
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">View Group</Button>
                    <Button variant="outline">Manage Group</Button>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
