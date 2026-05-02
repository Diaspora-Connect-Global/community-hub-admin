/**
 * EventAttendeesPanel
 *
 * Used in two contexts:
 *  1. Inside the "View Event Details" dialog as the Attendees tab content.
 *  2. As the standalone "View Attendees" dialog.
 *
 * The `standalone` prop controls which column set and title to render
 * (the original had slightly different columns: the tab used "User Name"
 * and the standalone modal used "Name" + "Email").
 */
import { Download, MoreHorizontal, CheckCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Attendee } from "@/pages/events/types";

// ---------------------------------------------------------------------------
// Shared attendee table used inside the view-modal tab and the standalone modal
// ---------------------------------------------------------------------------

interface AttendeeTableProps {
  attendees: Attendee[];
  loading: boolean;
  /** Show "User Name" column (tab) vs "Name" + "Email" columns (standalone) */
  standalone: boolean;
  onCheckIn: (attendeeId: string) => void;
}

function AttendeeTable({
  attendees,
  loading,
  standalone,
  onCheckIn,
}: AttendeeTableProps) {
  const colSpan = standalone ? 6 : 6;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {standalone ? (
              <>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </>
            ) : (
              <TableHead>User Name</TableHead>
            )}
            {standalone ? null : <TableHead>Registration Date</TableHead>}
            {!standalone && <TableHead>Ticket Type</TableHead>}
            {standalone && <TableHead>Ticket</TableHead>}
            <TableHead>Payment</TableHead>
            <TableHead>Check-In</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="text-center text-muted-foreground py-10"
              >
                <Loader2 className="inline h-5 w-5 animate-spin mr-2 align-middle" />
                Loading attendees…
              </TableCell>
            </TableRow>
          ) : attendees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="text-center text-muted-foreground py-8"
              >
                No registrations yet.
              </TableCell>
            </TableRow>
          ) : (
            attendees.map((attendee) => (
              <TableRow key={attendee.id}>
                <TableCell className="font-medium">{attendee.name}</TableCell>
                {standalone && (
                  <TableCell className="text-muted-foreground">
                    {attendee.email}
                  </TableCell>
                )}
                {!standalone && (
                  <TableCell>{attendee.registrationDate}</TableCell>
                )}
                <TableCell>
                  <Badge variant="outline">{attendee.ticketType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      attendee.paymentStatus === "Paid"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {attendee.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      attendee.checkInStatus === "Checked In"
                        ? "bg-success/10 text-success"
                        : "bg-secondary text-secondary-foreground"
                    }
                  >
                    {attendee.checkInStatus}
                  </Badge>
                </TableCell>
                <TableCell>
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
                      {attendee.checkInStatus !== "Checked In" && (
                        <DropdownMenuItem
                          onClick={() => onCheckIn(attendee.id)}
                          className="text-foreground"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Checked-In
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content (used inside the view-details dialog)
// ---------------------------------------------------------------------------

interface EventAttendeesPanelProps {
  attendees: Attendee[];
  loading: boolean;
  onCheckIn: (attendeeId: string) => void;
}

export function EventAttendeesPanel({
  attendees,
  loading,
  onCheckIn,
}: EventAttendeesPanelProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-foreground">
          Attendee List ({attendees.length})
        </h4>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            toast({
              title: "Export not available",
              description: "The API does not expose CSV export yet.",
            })
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <AttendeeTable
        attendees={attendees}
        loading={loading}
        standalone={false}
        onCheckIn={onCheckIn}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standalone dialog (the "View Attendees" modal accessed from the card menu)
// ---------------------------------------------------------------------------

interface EventAttendeesDialogProps {
  open: boolean;
  eventTitle: string | undefined;
  attendees: Attendee[];
  loading: boolean;
  onClose: () => void;
  onCheckIn: (attendeeId: string) => void;
}

export function EventAttendeesDialog({
  open,
  eventTitle,
  attendees,
  loading,
  onClose,
  onCheckIn,
}: EventAttendeesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Attendees - {eventTitle}
          </DialogTitle>
          <DialogDescription>
            {attendees.length} registered attendees
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              toast({
                title: "Export not available",
                description: "The API does not expose CSV export yet.",
              })
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <AttendeeTable
          attendees={attendees}
          loading={loading}
          standalone={true}
          onCheckIn={onCheckIn}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
