import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Users, MapPin, 
  Calendar as CalendarIcon, Clock, DollarSign, Globe, Building, 
  Share2, FileText, CheckCircle, XCircle, BarChart3, PieChart, TrendingUp,
  MessageSquare, Download, Filter, X
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  ticketType: string;
  paymentStatus: string;
  checkInStatus: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  banner: string;
  eventType: "Physical" | "Online";
  venue?: string;
  onlineLink?: string;
  startDateTime: string;
  endDateTime: string;
  participantLimit: "Unlimited" | "Set Limit";
  maxParticipants?: number;
  pricingType: "Free" | "Paid";
  ticketCategories: TicketCategory[];
  refundPolicy?: string;
  createGroup: boolean;
  groupName?: string;
  registrations: number;
  remainingSlots: number | "Unlimited";
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  attendees: Attendee[];
}

const mockAttendees: Attendee[] = [
  { id: "ATT001", name: "John Doe", email: "john@example.com", registrationDate: "2024-01-15", ticketType: "Regular", paymentStatus: "Paid", checkInStatus: "Pending" },
  { id: "ATT002", name: "Jane Smith", email: "jane@example.com", registrationDate: "2024-01-16", ticketType: "Early Bird", paymentStatus: "Paid", checkInStatus: "Checked In" },
  { id: "ATT003", name: "Mike Johnson", email: "mike@example.com", registrationDate: "2024-01-17", ticketType: "Regular", paymentStatus: "Pending", checkInStatus: "Pending" },
  { id: "ATT004", name: "Sarah Wilson", email: "sarah@example.com", registrationDate: "2024-01-18", ticketType: "VIP", paymentStatus: "Paid", checkInStatus: "Checked In" },
  { id: "ATT005", name: "David Brown", email: "david@example.com", registrationDate: "2024-01-19", ticketType: "Regular", paymentStatus: "Paid", checkInStatus: "Pending" },
];

