import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { listEvents, getEventStats } from "@/services/graphql/events";
import type { EventStats } from "@/services/graphql/events";
import diasporaSummitBanner from "@/assets/diaspora-summit-2025.jpg";
import { Button } from "@/components/ui/button";
import type { Event, EventFormState } from "@/pages/events/types";
import { initialEventForm, mapApiEvent } from "@/pages/events/types";
import { EventsTable } from "@/pages/events/EventsTable";
import { EventFormModal } from "@/pages/events/EventFormModal";
import { EventDetailModal } from "@/pages/events/EventDetailModal";
import { EventAttendeesDialog } from "@/pages/events/EventAttendeesPanel";
import { CancelEventDialog, DeleteEventDialog } from "@/pages/events/EventConfirmDialogs";
import { useEventActions } from "@/hooks/useEventActions";

export default function Events() {
  const location = useLocation();
  const { t } = useTranslation();
  const scopeId = useAuthStore((s) => s.admin)?.scopeId ?? "";

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "past">("pending");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState<EventFormState>(initialEventForm);
  const [editForm, setEditForm] = useState<EventFormState>(initialEventForm);
  const [cancelReason, setCancelReason] = useState("");

  const [detailTab, setDetailTab] = useState("overview");
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    if (!viewModalOpen) { setDetailTab("overview"); setEventStats(null); }
  }, [viewModalOpen]);

  const fetchEvents = useCallback(async () => {
    if (!scopeId) return;
    setLoading(true); setError(null);
    try {
      const result = await listEvents({ ownerType: "COMMUNITY", ownerId: scopeId, limit: 100, offset: 0, searchTerm: debouncedSearch.trim() || undefined });
      setEvents(result.events.map((e) => mapApiEvent(e, diasporaSummitBanner)));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load events"); }
    finally { setLoading(false); }
  }, [scopeId, debouncedSearch]);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    if (location.state?.openCreate) { setCreateModalOpen(true); window.history.replaceState({}, document.title); }
  }, [location.state]);

  const loadStats = useCallback(async (eventId: string) => {
    setStatsLoading(true); setEventStats(null);
    try { setEventStats(await getEventStats(eventId)); }
    catch { setEventStats(null); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    if (!viewModalOpen || !selectedEvent || detailTab !== "analytics") return;
    void loadStats(selectedEvent.id);
  }, [viewModalOpen, selectedEvent, detailTab, loadStats]);

  const { createEventHandler, saveEditHandler, confirmDeleteHandler, confirmCancelHandler, checkInAttendeeHandler, loadAttendeesForEvent } =
    useEventActions({ scopeId, setEvents, setSelectedEvent, onRefetch: fetchEvents });

  const withSubmitting = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    try { await fn(); } finally { setSubmitting(false); }
  };

  const handleView = (event: Event) => {
    setSelectedEvent(event); setDetailTab("overview"); setEventStats(null); setViewModalOpen(true);
    setAttendeesLoading(true);
    void loadAttendeesForEvent(event.id).finally(() => setAttendeesLoading(false));
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditForm({ ...initialEventForm, title: event.title, description: event.description, category: event.category, banner: event.banner, eventType: event.eventType, venue: event.venue ?? "", onlineLink: event.onlineLink ?? "", startDateTime: event.startDateTime, endDateTime: event.endDateTime, participantLimit: event.participantLimit, maxParticipants: event.maxParticipants ?? 100, pricingType: event.pricingType, ticketCategories: event.ticketCategories ?? [], refundPolicy: event.refundPolicy ?? "No refunds", createGroup: event.createGroup, groupName: event.groupName ?? "" });
    setEditModalOpen(true);
  };

  const handleViewAttendees = (event: Event) => {
    setSelectedEvent(event); setAttendeesModalOpen(true);
    setAttendeesLoading(true);
    void loadAttendeesForEvent(event.id).finally(() => setAttendeesLoading(false));
  };

  const pendingCount = events.filter(e => e.status === "Upcoming" || e.status === "Ongoing").length;
  const pastCount = events.filter(e => e.status === "Completed" || e.status === "Cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("events.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("events.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />{t("events.createEvent")}
        </Button>
      </div>

      {loading && <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading events…</div>}
      {error && <div className="flex items-center gap-2 text-destructive py-4"><AlertCircle className="h-5 w-5" /><span>{error}</span><Button variant="ghost" size="sm" onClick={() => void fetchEvents()}>Retry</Button></div>}

      {!loading && !error && (
        <EventsTable events={events} activeTab={activeTab} searchQuery={searchQuery} categoryFilter={categoryFilter} pendingCount={pendingCount} pastCount={pastCount} onTabChange={setActiveTab} onSearchChange={setSearchQuery} onCategoryChange={setCategoryFilter} onView={handleView} onEdit={handleEdit} onDelete={(ev) => { setSelectedEvent(ev); setDeleteModalOpen(true); }} onViewAttendees={handleViewAttendees} onCancelEvent={(ev) => { setSelectedEvent(ev); setCancelModalOpen(true); }} />
      )}

      <EventFormModal mode="create" open={createModalOpen} form={createForm} submitting={submitting} onChange={setCreateForm}
        onSubmit={() => void withSubmitting(() => createEventHandler(createForm, () => { setCreateForm(initialEventForm); setCreateModalOpen(false); }))}
        onClose={() => setCreateModalOpen(false)} />

      <EventFormModal mode="edit" open={editModalOpen} form={editForm} submitting={submitting} onChange={setEditForm}
        onSubmit={() => { if (!selectedEvent) return; void withSubmitting(() => saveEditHandler(selectedEvent, editForm, () => { setEditModalOpen(false); setSelectedEvent(null); })); }}
        onClose={() => setEditModalOpen(false)} />

      <EventDetailModal open={viewModalOpen} event={selectedEvent} detailTab={detailTab} eventStats={eventStats} statsLoading={statsLoading} attendeesLoading={attendeesLoading} onTabChange={setDetailTab} onClose={() => setViewModalOpen(false)} onEdit={(ev) => { setViewModalOpen(false); handleEdit(ev); }} onCancelEvent={(ev) => { setSelectedEvent(ev); setCancelModalOpen(true); }} onCheckIn={(id) => void checkInAttendeeHandler(id)} />

      <EventAttendeesDialog open={attendeesModalOpen} eventTitle={selectedEvent?.title} attendees={selectedEvent?.attendees ?? []} loading={attendeesLoading} onClose={() => setAttendeesModalOpen(false)} onCheckIn={(id) => void checkInAttendeeHandler(id)} />

      <CancelEventDialog open={cancelModalOpen} eventTitle={selectedEvent?.title} cancelReason={cancelReason} submitting={submitting} onReasonChange={setCancelReason}
        onConfirm={() => { if (!selectedEvent) return; void withSubmitting(() => confirmCancelHandler(selectedEvent, cancelReason, () => { setCancelModalOpen(false); setCancelReason(""); setSelectedEvent(null); })); }}
        onClose={() => setCancelModalOpen(false)} />

      <DeleteEventDialog open={deleteModalOpen} eventTitle={selectedEvent?.title} submitting={submitting}
        onConfirm={() => { if (!selectedEvent) return; void withSubmitting(() => confirmDeleteHandler(selectedEvent, () => setDeleteModalOpen(false))); }}
        onClose={() => setDeleteModalOpen(false)} />
    </div>
  );
}
