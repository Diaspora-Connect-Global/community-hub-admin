import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Clock, Loader2, RefreshCw, Ticket, UserPlus, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  checkInRate, countForStatus, eventPhase, formatJoins, formatPercent, rangeForPreset, revenueLines,
  TIME_RANGE_PRESETS, type EventPhase, type TimeRangePresetId,
} from "@/lib/eventNetworking";
import { fetchOrganizerDashboard, toEventError, type DashboardEvent, type DashboardTotals } from "@/services/graphql/eventNetworking";

interface Props {
  ownerType: "COMMUNITY" | "ASSOCIATION";
  ownerId: string;
  locale?: string;
  /** Opens the event's management view (approvals / staff). */
  onOpenEvent?: (eventId: string) => void;
}

const PHASE_ORDER: { phase: EventPhase; title: string; empty: string }[] = [
  { phase: "live", title: "Live now", empty: "" },
  { phase: "upcoming", title: "Upcoming", empty: "No upcoming events in this period." },
  { phase: "past", title: "Past", empty: "No past events in this period." },
  { phase: "draft", title: "Drafts", empty: "" },
  { phase: "cancelled", title: "Cancelled", empty: "" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Kpi({ icon: Icon, label, value, hint, children }: { icon: React.ElementType; label: string; value?: string; hint?: string; children?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true" />{label}</div>
        {children ?? <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value}</p>}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function RevenueCell({ revenue, locale }: { revenue: DashboardEvent["revenue"]; locale?: string }) {
  const lines = revenueLines(revenue, locale);
  if (lines.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-0.5">
      {lines.map((l) => <div key={l.currency} className="tabular-nums">{l.text}</div>)}
    </div>
  );
}

function FillCell({ ev }: { ev: DashboardEvent }) {
  if (ev.capacity == null) return <span className="text-muted-foreground">No limit</span>;
  const rate = ev.fillRate;
  return (
    <div className="min-w-[110px]">
      <div className="flex justify-between text-xs tabular-nums">
        <span>{formatPercent(rate)}</span>
        <span className="text-muted-foreground">of {ev.capacity.toLocaleString()}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`Capacity ${formatPercent(rate)} full`}>
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round((rate ?? 0) * 100))}%` }} />
      </div>
    </div>
  );
}

function EventsTableSection({ title, events, locale, onOpenEvent }: { title: string; events: DashboardEvent[]; locale?: string; onOpenEvent?: (id: string) => void }) {
  return (
    <section aria-label={title} className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-foreground">{title}</h3>
        <Badge variant="secondary">{events.length}</Badge>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="text-right">Registered</TableHead>
              <TableHead className="text-right">Awaiting approval</TableHead>
              <TableHead className="text-right">Waitlisted</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Check-in rate</TableHead>
              <TableHead>Ticket revenue</TableHead>
              <TableHead className="text-right">Joined community</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev) => {
              const registered = countForStatus(ev.registrationsByStatus, "CONFIRMED") + countForStatus(ev.registrationsByStatus, "ATTENDED");
              const pending = countForStatus(ev.registrationsByStatus, "PENDING_APPROVAL");
              return (
                <TableRow key={ev.eventId}>
                  <TableCell>
                    {onOpenEvent ? (
                      <button type="button" className="text-left font-medium text-foreground hover:underline" onClick={() => onOpenEvent(ev.eventId)}>{ev.title}</button>
                    ) : <span className="font-medium">{ev.title}</span>}
                    <div className="text-xs text-muted-foreground">{formatDate(ev.startAt)}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{registered.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pending > 0 ? <Badge className="bg-warning/10 text-warning">{pending}</Badge> : 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{countForStatus(ev.registrationsByStatus, "WAITLISTED")}</TableCell>
                  <TableCell><FillCell ev={ev} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(checkInRate(ev.checkedInCount, ev.registrationsByStatus))}</TableCell>
                  <TableCell><RevenueCell revenue={ev.revenue} locale={locale} /></TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatJoins(ev.communityJoins)}
                    {(ev.communityJoinsPending ?? 0) > 0 && <div className="text-xs text-muted-foreground">+{ev.communityJoinsPending} pending</div>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

/** The organiser's Events dashboard: one range filter, KPIs, a registrations chart and upcoming / live / past tables. */
export function EventsDashboard({ ownerType, ownerId, locale, onOpenEvent }: Props) {
  const [preset, setPreset] = useState<TimeRangePresetId>("around30");
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (more = false, after: string | null = null) => {
    if (!ownerId) return;
    if (more) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeForPreset(preset);
      const res = await fetchOrganizerDashboard({ ownerType, ownerId, from, to, cursor: after });
      setEvents((prev) => (more ? [...prev, ...res.events] : res.events));
      if (!more) setTotals(res.totals);
      setCursor(res.nextCursor);
    } catch (err) {
      setError(toEventError(err, "Could not load the events dashboard.").message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [ownerType, ownerId, preset]);

  useEffect(() => { void load(); }, [load]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-read the clock whenever the data refreshes
  const now = useMemo(() => new Date(), [events]);
  const grouped = useMemo(() => {
    const map = new Map<EventPhase, DashboardEvent[]>();
    for (const ev of events) {
      const p = eventPhase(ev, now);
      map.set(p, [...(map.get(p) ?? []), ev]);
    }
    for (const [p, list] of map) {
      list.sort((a, b) => (p === "past" ? Date.parse(b.startAt) - Date.parse(a.startAt) : Date.parse(a.startAt) - Date.parse(b.startAt)));
    }
    return map;
  }, [events, now]);

  const registeredTotal = totals ? countForStatus(totals.registrationsByStatus, "CONFIRMED") + countForStatus(totals.registrationsByStatus, "ATTENDED") : null;
  const pendingTotal = totals ? countForStatus(totals.registrationsByStatus, "PENDING_APPROVAL") : null;
  const totalRevenue = totals ? revenueLines(totals.revenue, locale) : [];
  // Joins: a sum only when every loaded event is known — one unknown makes the total unknown.
  const joinsKnown = events.length > 0 && events.every((e) => typeof e.communityJoins === "number");
  const joinsTotal = joinsKnown ? events.reduce((n, e) => n + (e.communityJoins ?? 0), 0) : null;

  const chartData = useMemo(
    () => [...events]
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
      .slice(-12)
      .map((e) => ({
        name: e.title.length > 22 ? `${e.title.slice(0, 21)}…` : e.title,
        Confirmed: countForStatus(e.registrationsByStatus, "CONFIRMED") + countForStatus(e.registrationsByStatus, "ATTENDED"),
        "Awaiting approval": countForStatus(e.registrationsByStatus, "PENDING_APPROVAL"),
        Waitlisted: countForStatus(e.registrationsByStatus, "WAITLISTED"),
      })),
    [events],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Events dashboard</h2>
          <p className="text-sm text-muted-foreground">How your events are doing: registrations, approvals, attendance, revenue and community growth.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as TimeRangePresetId)}>
            <SelectTrigger className="w-[230px]" aria-label="Time range"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_RANGE_PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 p-4 text-destructive" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" /><span className="text-sm">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading events…</div>
      ) : !error && events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-foreground">No events in this period</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a wider time range, or create an event.</p>
        </div>
      ) : !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi icon={Calendar} label="Events" value={totals ? totals.eventCount.toLocaleString() : "—"} />
            <Kpi icon={Users} label="Registered attendees" value={registeredTotal != null ? registeredTotal.toLocaleString() : "—"} hint={pendingTotal ? `${pendingTotal} awaiting approval` : undefined} />
            <Kpi icon={CheckCircle2} label="Check-in rate" value={totals ? formatPercent(checkInRate(totals.checkedInCount, totals.registrationsByStatus)) : "—"} hint={totals ? `${totals.checkedInCount.toLocaleString()} checked in` : undefined} />
            <Kpi icon={Ticket} label="Ticket revenue" hint={totalRevenue.length > 1 ? "Shown per currency, never added together" : undefined}>
              {totalRevenue.length === 0 ? <p className="mt-2 text-2xl font-bold text-muted-foreground">—</p> : (
                <div className="mt-2 space-y-0.5">{totalRevenue.map((l) => <p key={l.currency} className="text-xl font-bold tabular-nums text-foreground">{l.text}</p>)}</div>
              )}
            </Kpi>
            <Kpi icon={UserPlus} label="Joined the community" value={formatJoins(joinsTotal)} hint={joinsTotal == null ? "Not available right now" : cursor ? "On the events loaded so far" : "Joined through these events"} />
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Registrations by event</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64" role="img" aria-label="Stacked bar chart of registrations by status for each event">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Confirmed" stackId="r" fill="var(--success)" />
                      <Bar dataKey="Awaiting approval" stackId="r" fill="var(--warning)" />
                      <Bar dataKey="Waitlisted" stackId="r" fill="var(--chart-2)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {PHASE_ORDER.map(({ phase, title, empty }) => {
            const list = grouped.get(phase) ?? [];
            if (list.length === 0) {
              return empty ? (
                <section key={phase} aria-label={title} className="space-y-2">
                  <h3 className="flex items-center gap-2 font-medium text-foreground"><Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{title}</h3>
                  <p className="rounded-lg border border-dashed border-border py-5 text-center text-sm text-muted-foreground">{empty}</p>
                </section>
              ) : null;
            }
            return <EventsTableSection key={phase} title={title} events={list} locale={locale} onOpenEvent={onOpenEvent} />;
          })}

          {cursor && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void load(true, cursor)} disabled={loadingMore}>
                {loadingMore && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Load more events
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EventsDashboard;