const eventsData: Event[] = [
  { 
    id: "EVT001", 
    title: "Cultural Festival 2024", 
    description: "Our annual cultural festival featuring performances, food, and activities from various cultural backgrounds. Fun for the whole family!",
    category: "Social Event",
    banner: "/placeholder.svg",
    eventType: "Physical",
    venue: "Community Center, 123 Main St",
    startDateTime: "2024-02-15T10:00",
    endDateTime: "2024-02-15T18:00",
    participantLimit: "Set Limit",
    maxParticipants: 500,
    pricingType: "Paid",
    ticketCategories: [
      { id: "TC001", name: "Regular", price: 25, description: "Standard admission" },
      { id: "TC002", name: "VIP", price: 75, description: "VIP seating and refreshments" },
      { id: "TC003", name: "Early Bird", price: 15, description: "Limited early bird tickets" }
    ],
    refundPolicy: "Full refund before event start",
    createGroup: true,
    groupName: "Cultural Festival 2024 Group",
    registrations: 234, 
    remainingSlots: 266,
    status: "Upcoming",
    attendees: mockAttendees
  },
  { 
    id: "EVT002", 
    title: "Networking Night", 
    description: "Professional networking event for community members. Great opportunity to meet business contacts and explore collaborations.",
    category: "Meetup",
    banner: "/placeholder.svg",
    eventType: "Physical",
    venue: "Grand Hotel Ballroom",
    startDateTime: "2024-01-28T18:00",
    endDateTime: "2024-01-28T21:00",
    participantLimit: "Set Limit",
    maxParticipants: 100,
    pricingType: "Free",
    ticketCategories: [],
    createGroup: false,
    registrations: 89, 
    remainingSlots: 11,
    status: "Upcoming",
    attendees: mockAttendees.slice(0, 3)
  },
  { 
    id: "EVT003", 
    title: "Business Skills Workshop", 
    description: "Interactive workshop covering essential business skills including marketing, finance, and operations management.",
    category: "Workshop",
    banner: "/placeholder.svg",
    eventType: "Online",
    onlineLink: "https://zoom.us/j/123456789",
    startDateTime: "2024-01-20T09:00",
    endDateTime: "2024-01-20T17:00",
    participantLimit: "Unlimited",
    pricingType: "Paid",
    ticketCategories: [
      { id: "TC004", name: "Standard", price: 50, description: "Full workshop access" },
      { id: "TC005", name: "Premium", price: 100, description: "Includes recordings and materials" }
    ],
    refundPolicy: "No refunds",
    createGroup: true,
    groupName: "Business Workshop Participants",
    registrations: 156, 
    remainingSlots: "Unlimited",
    status: "Ongoing",
    attendees: mockAttendees
  },
  { 
    id: "EVT004", 
    title: "Youth Leadership Summit", 
    description: "Annual gathering for young community members to discuss issues, share ideas, and plan initiatives.",
    category: "Conference",
    banner: "/placeholder.svg",
    eventType: "Physical",
    venue: "University Hall, Room 200",
    startDateTime: "2024-01-10T08:00",
    endDateTime: "2024-01-10T16:00",
    participantLimit: "Set Limit",
    maxParticipants: 400,
    pricingType: "Free",
    ticketCategories: [],
    createGroup: true,
    groupName: "Youth Summit 2024",
    registrations: 312, 
    remainingSlots: 88,
    status: "Completed",
    attendees: mockAttendees.slice(0, 4)
  },
  { 
    id: "EVT005", 
    title: "Community Fundraiser Gala", 
    description: "Elegant evening of entertainment and auctions to raise funds for community projects.",
    category: "Fundraiser",
    banner: "/placeholder.svg",
    eventType: "Physical",
    venue: "City Park Pavilion",
    startDateTime: "2024-03-01T19:00",
    endDateTime: "2024-03-01T23:00",
    participantLimit: "Set Limit",
    maxParticipants: 200,
    pricingType: "Paid",
    ticketCategories: [
      { id: "TC006", name: "General", price: 100, description: "General admission" },
      { id: "TC007", name: "VIP Table", price: 500, description: "Reserved VIP table for 4" },
      { id: "TC008", name: "Platinum Sponsor", price: 1000, description: "Sponsor recognition + VIP table" }
    ],
    refundPolicy: "Partial refund before event start",
    createGroup: false,
    registrations: 45, 
    remainingSlots: 155,
    status: "Upcoming",
    attendees: mockAttendees.slice(0, 2)
  },
];

const categories = ["All Categories", "Seminar", "Workshop", "Social Event", "Fundraiser", "Training", "Conference", "Meetup"];
const statusOptions = ["All Status", "Upcoming", "Ongoing", "Completed", "Cancelled"];

