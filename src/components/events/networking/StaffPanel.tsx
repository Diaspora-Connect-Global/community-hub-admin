import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, UserPlus, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PersonPicker } from "@/components/pickers/PersonPicker";
import { toast } from "@/hooks/use-toast";
import { userLabel } from "@/lib/userLabel";
import { EVENT_STAFF_ROLES, staffRoleLabel, type EventStaffRole } from "@/lib/eventNetworking";
import {
  addEventStaff, listEventStaff, removeEventStaff, toEventError, type EventStaffMember,
} from "@/services/graphql/eventNetworking";

type PickerValue = Parameters<NonNullable<React.ComponentProps<typeof PersonPicker>["onChange"]>>[0];

function nameOf(m: EventStaffMember): string {
  return userLabel({ name: m.displayName, username: m.username }, "Unknown person");
}

/** The event's staff: add someone by name / @username with a role, change a role, remove. */
export function StaffPanel({ eventId }: { eventId: string }) {
  const [staff, setStaff] = useState<EventStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [person, setPerson] = useState<PickerValue>(null);
  const [role, setRole] = useState<EventStaffRole>("EVENT_MANAGER");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<EventStaffMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStaff(await listEventStaff(eventId));
    } catch (err) {
      setError(toEventError(err, "Could not load the event staff.").message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!person) return;
    setSaving(true);
    try {
      await addEventStaff(eventId, person.id, role);
      toast({ title: "Staff updated", description: `${userLabel({ name: person.displayName, username: person.username }, "They")} is now ${staffRoleLabel(role).toLowerCase()}.` });
      setPerson(null);
      await load();
    } catch (err) {
      toast({ title: "Could not add that person", description: toEventError(err).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (m: EventStaffMember, next: EventStaffRole) => {
    if (next === m.role) return;
    try {
      await addEventStaff(eventId, m.userId, next);
      await load();
    } catch (err) {
      toast({ title: "Could not change the role", description: toEventError(err).message, variant: "destructive" });
    }
  };

  const remove = async () => {
    if (!removing) return;
    setSaving(true);
    try {
      await removeEventStaff(eventId, removing.userId);
      toast({ title: "Removed from the event staff" });
      setRemoving(null);
      await load();
    } catch (err) {
      toast({ title: "Could not remove that person", description: toEventError(err).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h4 className="font-medium text-foreground">Add someone to the event staff</h4>
        <PersonPicker value={person} onChange={setPerson} disabled={saving} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] space-y-1">
            <Label htmlFor="staff-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as EventStaffRole)}>
              <SelectTrigger id="staff-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_STAFF_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void add()} disabled={!person || saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />} Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{EVENT_STAFF_ROLES.find((r) => r.value === role)?.hint}</p>
      </section>

      <section className="space-y-3" aria-labelledby="staff-list-heading">
        <div className="flex items-center gap-2">
          <h4 id="staff-list-heading" className="font-medium text-foreground">Current staff</h4>
          <Badge variant="secondary">{staff.length}</Badge>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
        ) : error ? (
          <div className="flex items-center gap-2 py-4 text-destructive" role="alert">
            <AlertCircle className="h-5 w-5" /><span className="text-sm">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </div>
        ) : staff.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            No one has been added yet. The event's owner and the organiser's admins can always manage it.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {staff.map((m) => {
              const name = nameOf(m);
              return (
                <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                      <AvatarFallback className="bg-primary/10 text-primary"><User className="h-4 w-4" aria-hidden="true" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      {m.username && name !== `@${m.username}` && <p className="truncate text-xs text-muted-foreground">@{m.username}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={m.role} onValueChange={(v) => void changeRole(m, v as EventStaffRole)}>
                      <SelectTrigger className="w-[190px]" aria-label={`Role for ${name}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVENT_STAFF_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${name}`} onClick={() => setRemoving(m)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from the event staff?</DialogTitle>
            <DialogDescription>{removing ? `${nameOf(removing)} will no longer be able to manage this event.` : ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="destructive" disabled={saving} onClick={() => void remove()}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
