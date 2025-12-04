import { Plus, Search, MoreHorizontal, Eye, Edit, X, Download, Users, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const events = [
  { id: "EVT001", title: "Cultural Festival 2024", date: "2024-02-15", venue: "Community Center", attendees: 234, status: "Upcoming" },
  { id: "EVT002", title: "Networking Night", date: "2024-01-28", venue: "Grand Hotel", attendees: 89, status: "Upcoming" },
  { id: "EVT003", title: "Business Workshop", date: "2024-01-20", venue: "Online", attendees: 156, status: "Ongoing" },
  { id: "EVT004", title: "Youth Summit", date: "2024-01-10", venue: "University Hall", attendees: 312, status: "Completed" },
  { id: "EVT005", title: "New Year Celebration", date: "2024-01-01", venue: "City Park", attendees: 567, status: "Completed" },
];

const statusColors: Record<string, string> = {
  Upcoming: "bg-primary/10 text-primary",
  Ongoing: "bg-success/10 text-success",
  Completed: "bg-secondary text-secondary-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

export default function Events() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Events (My Events)</h1>
          <p className="text-muted-foreground mt-1">Create and manage your community events.</p>
        </div>
        <Button variant="warm">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead className="w-28 text-center">Attendees</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{event.id}</TableCell>
                <TableCell className="font-medium text-foreground">{event.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[event.status]}>{event.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Event</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Users className="h-4 w-4 mr-2" />View Attendees</DropdownMenuItem>
                      <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Export List</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><X className="h-4 w-4 mr-2" />Cancel Event</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
