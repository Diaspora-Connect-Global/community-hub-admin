import { useTranslation } from "react-i18next";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  Globe,
  FileText,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Event } from "@/pages/events/types";
import {
  EVENT_CATEGORIES,
  STATUS_COLORS,
  formatDateTime,
} from "@/pages/events/types";

interface EventsTableProps {
  events: Event[];
  activeTab: "pending" | "past";
  searchQuery: string;
  categoryFilter: string;
  pendingCount: number;
  pastCount: number;
  onTabChange: (tab: "pending" | "past") => void;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onView: (event: Event) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onViewAttendees: (event: Event) => void;
  onCancelEvent: (event: Event) => void;
}

export function EventsTable({
  events,
  activeTab,
  searchQuery,
  categoryFilter,
  pendingCount,
  pastCount,
  onTabChange,
  onSearchChange,
  onCategoryChange,
  onView,
  onEdit,
  onDelete,
  onViewAttendees,
  onCancelEvent,
}: EventsTableProps) {
  const { t } = useTranslation();

  const filteredEvents = events.filter((event) => {
    const matchesTab =
      activeTab === "pending"
        ? event.status === "Upcoming" || event.status === "Ongoing"
        : event.status === "Completed" || event.status === "Cancelled";
    const matchesCategory =
      categoryFilter === "All Categories" ||
      event.category === categoryFilter;
    return matchesTab && matchesCategory;
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as "pending" | "past")}
      className="w-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            {t("events.pending")}
            <Badge variant="secondary" className="ml-1">
              {pendingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            {t("events.past")}
            <Badge variant="secondary" className="ml-1">
              {pastCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("events.searchEvents")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("events.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="pending" className="mt-6">
        <EventCardGrid
          events={filteredEvents}
          emptyMessage="No pending events found."
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewAttendees={onViewAttendees}
          onCancelEvent={onCancelEvent}
          showEdit
        />
      </TabsContent>

      <TabsContent value="past" className="mt-6">
        <EventCardGrid
          events={filteredEvents}
          emptyMessage="No past events found."
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewAttendees={onViewAttendees}
          onCancelEvent={onCancelEvent}
          showEdit={false}
        />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Internal card-grid — same markup as the original for both tabs
// ---------------------------------------------------------------------------

interface EventCardGridProps {
  events: Event[];
  emptyMessage: string;
  showEdit: boolean;
  onView: (event: Event) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onViewAttendees: (event: Event) => void;
  onCancelEvent: (event: Event) => void;
}

function EventCardGrid({
  events,
  emptyMessage,
  showEdit,
  onView,
  onEdit,
  onDelete,
  onViewAttendees,
  onCancelEvent,
}: EventCardGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card
          key={event.id}
          className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow"
        >
          <div className="aspect-video relative bg-muted">
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={STATUS_COLORS[event.status]}>
                {event.status}
              </Badge>
              <Badge variant="outline" className="bg-background/80">
                {event.pricingType === "Free"
                  ? "Free"
                  : event.ticketCategories.length > 0
                    ? `From $${Math.min(...event.ticketCategories.map((t) => t.price))}`
                    : "Paid"}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {event.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDateTime(event.startDateTime)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {event.eventType === "Physical" ? (
                <>
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{event.venue}</span>
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  <span>Online Event</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {event.registrations}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {event.remainingSlots === "Unlimited"
                    ? "Unlimited slots"
                    : `${event.remainingSlots} slots left`}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onView(event)}
                    className="text-foreground"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {showEdit && (
                    <DropdownMenuItem
                      onClick={() => onEdit(event)}
                      className="text-foreground"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Event
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onViewAttendees(event)}
                    className="text-foreground"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Attendees
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {event.status !== "Cancelled" &&
                    event.status !== "Completed" && (
                      <DropdownMenuItem
                        onClick={() => onCancelEvent(event)}
                        className="text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Event
                      </DropdownMenuItem>
                    )}
                  <DropdownMenuItem
                    onClick={() => onDelete(event)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
