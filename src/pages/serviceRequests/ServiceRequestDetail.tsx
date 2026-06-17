import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Send,
  Download,
  Upload,
  FileText,
  History,
  StickyNote,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  serviceRequest as fetchServiceRequest,
  serviceRequestTypes as fetchServiceRequestTypes,
  serviceRequestInternalNotes as fetchInternalNotes,
  serviceRequestDocuments as fetchDocuments,
  uploadServiceRequestDocument,
} from "@/services/graphql/serviceRequests";
import type {
  ServiceRequest,
  ServiceRequestType,
  ServiceRequestNote,
  ServiceRequestDocument,
  ServiceRequestOwnerType,
} from "@/services/graphql/serviceRequests";
import { useAuthStore } from "@/stores/authStore";
import { useServiceRequestActions } from "@/hooks/useServiceRequestActions";
import { FormResponseView } from "@/pages/serviceRequests/FormResponseView";
import { RequestInfoModal } from "@/pages/serviceRequests/RequestInfoModal";
import {
  RequestDecisionModal,
  type DecisionKind,
} from "@/pages/serviceRequests/RequestDecisionModal";
import {
  canPerform,
  formatStatusLabel,
  getStatusBadgeClass,
  getPaymentBadgeClass,
  formatMoney,
  formatDate,
  formatDateTime,
  parseFormResponses,
} from "@/pages/serviceRequests/types";

