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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Download, MoreHorizontal, CheckCircle, Eye, ClipboardList, Loader2 } from "lucide-react";
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
import { RegistrationStatusBadge } from "@/components/events/networking/RegistrationStatusBadge";
import { registrationStatusLabel } from "@/lib/eventNetworking";
import { answerText, buildCsv, downloadCsv } from "@/lib/eventRegistrationCsv";
import type { RegistrationFormField } from "@/lib/eventRegistrationForm";
import { registrationFieldName } from "@/pages/events/RegistrationFormBuilder";

// ---------------------------------------------------------------------------
// CSV export — client-side. The attendee rows are already loaded in the
// browser, so no backend/CSV endpoint is required to produce the download.
// ---------------------------------------------------------------------------

const CSV_COLUMNS: { header: string; get: (a: Attendee) => string }[] = [
  { header: "Name", get: (a) => a.name },
  { header: "Email", get: (a) => a.email },
  { header: "Registration Date", get: (a) => a.registrationDate },
  { header: "Ticket Type", get: (a) => a.ticketType },
  { header: "Quantity", get: (a) => String(a.quantity ?? "") },
  { header: "Registration", get: (a) => registrationStatusLabel(a.registrationStatus) },
  { header: "Payment Status", get: (a) => a.paymentStatus },
  { header: "Check-In Status", get: (a) => a.checkInStatus },
];

/** Question label for display: default fields translated, the organiser's own as typed. */
function questionLabel(f: RegistrationFormField, t: TFunction): string {
  return registrationFieldName({ builtin: f.builtin ?? null, label: f.label }, t);
}

function slugify(input: string | undefined, fallback: string): string {
  const base = (input ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || fallback;
}

function exportAttendeesCsv(
  attendees: Attendee[],
  eventTitle: string | undefined,
  fields: RegistrationFormField[],
  t: TFunction,
): void {
  const words = { yes: t("events.registration.yes"), no: t("events.registration.no") };
  const headers = [...CSV_COLUMNS.map((c) => c.header), ...fields.map((f) => questionLabel(f, t))];
  const rows = attendees.map((a) => [
    ...CSV_COLUMNS.map((c) => c.get(a)),
    ...fields.map((f) => answerText(a.formResponses?.[f.id], f, words)),
  ]);
  downloadCsv(buildCsv(headers, rows), `${slugify(eventTitle, "event")}-attendees.csv`);
}

// ---------------------------------------------------------------------------
// Per-registrant answers (question -> answer, never ids)
// ---------------------------------------------------------------------------

function AttendeeAnswersDialog({
  attendee,
  fields,
  onClose,
}: {
  attendee: Attendee | null;
  fields: RegistrationFormField[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const words = { yes: t("events.registration.yes"), no: t("events.registration.no") };
  const answered = attendee
    ? fields
        .map((f) => ({ f, text: answerText(attendee.formResponses?.[f.id], f, words) }))
        .filter(({ text }) => text !== "")
    : [];
  return (
    <Dialog open={!!attendee} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{t("events.registration.answersTitle")}</DialogTitle>
          <DialogDescription>{t("events.registration.answersFor", { name: attendee?.name ?? "" })}</DialogDescription>
        </DialogHeader>
        {answered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("events.registration.noAnswers")}</p>
        ) : (
          <dl className="space-y-3">
            {answered.map(({ f, text }) => (
              <div key={f.id}>
                <dt className="text-xs text-muted-foreground break-words">{questionLabel(f, t)}</dt>
                <dd className="text-sm text-foreground whitespace-pre-wrap break-words">{text}</dd>
              </div>
            ))}
          </dl>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close", { defaultValue: "Close" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Shared attendee table used inside the view-modal tab and the standalone modal
// ---------------------------------------------------------------------------

interface AttendeeTableProps {
  attendees: Attendee[];
  loading: boolean;
  /** Show "User Name" column (tab) vs "Name" + "Email" columns (standalone) */
  standalone: boolean;
  onCheckIn: (attendeeId: string) => void;
  onViewAnswers: (attendee: Attendee) => void;
}

function AttendeeTable({
  attendees,
  loading,
  standalone,
  onCheckIn,
  onViewAnswers,
}: AttendeeTableProps) {
  const { t } = useTranslation();
  const colSpan = 7;

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
            <TableHead>Registration</TableHead>
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
                  <RegistrationStatusBadge status={attendee.registrationStatus} />
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
                      <DropdownMenuItem
                        onClick={() => onViewAnswers(attendee)}
                        className="text-foreground"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        {t("events.registration.viewAnswers")}
                      </DropdownMenuItem>
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
  /** Used to name the exported CSV file. */
  eventTitle?: string;
  /** The event's current registration questions (answers view + CSV columns). */
  formFields?: RegistrationFormField[];
}

export function EventAttendeesPanel({
  attendees,
  loading,
  onCheckIn,
  eventTitle,
  formFields = [],
}: EventAttendeesPanelProps) {
  const { t } = useTranslation();
  const [answersFor, setAnswersFor] = useState<Attendee | null>(null);
  const handleExport = () => {
    if (attendees.length === 0) {
      toast({
        title: "Nothing to export",
        description: "There are no registered attendees yet.",
      });
      return;
    }
    exportAttendeesCsv(attendees, eventTitle, formFields, t);
  };

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
          onClick={handleExport}
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
        onViewAnswers={setAnswersFor}
      />
      <AttendeeAnswersDialog attendee={answersFor} fields={formFields} onClose={() => setAnswersFor(null)} />
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
  formFields?: RegistrationFormField[];
}

export function EventAttendeesDialog({
  open,
  eventTitle,
  attendees,
  loading,
  onClose,
  onCheckIn,
  formFields = [],
}: EventAttendeesDialogProps) {
  const { t } = useTranslation();
  const [answersFor, setAnswersFor] = useState<Attendee | null>(null);
  const handleExport = () => {
    if (attendees.length === 0) {
      toast({
        title: "Nothing to export",
        description: "There are no registered attendees yet.",
      });
      return;
    }
    exportAttendeesCsv(attendees, eventTitle, formFields, t);
  };

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
            onClick={handleExport}
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
          onViewAnswers={setAnswersFor}
        />
        <AttendeeAnswersDialog attendee={answersFor} fields={formFields} onClose={() => setAnswersFor(null)} />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
