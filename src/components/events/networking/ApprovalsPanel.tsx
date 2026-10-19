import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle, AlertCircle, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { userLabel } from "@/lib/userLabel";
import { formatMinor } from "@/lib/eventNetworking";
import {
  approveRegistration, listRegistrationsByStatus, rejectRegistration, toEventError, REJECT_REASON_MAX,
  type ManagedRegistration,
} from "@/services/graphql/eventNetworking";
import { RegistrationStatusBadge } from "./RegistrationStatusBadge";

function personName(r: ManagedRegistration): string {
  const name = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim();
  return userLabel({ name, email: r.user?.email }, "Unknown person");
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function PersonCell({ r }: { r: ManagedRegistration }) {
  const name = personName(r);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        {r.user?.avatarUrl && <AvatarImage src={r.user.avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {r.quantity > 1 ? `${r.quantity} places` : "1 place"}
          {r.totalAmount && r.currency ? ` · ${formatMinor(r.totalAmount, r.currency)}` : ""}
          {r.registeredAt ? ` · ${new Date(r.registeredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
        </p>
      </div>
    </div>
  );
}

interface Props {
  eventId: string;
  /** Called after a decision so the parent can refresh counts. */
  onChanged?: () => void;
}

/** Pending-approval registrations (approve / decline with optional reason) and the waitlist with positions. */
export function ApprovalsPanel({ eventId, onChanged }: Props) {
  const [pending, setPending] = useState<ManagedRegistration[]>([]);
  const [waitlist, setWaitlist] = useState<ManagedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ManagedRegistration | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, w] = await Promise.all([
        listRegistrationsByStatus(eventId, "PENDING_APPROVAL"),
        listRegistrationsByStatus(eventId, "WAITLISTED"),
      ]);
      setPending(p.registrations);
      setWaitlist([...w.registrations].sort((a, b) => (a.waitlistPosition ?? 1e9) - (b.waitlistPosition ?? 1e9)));
    } catch (err) {
      setError(toEventError(err, "Could not load registrations.").message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (r: ManagedRegistration) => {
    setBusyId(r.id);
    try {
      const res = await approveRegistration(r.id);
      const outcome = (res.registrationStatus ?? res.status ?? "").toUpperCase();
      toast({
        title: "Registration approved",
        description:
          outcome === "WAITLISTED" ? "The event is full, so they were added to the waitlist."
          : outcome === "PENDING" ? "They now need to complete payment to secure the place."
          : "Their place is confirmed.",
      });
      await load();
      onChanged?.();
    } catch (err) {
      toast({ title: "Could not approve", description: toEventError(err).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await rejectRegistration(rejecting.id, reason);
      toast({ title: "Registration declined" });
      setRejecting(null);
      setReason("");
      await load();
      onChanged?.();
    } catch (err) {
      toast({ title: "Could not decline", description: toEventError(err).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading registrations…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-6 text-destructive" role="alert">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{error}</span>
        <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="pending-approvals-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 id="pending-approvals-heading" className="font-medium text-foreground">Awaiting approval</h4>
          <Badge variant="secondary">{pending.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Nobody is waiting for approval.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <PersonCell r={r} />
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" disabled={busyId === r.id} onClick={() => void approve(r)}>
                    {busyId === r.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => { setRejecting(r); setReason(""); }}>
                    <XCircle className="mr-1 h-4 w-4" /> Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="waitlist-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 id="waitlist-heading" className="font-medium text-foreground">Waitlist</h4>
          <Badge variant="secondary">{waitlist.length}</Badge>
        </div>
        {waitlist.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            The waitlist is empty.
          </p>
        ) : (
          <ol className="divide-y divide-border rounded-lg border border-border">
            {waitlist.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground" aria-label="Waitlist position">
                    {r.waitlistPosition != null ? `#${r.waitlistPosition}` : "—"}
                  </span>
                  <PersonCell r={r} />
                </div>
                <RegistrationStatusBadge status="WAITLISTED" />
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-muted-foreground">
          People on the waitlist are offered a place automatically when one opens up.
        </p>
      </section>

      <Dialog open={!!rejecting} onOpenChange={(open) => { if (!open) { setRejecting(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this registration?</DialogTitle>
            <DialogDescription>
              {rejecting ? `${personName(rejecting)} will be told their registration was declined.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional, only organisers see it)</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              maxLength={REJECT_REASON_MAX}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <p className="text-right text-xs text-muted-foreground">{reason.length}/{REJECT_REASON_MAX}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busyId === rejecting?.id} onClick={() => void confirmReject()}>
              {busyId === rejecting?.id && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Decline registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