export default function ServiceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);

  const ownerType: ServiceRequestOwnerType =
    admin?.scopeType?.toUpperCase() === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";
  const ownerEntityId = admin?.scopeId ?? "";

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [requestType, setRequestType] = useState<ServiceRequestType | null>(null);
  const [notes, setNotes] = useState<ServiceRequestNote[]>([]);
  const [documents, setDocuments] = useState<ServiceRequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  // Workflow modal state
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionKind, setDecisionKind] = useState<DecisionKind>("approve");

  // Assign / note inline state
  const [assigneeInput, setAssigneeInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFieldKey, setUploadFieldKey] = useState("");

  const reloadRequest = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const req = await fetchServiceRequest(id);
      if (!req) {
        setError(t("serviceRequests.detail.notFound"));
        setRequest(null);
        return;
      }
      setRequest(req);
      // Resolve the request-type for form-field labels (best-effort).
      try {
        const types = await fetchServiceRequestTypes(ownerType, ownerEntityId);
        setRequestType(types.find((rt) => rt.id === req.requestTypeId) ?? null);
      } catch {
        setRequestType(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("serviceRequests.detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, ownerType, ownerEntityId, t]);

  useEffect(() => {
    void reloadRequest();
  }, [reloadRequest]);

  // Lazy-load notes and documents when those tabs are first opened.
  const loadNotes = useCallback(async () => {
    if (!id) return;
    try {
      setNotes(await fetchInternalNotes(id, 100, 0));
    } catch {
      // non-fatal
    }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    if (!id) return;
    try {
      setDocuments(await fetchDocuments(id));
    } catch {
      // non-fatal
    }
  }, [id]);

  useEffect(() => {
    if (tab === "notes") void loadNotes();
    if (tab === "documents") void loadDocuments();
  }, [tab, loadNotes, loadDocuments]);

  const handleRequestUpdated = useCallback((updated: ServiceRequest) => {
    setRequest(updated);
  }, []);

  const handleNoteAdded = useCallback((note: ServiceRequestNote) => {
    setNotes((prev) => [note, ...prev]);
    setNoteInput("");
  }, []);

  const actions = useServiceRequestActions({
    requestId: id ?? "",
    onRequestUpdated: handleRequestUpdated,
    onNoteAdded: handleNoteAdded,
  });

  const responses = useMemo(
    () => parseFormResponses(request?.formResponsesJson),
    [request?.formResponsesJson],
  );

  const handleUpload = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      const doc = await uploadServiceRequestDocument(
        id,
        file,
        uploadFieldKey.trim() || undefined,
      );
      setDocuments((prev) => [doc, ...prev]);
      setUploadFieldKey("");
      toast({ title: t("serviceRequests.documents.uploaded") });
    } catch (err) {
      toast({
        title: t("serviceRequests.documents.uploadFailed"),
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!id) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("serviceRequests.detail.invalidId")}
      </div>
    );
  }

  if (loading && !request) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("serviceRequests.detail.loading")}
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/service-requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("serviceRequests.detail.back")}
        </Button>
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error ?? t("serviceRequests.detail.notFound")}
        </div>
      </div>
    );
  }

  const status = request.status;
  const fee = formatMoney(request.feeAmountMinor, request.feeCurrency);
  const paymentFailed =
    !!request.paymentStatus &&
    /FAIL|CANCEL/i.test(request.paymentStatus);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/service-requests")}
          className="-ml-2 mb-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("serviceRequests.detail.back")}
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {request.requestNumber}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge className={getStatusBadgeClass(status)}>
                {formatStatusLabel(status)}
              </Badge>
              {requestType && (
                <span className="text-sm text-muted-foreground">
                  {requestType.displayName}
                </span>
              )}
              {request.category && (
                <span className="text-sm text-muted-foreground">
                  {request.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("serviceRequests.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="workflow">{t("serviceRequests.tabs.workflow")}</TabsTrigger>
          <TabsTrigger value="documents">{t("serviceRequests.tabs.documents")}</TabsTrigger>
          <TabsTrigger value="notes">{t("serviceRequests.tabs.notes")}</TabsTrigger>
          <TabsTrigger value="history">{t("serviceRequests.tabs.history")}</TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t("serviceRequests.overview.feePayment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
              <Field label={t("serviceRequests.overview.fee")} value={fee ?? "—"} />
              {request.paymentStatus && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {t("serviceRequests.overview.payment")}
                  </p>
                  <Badge className={getPaymentBadgeClass(request.paymentStatus)}>
                    {request.paymentStatus}
                  </Badge>
                </div>
              )}
              {request.escrowStatus && (
                <Field
                  label={t("serviceRequests.overview.escrow")}
                  value={request.escrowStatus}
                />
              )}
              <Field
                label={t("serviceRequests.overview.requester")}
                value={request.requesterUserId}
              />
              <Field
                label={t("serviceRequests.overview.assignee")}
                value={request.assigneeUserId ?? t("serviceRequests.unassigned")}
              />
              <Field
                label={t("serviceRequests.overview.submitted")}
                value={formatDate(request.submittedAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("serviceRequests.overview.formResponses")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormResponseView
                formFields={requestType?.formFields}
                responses={responses}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Workflow ─────────────────────────────────────────────────────── */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("serviceRequests.workflow.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {canPerform(status, "startReview") && (
                  <Button
                    variant="outline"
                    disabled={actions.pending === "startReview"}
                    onClick={() => void actions.startReview()}
                  >
                    {actions.pending === "startReview" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {t("serviceRequests.workflow.startReview")}
                  </Button>
                )}
                {canPerform(status, "requestInfo") && (
                  <Button variant="outline" onClick={() => setInfoModalOpen(true)}>
                    {t("serviceRequests.workflow.requestInfo")}
                  </Button>
                )}
                {canPerform(status, "approve") && (
                  <Button
                    onClick={() => {
                      setDecisionKind("approve");
                      setDecisionModalOpen(true);
                    }}
                  >
                    {t("serviceRequests.workflow.approve")}
                  </Button>
                )}
                {canPerform(status, "reject") && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDecisionKind("reject");
                      setDecisionModalOpen(true);
                    }}
                  >
                    {t("serviceRequests.workflow.reject")}
                  </Button>
                )}
                {canPerform(status, "complete") && (
                  <Button
                    onClick={() => {
                      setDecisionKind("complete");
                      setDecisionModalOpen(true);
                    }}
                  >
                    {t("serviceRequests.workflow.complete")}
                  </Button>
                )}
                {paymentFailed && (
                  <Button
                    variant="outline"
                    disabled={actions.pending === "retryPayment"}
                    onClick={() => void actions.retryPayment()}
                  >
                    {actions.pending === "retryPayment" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {t("serviceRequests.workflow.retryPayment")}
                  </Button>
                )}
              </div>

              {/* Assign */}
              {canPerform(status, "assign") && (
                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="assignee-id">
                    {t("serviceRequests.workflow.assignLabel")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="assignee-id"
                      value={assigneeInput}
                      onChange={(e) => setAssigneeInput(e.target.value)}
                      placeholder={t("serviceRequests.workflow.assignPlaceholder")}
                    />
                    <Button
                      variant="outline"
                      disabled={!assigneeInput.trim() || actions.pending === "assign"}
                      onClick={() =>
                        void actions
                          .assign(assigneeInput.trim())
                          .then(() => setAssigneeInput(""))
                          .catch(() => undefined)
                      }
                    >
                      {actions.pending === "assign" && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {t("serviceRequests.workflow.assign")}
                    </Button>
                  </div>
                </div>
              )}

              {canPerform(status, "startReview") === false &&
                canPerform(status, "approve") === false &&
                canPerform(status, "reject") === false &&
                canPerform(status, "complete") === false &&
                canPerform(status, "assign") === false &&
                !paymentFailed && (
                  <p className="text-sm text-muted-foreground">
                    {t("serviceRequests.workflow.noActions")}
                  </p>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents ────────────────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t("serviceRequests.documents.upload")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="upload-field-key">
                  {t("serviceRequests.documents.fieldKeyLabel")}
                </Label>
                <Input
                  id="upload-field-key"
                  value={uploadFieldKey}
                  onChange={(e) => setUploadFieldKey(e.target.value)}
                  placeholder={t("serviceRequests.documents.fieldKeyPlaceholder")}
                />
              </div>
              <input
                type="file"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("serviceRequests.documents.uploading")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("serviceRequests.documents.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.fileName ?? doc.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.formFieldKey ? `${doc.formFieldKey} · ` : ""}
                          {doc.mimeType ?? doc.kind ?? ""}
                          {doc.sizeBytes
                            ? ` · ${(doc.sizeBytes / 1024).toFixed(0)} KB`
                            : ""}
                        </p>
                      </div>
                      {doc.readUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={doc.readUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t("serviceRequests.documents.download")}
                          </a>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Internal Notes ───────────────────────────────────────────────── */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                {t("serviceRequests.notes.add")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t("serviceRequests.notes.placeholder")}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  disabled={!noteInput.trim() || actions.pending === "addNote"}
                  onClick={() => void actions.addNote(noteInput.trim()).catch(() => undefined)}
                >
                  {actions.pending === "addNote" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {t("serviceRequests.notes.submit")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("serviceRequests.notes.empty")}
                </p>
              ) : (
                <ul className="space-y-4">
                  {notes.map((note) => (
                    <li key={note.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {note.authorUserId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Status History ───────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("serviceRequests.history.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("serviceRequests.history.empty")}
                </p>
              ) : (
                <ol className="relative border-l border-border pl-6 space-y-6">
                  {request.statusHistory.map((entry) => (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.fromStatus && (
                          <>
                            <Badge className={getStatusBadgeClass(entry.fromStatus)}>
                              {formatStatusLabel(entry.fromStatus)}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <Badge className={getStatusBadgeClass(entry.toStatus)}>
                          {formatStatusLabel(entry.toStatus)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(entry.createdAt)}
                        {entry.actorUserId ? ` · ${entry.actorUserId}` : ""}
                      </p>
                      {entry.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RequestInfoModal
        open={infoModalOpen}
        submitting={actions.pending === "requestInfo"}
        onConfirm={(reason) =>
          void actions
            .requestInfo(reason)
            .then(() => setInfoModalOpen(false))
            .catch(() => undefined)
        }
        onClose={() => setInfoModalOpen(false)}
      />

      <RequestDecisionModal
        open={decisionModalOpen}
        kind={decisionKind}
        submitting={
          actions.pending === "approve" ||
          actions.pending === "reject" ||
          actions.pending === "complete"
        }
        onConfirm={(reason) => {
          const close = () => setDecisionModalOpen(false);
          const fn =
            decisionKind === "approve"
              ? actions.approve(reason || undefined)
              : decisionKind === "reject"
                ? actions.reject(reason)
                : actions.complete(reason || undefined);
          void fn.then(close).catch(() => undefined);
        }}
        onClose={() => setDecisionModalOpen(false)}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground break-words">{value}</p>
    </div>
  );
}
