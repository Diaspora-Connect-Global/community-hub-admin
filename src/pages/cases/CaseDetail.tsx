import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Upload,
  FileText,
  ExternalLink,
  Plus,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  supportCase,
  caseInternalNotes,
  caseEvidence,
  caseStatusHistory,
} from "@/services/graphql/support";
import type {
  SupportCase,
  SupportCaseNote,
  SupportCaseEvidence,
  SupportCaseStatusHistoryEntry,
} from "@/services/graphql/support";
import { useCaseActions } from "@/hooks/useCaseActions";
import {
  allowedActionsFor,
  statusColors,
  priorityColors,
  ACTION_LABEL_KEY,
  type CaseActionConfig,
} from "@/pages/cases/types";
import { AssignCaseModal } from "@/pages/cases/AssignCaseModal";
import { CaseStatusModal } from "@/pages/cases/CaseStatusModal";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseData, setCaseData] = useState<SupportCase | null>(null);
  const [notes, setNotes] = useState<SupportCaseNote[]>([]);
  const [evidence, setEvidence] = useState<SupportCaseEvidence[]>([]);
  const [history, setHistory] = useState<SupportCaseStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [noteBody, setNoteBody] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusConfig, setStatusConfig] = useState<CaseActionConfig | null>(null);

  const { busy, assign, changeStatus, addNote, addEvidence } = useCaseActions();

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const c = await supportCase(id);
      if (!c) {
        setError(t("cases.notFound"));
        return;
      }
      setCaseData(c);
      // Status history is embedded on the staff case, but fall back to the
      // dedicated query if it came back empty.
      setHistory(c.statusHistory?.length ? c.statusHistory : await caseStatusHistory(id));
      const [n, e] = await Promise.all([caseInternalNotes(id), caseEvidence(id)]);
      setNotes(n);
      setEvidence(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("cases.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // ── Workflow handlers ──────────────────────────────────────────────────────
  const onActionClick = (config: CaseActionConfig) => {
    if (config.viaAssign) {
      setAssignOpen(true);
    } else {
      setStatusConfig(config);
    }
  };

  const handleAssign = async (assigneeUserId: string) => {
    if (!caseData) return;
    const updated = await assign(caseData.id, assigneeUserId);
    if (updated) {
      setAssignOpen(false);
      void reload();
    }
  };

  const handleStatusSubmit = async (args: { reason?: string; resolutionSummary?: string }) => {
    if (!caseData || !statusConfig) return;
    const updated = await changeStatus({
      caseId: caseData.id,
      targetStatus: statusConfig.targetStatus,
      reason: args.reason,
      resolutionSummary: args.resolutionSummary,
    });
    if (updated) {
      setStatusConfig(null);
      void reload();
    }
  };

  const handleAddNote = async () => {
    if (!caseData) return;
    const note = await addNote(caseData.id, noteBody);
    if (note) {
      setNoteBody("");
      setNotes((prev) => [note, ...prev]);
    }
  };

  const handleEvidenceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caseData) return;
    const added = await addEvidence(caseData.id, file);
    if (added) setEvidence((prev) => [added, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render guards ───────────────────────────────────────────────────────────
  if (!id) {
    return <div className="text-sm text-muted-foreground">{t("cases.invalidId")}</div>;
  }

  if (loading && !caseData) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("cases.backToCases")}
        </Button>
        <div className="text-destructive text-sm">{error ?? t("cases.notFound")}</div>
      </div>
    );
  }

  const actions = allowedActionsFor(caseData.status);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cases")}
          className="-ml-2 mb-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("cases.backToCases")}
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{caseData.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">
                {caseData.caseNumber}
              </span>
              <Badge className={statusColors[caseData.status] ?? ""}>{caseData.status}</Badge>
              {caseData.priority && (
                <Badge className={priorityColors[caseData.priority] ?? ""}>
                  {caseData.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("cases.tabOverview")}</TabsTrigger>
          <TabsTrigger value="workflow">{t("cases.tabWorkflow")}</TabsTrigger>
          <TabsTrigger value="notes">{t("cases.tabNotes")}</TabsTrigger>
          <TabsTrigger value="evidence">{t("cases.tabEvidence")}</TabsTrigger>
          <TabsTrigger value="history">{t("cases.tabHistory")}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
            {caseData.description && (
              <div>
                <span className="text-xs text-muted-foreground">{t("cases.description")}</span>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{caseData.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Field label={t("cases.colType")} value={caseData.category} />
              <Field label={t("cases.reporter")} value={caseData.reporterUserId} />
              <Field
                label={t("cases.colAssignee")}
                value={caseData.assigneeUserId ?? t("cases.unassigned")}
              />
              <Field
                label={t("cases.colCreated")}
                value={
                  caseData.submittedAt
                    ? new Date(caseData.submittedAt).toLocaleString()
                    : caseData.createdAt
                      ? new Date(caseData.createdAt).toLocaleString()
                      : undefined
                }
              />
              <Field
                label={t("cases.resolvedAt")}
                value={caseData.resolvedAt ? new Date(caseData.resolvedAt).toLocaleString() : undefined}
              />
              <Field
                label={t("cases.closedAt")}
                value={caseData.closedAt ? new Date(caseData.closedAt).toLocaleString() : undefined}
              />
            </div>

            {caseData.location && (caseData.location.label || caseData.location.lat != null) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">{t("cases.location")}</span>
                  <p className="text-foreground">
                    {caseData.location.label ??
                      `${caseData.location.lat ?? "?"}, ${caseData.location.lng ?? "?"}`}
                  </p>
                </div>
              </>
            )}

            {(caseData.linkedDisputeId ||
              caseData.linkedEscrowId ||
              caseData.linkedOrderId ||
              caseData.linkedVendorId ||
              caseData.conversationId) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <Field label={t("cases.linkedDispute")} value={caseData.linkedDisputeId} />
                  <Field label={t("cases.linkedEscrow")} value={caseData.linkedEscrowId} />
                  <Field label={t("cases.linkedOrder")} value={caseData.linkedOrderId} />
                  <Field label={t("cases.linkedVendor")} value={caseData.linkedVendorId} />
                  <Field label={t("cases.conversation")} value={caseData.conversationId} />
                </div>
              </>
            )}

            {caseData.resolutionSummary && (
              <>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">
                    {t("cases.resolutionSummary")}
                  </span>
                  <p className="text-foreground mt-1 whitespace-pre-wrap">
                    {caseData.resolutionSummary}
                  </p>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-medium text-foreground">{t("cases.workflowTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("cases.workflowSubtitle", { status: caseData.status })}
              </p>
            </div>
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("cases.noActions")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actions.map((cfg) => (
                  <Button
                    key={cfg.action}
                    variant={cfg.action === "REJECT" ? "destructive" : "default"}
                    onClick={() => onActionClick(cfg)}
                    disabled={busy === "assign" || busy === "status"}
                  >
                    {t(`cases.action.${ACTION_LABEL_KEY[cfg.action]}`)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Internal Notes */}
        <TabsContent value="notes">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="space-y-2">
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder={t("cases.notePlaceholder")}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => void handleAddNote()}
                  disabled={busy === "note" || !noteBody.trim()}
                >
                  {busy === "note" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t("cases.addNote")}
                </Button>
              </div>
            </div>
            <Separator />
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("cases.noNotes")}</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-mono truncate">{n.authorUserId}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        {/* Evidence */}
        <TabsContent value="evidence">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex justify-end">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => void handleEvidenceFile(e)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy === "evidence"}
              >
                {busy === "evidence" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {t("cases.uploadEvidence")}
              </Button>
            </div>
            <Separator />
            {evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("cases.noEvidence")}</p>
            ) : (
              <ul className="space-y-3">
                {evidence.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {ev.fileName ?? ev.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ev.kind ?? "—"} ·{" "}
                          {ev.uploadedAt ? new Date(ev.uploadedAt).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    {ev.readUrl && (
                      <a href={ev.readUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t("cases.view")}
                        </Button>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        {/* Status History */}
        <TabsContent value="history">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("cases.noHistory")}</p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-6">
                {history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                      {h.fromStatus && (
                        <Badge className={statusColors[h.fromStatus] ?? ""}>
                          {h.fromStatus}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">→</span>
                      <Badge className={statusColors[h.toStatus] ?? ""}>{h.toStatus}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(h.createdAt).toLocaleString()}
                      {h.actorUserId ? ` · ${h.actorUserId}` : ""}
                    </p>
                    {h.reason && <p className="text-sm text-foreground mt-1">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AssignCaseModal
        open={assignOpen}
        caseNumber={caseData.caseNumber}
        currentAssignee={caseData.assigneeUserId}
        submitting={busy === "assign"}
        onClose={() => setAssignOpen(false)}
        onSubmit={(uid) => void handleAssign(uid)}
      />

      <CaseStatusModal
        open={statusConfig !== null}
        caseNumber={caseData.caseNumber}
        config={statusConfig}
        submitting={busy === "status"}
        onClose={() => setStatusConfig(null)}
        onSubmit={(args) => void handleStatusSubmit(args)}
      />
    </div>
  );
}