const statusColors: Record<string, string> = {
  Upcoming: "bg-primary/10 text-primary",
  Ongoing: "bg-success/10 text-success",
  Completed: "bg-secondary text-secondary-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

const initialCreateForm = {
  title: "",
  description: "",
  category: "",
  banner: "",
  eventType: "Physical" as "Physical" | "Online",
  venue: "",
  onlineLink: "",
  startDateTime: "",
  endDateTime: "",
  participantLimit: "Unlimited" as "Unlimited" | "Set Limit",
  maxParticipants: 100,
  pricingType: "Free" as "Free" | "Paid",
  ticketCategories: [] as TicketCategory[],
  refundPolicy: "No refunds",
  createGroup: false,
  groupName: "",
};

export default function Events() {
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>(eventsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "past">("pending");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialCreateForm);

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Filter events by tab and other filters
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "pending" 
      ? (event.status === "Upcoming" || event.status === "Ongoing")
      : (event.status === "Completed" || event.status === "Cancelled");
    const matchesCategory = categoryFilter === "All Categories" || event.category === categoryFilter;
    return matchesSearch && matchesTab && matchesCategory;
  });

  // Count events for each tab
  const pendingCount = events.filter(e => e.status === "Upcoming" || e.status === "Ongoing").length;
  const pastCount = events.filter(e => e.status === "Completed" || e.status === "Cancelled").length;

  const handleView = (event: Event) => {
    setSelectedEvent(event);
    setViewModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      category: event.category,
      banner: event.banner,
      eventType: event.eventType,
      venue: event.venue || "",
      onlineLink: event.onlineLink || "",
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      participantLimit: event.participantLimit,
      maxParticipants: event.maxParticipants || 100,
      pricingType: event.pricingType,
      ticketCategories: event.ticketCategories || [],
      refundPolicy: event.refundPolicy || "No refunds",
      createGroup: event.createGroup,
      groupName: event.groupName || "",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleViewAttendees = (event: Event) => {
    setSelectedEvent(event);
    setAttendeesModalOpen(true);
  };

  const handleCancelEvent = (event: Event) => {
    setSelectedEvent(event);
    setCancelModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setDeleteModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const confirmCancel = () => {
    if (selectedEvent) {
      setEvents(events.map((e) => 
        e.id === selectedEvent.id ? { ...e, status: "Cancelled" as const } : e
      ));
      setCancelModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const saveEdit = () => {
    if (selectedEvent) {
      setEvents(events.map((e) =>
        e.id === selectedEvent.id
          ? { 
              ...e, 
              ...editForm,
              remainingSlots: editForm.participantLimit === "Unlimited" ? "Unlimited" : (editForm.maxParticipants || 0) - e.registrations
            }
          : e
      ));
      setEditModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleCreateEvent = () => {
    const newEvent: Event = {
      id: `EVT${String(events.length + 1).padStart(3, "0")}`,
      ...createForm,
      registrations: 0,
      remainingSlots: createForm.participantLimit === "Unlimited" ? "Unlimited" : createForm.maxParticipants,
      status: "Upcoming",
      attendees: [],
    };
    setEvents([newEvent, ...events]);
    setCreateForm(initialCreateForm);
    setCreateModalOpen(false);
  };

  const handleCheckIn = (attendeeId: string) => {
    if (selectedEvent) {
      const updatedAttendees = selectedEvent.attendees.map((a) =>
        a.id === attendeeId ? { ...a, checkInStatus: "Checked In" } : a
      );
      setSelectedEvent({ ...selectedEvent, attendees: updatedAttendees });
      setEvents(events.map((e) =>
        e.id === selectedEvent.id ? { ...e, attendees: updatedAttendees } : e
      ));
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Manage Events</h1>
          <p className="text-muted-foreground mt-1">Create and manage your community events.</p>
        </div>
        <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "past")} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              Past
              <Badge variant="secondary" className="ml-1">{pastCount}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="pending" className="mt-6">
          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow">
            <div className="aspect-video relative bg-muted">
              <img 
                src={event.banner} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={statusColors[event.status]}>{event.status}</Badge>
                <Badge variant="outline" className="bg-background/80">
                  {event.pricingType === "Free" ? "Free" : event.ticketCategories.length > 0 
                    ? `From $${Math.min(...event.ticketCategories.map(t => t.price))}` 
                    : "Paid"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
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
                    <span className="text-foreground font-medium">{event.registrations}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {event.remainingSlots === "Unlimited" ? "Unlimited slots" : `${event.remainingSlots} slots left`}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(event)} className="text-foreground">
                      <Eye className="h-4 w-4 mr-2" />View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(event)} className="text-foreground">
                      <Edit className="h-4 w-4 mr-2" />Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewAttendees(event)} className="text-foreground">
                      <Users className="h-4 w-4 mr-2" />View Attendees
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-foreground">
                      <FileText className="h-4 w-4 mr-2" />Generate Report
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {event.status !== "Cancelled" && event.status !== "Completed" && (
                      <DropdownMenuItem onClick={() => handleCancelEvent(event)} className="text-destructive">
                        <XCircle className="h-4 w-4 mr-2" />Cancel Event
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(event)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending events found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow">
                <div className="aspect-video relative bg-muted">
                  <img 
                    src={event.banner} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={statusColors[event.status]}>{event.status}</Badge>
                    <Badge variant="outline" className="bg-background/80">
                      {event.pricingType === "Free" ? "Free" : event.ticketCategories.length > 0 
                        ? `From $${Math.min(...event.ticketCategories.map(t => t.price))}` 
                        : "Paid"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
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
                        <span className="text-foreground font-medium">{event.registrations}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {event.remainingSlots === "Unlimited" ? "Unlimited slots" : `${event.remainingSlots} slots left`}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(event)} className="text-foreground">
                          <Eye className="h-4 w-4 mr-2" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewAttendees(event)} className="text-foreground">
                          <Users className="h-4 w-4 mr-2" />View Attendees
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground">
                          <FileText className="h-4 w-4 mr-2" />Generate Report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(event)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No past events found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Event Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Create Event</DialogTitle>
            <DialogDescription>Create a new community event.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Name *</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter event name..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your event..." 
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={createForm.category} onValueChange={(v) => setCreateForm({ ...createForm, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c !== "All Categories").map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner">Event Banner URL *</Label>
                    <Input 
                      id="banner" 
                      placeholder="Enter image URL..."
                      value={createForm.banner}
                      onChange={(e) => setCreateForm({ ...createForm, banner: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location & Schedule */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location & Schedule
              </h3>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label>Event Type *</Label>
                  <RadioGroup 
                    value={createForm.eventType} 
                    onValueChange={(v) => setCreateForm({ ...createForm, eventType: v as "Physical" | "Online" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Physical" id="physical" />
                      <Label htmlFor="physical" className="cursor-pointer">Physical</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Online" id="online" />
                      <Label htmlFor="online" className="cursor-pointer">Online</Label>
                    </div>
                  </RadioGroup>
                </div>
                {createForm.eventType === "Physical" ? (
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input 
                      id="venue" 
                      placeholder="Enter venue address..."
                      value={createForm.venue}
                      onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="onlineLink">Online Event Link *</Label>
                    <Input 
                      id="onlineLink" 
                      placeholder="https://zoom.us/j/..."
                      value={createForm.onlineLink}
                      onChange={(e) => setCreateForm({ ...createForm, onlineLink: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDateTime">Start Date & Time *</Label>
                    <Input 
                      id="startDateTime" 
                      type="datetime-local"
                      value={createForm.startDateTime}
                      onChange={(e) => setCreateForm({ ...createForm, startDateTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDateTime">End Date & Time *</Label>
                    <Input 
                      id="endDateTime" 
                      type="datetime-local"
                      value={createForm.endDateTime}
                      onChange={(e) => setCreateForm({ ...createForm, endDateTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Capacity Management */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity Management
              </h3>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label>Participant Limit</Label>
                  <RadioGroup 
                    value={createForm.participantLimit} 
                    onValueChange={(v) => setCreateForm({ ...createForm, participantLimit: v as "Unlimited" | "Set Limit" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Unlimited" id="unlimited" />
                      <Label htmlFor="unlimited" className="cursor-pointer">Unlimited</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Set Limit" id="setLimit" />
                      <Label htmlFor="setLimit" className="cursor-pointer">Set Limit</Label>
                    </div>
                  </RadioGroup>
                </div>
                {createForm.participantLimit === "Set Limit" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Maximum Participants *</Label>
                    <Input 
                      id="maxParticipants" 
                      type="number"
                      min={1}
                      value={createForm.maxParticipants}
                      onChange={(e) => setCreateForm({ ...createForm, maxParticipants: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Ticketing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ticketing (Free or Paid)
              </h3>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label>Event Pricing Type</Label>
                  <RadioGroup 
                    value={createForm.pricingType} 
                    onValueChange={(v) => setCreateForm({ ...createForm, pricingType: v as "Free" | "Paid" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Free" id="free" />
                      <Label htmlFor="free" className="cursor-pointer">Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Paid" id="paid" />
                      <Label htmlFor="paid" className="cursor-pointer">Paid</Label>
                    </div>
                  </RadioGroup>
                </div>
                {createForm.pricingType === "Paid" && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Ticket Categories *</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreateForm({
                            ...createForm,
                            ticketCategories: [...createForm.ticketCategories, { id: `TC${Date.now()}`, name: "", price: 0, description: "" }]
                          })}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Category
                        </Button>
                      </div>
                      {createForm.ticketCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No ticket categories added yet. Click "Add Category" to create one.</p>
                      )}
                      {createForm.ticketCategories.map((category, index) => (
                        <div key={category.id} className="p-3 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Category {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setCreateForm({
                                ...createForm,
                                ticketCategories: createForm.ticketCategories.filter((_, i) => i !== index)
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Name</Label>
                              <Input
                                placeholder="e.g., VIP, Regular"
                                value={category.name}
                                onChange={(e) => {
                                  const updated = [...createForm.ticketCategories];
                                  updated[index] = { ...updated[index], name: e.target.value };
                                  setCreateForm({ ...createForm, ticketCategories: updated });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price (USD)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                value={category.price}
                                onChange={(e) => {
                                  const updated = [...createForm.ticketCategories];
                                  updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                  setCreateForm({ ...createForm, ticketCategories: updated });
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                              placeholder="Brief description of this ticket type"
                              value={category.description || ""}
                              onChange={(e) => {
                                const updated = [...createForm.ticketCategories];
                                updated[index] = { ...updated[index], description: e.target.value };
                                setCreateForm({ ...createForm, ticketCategories: updated });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Refund Policy *</Label>
                      <Select value={createForm.refundPolicy} onValueChange={(v) => setCreateForm({ ...createForm, refundPolicy: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No refunds">No refunds</SelectItem>
                          <SelectItem value="Full refund before event start">Full refund before event start</SelectItem>
                          <SelectItem value="Partial refund before event start">Partial refund before event start</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Group Creation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Group Creation Option
              </h3>
              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="createGroup">Automatically Create Event Group Chat?</Label>
                  <Switch 
                    id="createGroup"
                    checked={createForm.createGroup}
                    onCheckedChange={(v) => setCreateForm({ ...createForm, createGroup: v })}
                  />
                </div>
                {createForm.createGroup && (
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input 
                      id="groupName" 
                      placeholder="Enter group name..."
                      value={createForm.groupName}
                      onChange={(e) => setCreateForm({ ...createForm, groupName: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={handleCreateEvent}>Create Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event Details</DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
                {selectedEvent.createGroup && <TabsTrigger value="group">Group Chat</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-4">
                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                  <img src={selectedEvent.banner} alt={selectedEvent.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[selectedEvent.status]}>{selectedEvent.status}</Badge>
                  <Badge variant="outline">{selectedEvent.category}</Badge>
                  <Badge variant="outline">
                    {selectedEvent.pricingType === "Free" ? "Free" : selectedEvent.ticketCategories.length > 0 
                      ? `${selectedEvent.ticketCategories.length} Ticket Types` 
                      : "Paid"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedEvent.eventType === "Physical" ? "In-Person" : "Online"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Start: {formatDateTime(selectedEvent.startDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>End: {formatDateTime(selectedEvent.endDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEvent.eventType === "Physical" ? (
                      <>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.venue}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={selectedEvent.onlineLink} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                          Join Online
                        </a>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.registrations} registered • {selectedEvent.remainingSlots === "Unlimited" ? "Unlimited" : selectedEvent.remainingSlots} slots left</span>
                  </div>
                </div>

                {selectedEvent.pricingType === "Paid" && selectedEvent.ticketCategories.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-foreground font-medium">Ticket Categories</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedEvent.ticketCategories.map((ticket) => (
                        <div key={ticket.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{ticket.name}</span>
                            <Badge variant="outline" className="bg-primary/10 text-primary">${ticket.price}</Badge>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.pricingType === "Paid" && selectedEvent.refundPolicy && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <strong>Refund Policy:</strong> {selectedEvent.refundPolicy}
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <h4 className="text-foreground font-medium">Description</h4>
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setViewModalOpen(false); handleEdit(selectedEvent); }}>
                    <Edit className="h-4 w-4 mr-2" />Edit Event
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />Share Event
                  </Button>
                  {selectedEvent.status !== "Cancelled" && selectedEvent.status !== "Completed" && (
                    <Button variant="outline" className="text-destructive" onClick={() => { setViewModalOpen(false); handleCancelEvent(selectedEvent); }}>
                      <XCircle className="h-4 w-4 mr-2" />Cancel Event
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Registration Trend</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{selectedEvent.registrations}</div>
                    <p className="text-xs text-muted-foreground">Total registrations</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <PieChart className="h-4 w-4" />
                      <span className="text-sm">Ticket Types</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">3</div>
                    <p className="text-xs text-muted-foreground">Different ticket types</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm">Engagement</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">156</div>
                    <p className="text-xs text-muted-foreground">Saves & Shares</p>
                  </Card>
                </div>
                <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed analytics charts will appear here once integrated with backend.</p>
                </div>
              </TabsContent>

              <TabsContent value="attendees" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-foreground">Attendee List ({selectedEvent.attendees.length})</h4>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />Export CSV
                  </Button>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Ticket Type</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEvent.attendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell className="font-medium">{attendee.name}</TableCell>
                          <TableCell>{attendee.registrationDate}</TableCell>
                          <TableCell><Badge variant="outline">{attendee.ticketType}</Badge></TableCell>
                          <TableCell>
                            <Badge className={attendee.paymentStatus === "Paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                              {attendee.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={attendee.checkInStatus === "Checked In" ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground"}>
                              {attendee.checkInStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {attendee.checkInStatus !== "Checked In" && (
                                  <DropdownMenuItem onClick={() => handleCheckIn(attendee.id)} className="text-foreground">
                                    <CheckCircle className="h-4 w-4 mr-2" />Mark as Checked-In
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-foreground">
                                  <Eye className="h-4 w-4 mr-2" />View Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {selectedEvent.createGroup && (
                <TabsContent value="group" className="space-y-4 mt-4">
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{selectedEvent.groupName}</h4>
                        <p className="text-sm text-muted-foreground">{selectedEvent.registrations} members</p>
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
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Attendees Modal (Standalone) */}
      <Dialog open={attendeesModalOpen} onOpenChange={setAttendeesModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Attendees - {selectedEvent?.title}</DialogTitle>
            <DialogDescription>{selectedEvent?.attendees.length} registered attendees</DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEvent?.attendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="font-medium">{attendee.name}</TableCell>
                    <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
                    <TableCell><Badge variant="outline">{attendee.ticketType}</Badge></TableCell>
                    <TableCell>
                      <Badge className={attendee.paymentStatus === "Paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                        {attendee.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={attendee.checkInStatus === "Checked In" ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground"}>
                        {attendee.checkInStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {attendee.checkInStatus !== "Checked In" && (
                            <DropdownMenuItem onClick={() => handleCheckIn(attendee.id)} className="text-foreground">
                              <CheckCircle className="h-4 w-4 mr-2" />Mark as Checked-In
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-foreground">
                            <Eye className="h-4 w-4 mr-2" />View Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendeesModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Event</DialogTitle>
            <DialogDescription>Make changes to your event.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>
              <div className="space-y-4 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Event Name</Label>
                  <Input 
                    id="edit-title" 
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c !== "All Categories").map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-banner">Event Banner URL</Label>
                    <Input 
                      id="edit-banner" 
                      value={editForm.banner}
                      onChange={(e) => setEditForm({ ...editForm, banner: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location & Schedule */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Location & Schedule</h3>
              <div className="space-y-4 pl-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <RadioGroup 
                    value={editForm.eventType} 
                    onValueChange={(v) => setEditForm({ ...editForm, eventType: v as "Physical" | "Online" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Physical" id="edit-physical" />
                      <Label htmlFor="edit-physical" className="cursor-pointer">Physical</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Online" id="edit-online" />
                      <Label htmlFor="edit-online" className="cursor-pointer">Online</Label>
                    </div>
                  </RadioGroup>
                </div>
                {editForm.eventType === "Physical" ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-venue">Venue</Label>
                    <Input 
                      id="edit-venue" 
                      value={editForm.venue}
                      onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-onlineLink">Online Event Link</Label>
                    <Input 
                      id="edit-onlineLink" 
                      value={editForm.onlineLink}
                      onChange={(e) => setEditForm({ ...editForm, onlineLink: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDateTime">Start Date & Time</Label>
                    <Input 
                      id="edit-startDateTime" 
                      type="datetime-local"
                      value={editForm.startDateTime}
                      onChange={(e) => setEditForm({ ...editForm, startDateTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDateTime">End Date & Time</Label>
                    <Input 
                      id="edit-endDateTime" 
                      type="datetime-local"
                      value={editForm.endDateTime}
                      onChange={(e) => setEditForm({ ...editForm, endDateTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Capacity & Ticketing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Capacity & Ticketing</h3>
              <div className="space-y-4 pl-4">
                <div className="space-y-2">
                  <Label>Participant Limit</Label>
                  <RadioGroup 
                    value={editForm.participantLimit} 
                    onValueChange={(v) => setEditForm({ ...editForm, participantLimit: v as "Unlimited" | "Set Limit" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Unlimited" id="edit-unlimited" />
                      <Label htmlFor="edit-unlimited" className="cursor-pointer">Unlimited</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Set Limit" id="edit-setLimit" />
                      <Label htmlFor="edit-setLimit" className="cursor-pointer">Set Limit</Label>
                    </div>
                  </RadioGroup>
                </div>
                {editForm.participantLimit === "Set Limit" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxParticipants">Maximum Participants</Label>
                    <Input 
                      id="edit-maxParticipants" 
                      type="number"
                      min={1}
                      value={editForm.maxParticipants}
                      onChange={(e) => setEditForm({ ...editForm, maxParticipants: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Pricing Type</Label>
                  <RadioGroup 
                    value={editForm.pricingType} 
                    onValueChange={(v) => setEditForm({ ...editForm, pricingType: v as "Free" | "Paid" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Free" id="edit-free" />
                      <Label htmlFor="edit-free" className="cursor-pointer">Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Paid" id="edit-paid" />
                      <Label htmlFor="edit-paid" className="cursor-pointer">Paid</Label>
                    </div>
                  </RadioGroup>
                </div>
                {editForm.pricingType === "Paid" && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Ticket Categories</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditForm({
                            ...editForm,
                            ticketCategories: [...editForm.ticketCategories, { id: `TC${Date.now()}`, name: "", price: 0, description: "" }]
                          })}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Category
                        </Button>
                      </div>
                      {editForm.ticketCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No ticket categories added yet.</p>
                      )}
                      {editForm.ticketCategories.map((category, index) => (
                        <div key={category.id} className="p-3 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Category {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditForm({
                                ...editForm,
                                ticketCategories: editForm.ticketCategories.filter((_, i) => i !== index)
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Name</Label>
                              <Input
                                placeholder="e.g., VIP, Regular"
                                value={category.name}
                                onChange={(e) => {
                                  const updated = [...editForm.ticketCategories];
                                  updated[index] = { ...updated[index], name: e.target.value };
                                  setEditForm({ ...editForm, ticketCategories: updated });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price (USD)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                value={category.price}
                                onChange={(e) => {
                                  const updated = [...editForm.ticketCategories];
                                  updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                  setEditForm({ ...editForm, ticketCategories: updated });
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                              placeholder="Brief description of this ticket type"
                              value={category.description || ""}
                              onChange={(e) => {
                                const updated = [...editForm.ticketCategories];
                                updated[index] = { ...updated[index], description: e.target.value };
                                setEditForm({ ...editForm, ticketCategories: updated });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Refund Policy</Label>
                      <Select value={editForm.refundPolicy} onValueChange={(v) => setEditForm({ ...editForm, refundPolicy: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No refunds">No refunds</SelectItem>
                          <SelectItem value="Full refund before event start">Full refund before event start</SelectItem>
                          <SelectItem value="Partial refund before event start">Partial refund before event start</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Event Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Cancel Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel "{selectedEvent?.title}"? All registered attendees will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Keep Event</Button>
            <Button variant="destructive" onClick={confirmCancel}>Cancel Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{selectedEvent?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
