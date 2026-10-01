import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, Inbox, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  approveAssociationLink,
  getPendingAssociationLinkRequests,
  rejectAssociationLink,
} from "@/services/graphql/associations";
import type { AssociationLinkRequest } from "@/services/graphql/associations";
import { graphqlErrorMessage } from "@/lib/graphqlErrors";

interface AssociationLinkRequestsProps {
  communityId: string;
  /** Called after a request is approved, so the page can reload its linked associations. */
  onLinked: () => void | Promise<void>;
}

type Decision = "approve" | "reject";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The community's approval queue for associations that asked to be linked to it.
 * Mounted only on the Associations page for a community-scoped admin, so the
 * pending list is fetched only where it is shown.
 */
export function AssociationLinkRequests({ communityId, onLinked }: AssociationLinkRequestsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AssociationLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Which row is being decided, so only its buttons show progress.
  const [busy, setBusy] = useState<{ associationId: string; decision: Decision } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const pending = await getPendingAssociationLinkRequests(communityId);
      setRequests(pending.filter((request) => request.status === "PENDING"));
    } catch {
      // A load failure gets a translated message + Retry; the raw error stays out of the UI.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const nameOf = (request: AssociationLinkRequest) =>
    request.associationName?.trim() || t("associations.linkRequests.unknownAssociation");

  const decide = async (request: AssociationLinkRequest, decision: Decision) => {
    const name = nameOf(request);
    setBusy({ associationId: request.associationId, decision });
    try {
      if (decision === "approve") {
        await approveAssociationLink(communityId, request.associationId);
        toast({
          title: t("associations.linkRequests.approved"),
          description: t("associations.linkRequests.approvedDesc", { name }),
        });
        await Promise.all([load(), onLinked()]);
      } else {
        await rejectAssociationLink(communityId, request.associationId);
        toast({
          title: t("associations.linkRequests.rejected"),
          description: t("associations.linkRequests.rejectedDesc", { name }),
        });
        // A declined request never changes the linked list, so only the queue reloads.
        await load();
      }
    } catch (err) {
      toast({
        title: t("associations.linkRequests.actionError"),
        description: graphqlErrorMessage(err, t("associations.linkRequests.actionError")),
        variant: "destructive",
      });
      // The request may already have been decided elsewhere — show the current queue.
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby="association-link-requests-heading"
      className="rounded-xl border border-border bg-card p-4 shadow-card"
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 id="association-link-requests-heading" className="text-lg font-semibold text-foreground">
          {t("associations.linkRequests.title")}
        </h2>
        {!loading && !loadError && requests.length > 0 && (
          <Badge variant="secondary">{requests.length}</Badge>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{t("associations.linkRequests.description")}</p>

      {loading && requests.length === 0 ? (
        <div role="status" className="flex items-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {t("common.loading")}
        </div>
      ) : loadError ? (
        <div role="alert" className="flex items-center gap-2 py-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{t("associations.linkRequests.loadError")}</span>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4" aria-hidden="true" />
          {t("associations.linkRequests.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const name = nameOf(request);
            const rowBusy = busy?.associationId === request.associationId;
            return (
              <li
                key={request.associationId}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.associationAvatarUrl || undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 text-primary">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{name}</p>
                    {request.requestedAt && (
                      <p className="text-sm text-muted-foreground">
                        {t("associations.linkRequests.requested", {
                          date: new Date(request.requestedAt).toLocaleString(),
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    aria-label={t("associations.linkRequests.rejectAria", { name })}
                    onClick={() => void decide(request, "reject")}
                  >
                    {rowBusy && busy?.decision === "reject" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <X className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {t("associations.linkRequests.reject")}
                  </Button>
                  <Button
                    disabled={busy !== null}
                    aria-label={t("associations.linkRequests.approveAria", { name })}
                    onClick={() => void decide(request, "approve")}
                  >
                    {rowBusy && busy?.decision === "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {t("associations.linkRequests.approve")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
