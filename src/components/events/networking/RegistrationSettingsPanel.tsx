import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  getRegistrationSettings, toEventError, updateRegistrationSettings, type RegistrationSettings,
} from "@/services/graphql/eventNetworking";

/** ISO → value for <input type="datetime-local"> in the viewer's zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Requires-approval switch and the registration window (opens / closes). */
export function RegistrationSettingsPanel({ eventId }: { eventId: string }) {
  const [loaded, setLoaded] = useState<RegistrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState("");

  const apply = (s: RegistrationSettings) => {
    setLoaded(s);
    setRequiresApproval(s.requiresApproval === true);
    setOpens(toLocalInput(s.registrationOpensAt));
    setCloses(toLocalInput(s.registrationClosesAt));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      apply(await getRegistrationSettings(eventId));
    } catch (err) {
      setError(toEventError(err, "Could not load the registration settings.").message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const opensIso = fromLocalInput(opens);
  const closesIso = fromLocalInput(closes);
  const windowInvalid = !!opensIso && !!closesIso && Date.parse(closesIso) <= Date.parse(opensIso);

  const save = async () => {
    if (!loaded || windowInvalid) return;
    setSaving(true);
    try {
      const updated = await updateRegistrationSettings({
        eventId,
        requiresApproval,
        registrationOpensAt: opensIso,
        registrationClosesAt: closesIso,
        clearRegistrationOpensAt: !opens && !!loaded.registrationOpensAt,
        clearRegistrationClosesAt: !closes && !!loaded.registrationClosesAt,
      });
      apply({ ...loaded, ...updated });
      toast({ title: "Registration settings saved" });
    } catch (err) {
      toast({ title: "Could not save", description: toEventError(err).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  if (error) {
    return (
      <div className="flex items-center gap-2 py-6 text-destructive" role="alert">
        <AlertCircle className="h-5 w-5" /><span className="text-sm">{error}</span>
        <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <Label htmlFor="requires-approval" className="text-sm font-medium">Approve registrations first</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            New registrations wait for an organiser's approval before a place is reserved. Existing registrations are not affected.
          </p>
        </div>
        <Switch id="requires-approval" checked={requiresApproval} onCheckedChange={setRequiresApproval} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="reg-opens">Registration opens</Label>
          <Input id="reg-opens" type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} />
          {opens && <button type="button" className="text-xs text-primary underline" onClick={() => setOpens("")}>Open straight away</button>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="reg-closes">Registration closes</Label>
          <Input id="reg-closes" type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} />
          {closes && <button type="button" className="text-xs text-primary underline" onClick={() => setCloses("")}>No closing time</button>}
        </div>
      </div>
      {windowInvalid && <p className="text-sm text-destructive" role="alert">Registration must close after it opens.</p>}

      <div className="flex justify-end">
        <Button onClick={() => void save()} disabled={saving || windowInvalid}>
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Save settings
        </Button>
      </div>
    </div>
  );
}
