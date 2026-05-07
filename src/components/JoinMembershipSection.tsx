import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";
import {
  requestMembership,
  cancelMembershipSubscription,
  getMyMembership,
} from "@/services/graphql/membership";
import type { MyMembershipResult } from "@/services/graphql/membership";
import { format } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

interface JoinMembershipSectionProps {
  entityId: string;
  entityType: "ASSOCIATION" | "COMMUNITY";
  entityName: string;
}

// ── Polling constants ─────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 60_000;

// ── Component ────────────────────────────────────────────────────────────────

export function JoinMembershipSection({
  entityId,
  entityType,
  entityName: entityNameProp,
}: JoinMembershipSectionProps) {
  const { toast } = useToast();

  const [membership, setMembership] = useState<MyMembershipResult | null>(null);
  // Prefer the name returned by the server; fall back to the prop passed by the parent.
  const entityName = membership?.entityName || entityNameProp;
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const isJoiningRef = useRef(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Post-payment polling state
  const [isPolling, setIsPolling] = useState(false);
  const [pollMessage, setPollMessage] = useState<string>("");

  // Cancel subscription state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load current membership status ───────────────────────────────────────

  const loadMembership = useCallback(async () => {
    try {
      const result = await getMyMembership(entityId, entityType);
      setMembership(result);
      setMembershipError(null);
    } catch {
      setMembership(null);
      setMembershipError("Could not load membership status.");
    } finally {
      setMembershipLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    void loadMembership();
  }, [loadMembership]);

  // ── Polling for ACTIVE status after payment ───────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setIsPolling(false);
    setPollMessage("");
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    setIsPolling(true);
    setPollMessage("Payment successful! Your membership is being activated…");

    pollTimerRef.current = setInterval(async () => {
      try {
        const result = await getMyMembership(entityId, entityType);
        if (result?.status === "ACTIVE") {
          stopPolling();
          setMembership(result);
          toast({
            title: "Welcome!",
            description: `You're now a member of ${entityName}.`,
          });
        }
      } catch {
        // Ignore polling errors — will retry
      }
    }, POLL_INTERVAL_MS);

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      toast({
        title: "Activation taking longer than expected",
        description: "Your membership is being activated — check back in a moment.",
      });
      void loadMembership();
    }, POLL_TIMEOUT_MS);
  }, [entityId, entityType, entityName, loadMembership, stopPolling, toast]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // ── Join handler ──────────────────────────────────────────────────────────

  const handleJoin = async () => {
    if (isJoiningRef.current) return;
    isJoiningRef.current = true;
    setIsJoining(true);
    try {
      const result = await requestMembership({ entityId, entityType });

      if (result.requiresPayment && result.clientSecret) {
        setClientSecret(result.clientSecret);
        setPaymentModalOpen(true);
      } else {
        setMembership({
          id: result.id,
          status: result.status,
          requiresPayment: result.requiresPayment,
        });
        toast({
          title: result.status === "ACTIVE" ? "Joined!" : "Request submitted",
          description:
            result.message ??
            (result.status === "ACTIVE"
              ? `You are now a member of ${entityName}.`
              : "Your membership request has been submitted for review."),
        });
        void loadMembership();
      }
    } catch (err) {
      toast({
        title: "Could not submit request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      isJoiningRef.current = false;
      setIsJoining(false);
    }
  };

  // ── Payment success handler ───────────────────────────────────────────────

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setClientSecret(null);
    startPolling();
  };

  const handlePaymentCancel = () => {
    setPaymentModalOpen(false);
    setClientSecret(null);
  };

  // ── Cancel subscription handler ───────────────────────────────────────────

  const handleCancelSubscription = async () => {
    if (!membership) return;
    setIsCancelling(true);
    try {
      const result = await cancelMembershipSubscription({ membershipId: membership.id });
      if (result.success) {
        toast({
          title: "Subscription cancelled",
          description: result.message ?? "Your membership subscription has been cancelled.",
        });
        setCancelDialogOpen(false);
        void loadMembership();
      } else {
        toast({
          title: "Cancellation failed",
          description: result.message ?? "Could not cancel subscription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Cancellation failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (membershipLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (membershipError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <p className="text-sm text-muted-foreground">{membershipError}</p>
          <Button variant="outline" size="sm" onClick={() => { void loadMembership(); }}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const isActive = membership?.status === "ACTIVE";
  const isPendingReview = membership?.status === "PENDING";
  const isPendingPayment = membership?.status === "PENDING_PAYMENT";
  const hasSubscription = isActive && !!membership?.hasActiveSubscription;
  const expiresAt = membership?.expiresAt
    ? format(new Date(membership.expiresAt), "MMMM d, yyyy")
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
            Membership
          </CardTitle>
          <CardDescription>
            {isActive
              ? `You are an active member of ${entityName}.`
              : isPendingReview
              ? "Your membership request is pending review."
              : isPendingPayment
              ? "Your payment was not completed."
              : `Join ${entityName} to access member benefits.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active membership */}
          {isActive && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">Active Member</span>
            </div>
          )}

          {/* Subscription management */}
          {hasSubscription && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              {expiresAt && (
                <p className="text-sm text-muted-foreground">
                  Current period ends{" "}
                  <span className="font-medium text-foreground">{expiresAt}</span>
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          )}

          {/* Pending review state */}
          {isPendingReview && (
            <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>Pending approval</span>
            </div>
          )}

          {/* Pending payment state */}
          {isPendingPayment && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your payment was not completed.</p>
              <Button size="sm" onClick={() => { void handleJoin(); }} disabled={isJoining}>
                Complete Payment
              </Button>
            </div>
          )}

          {/* Post-payment polling */}
          {isPolling && (
            <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>{pollMessage}</span>
            </div>
          )}

          {/* Join button (only when not a member and not pending/polling) */}
          {!membership && !isPolling && !isPendingPayment && (
            <Button
              onClick={() => { void handleJoin(); }}
              disabled={isJoining}
              className="w-full sm:w-auto"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting…
                </>
              ) : (
                `Join ${entityName}`
              )}
            </Button>
          )}

          {/* Cancelled / Expired state */}
          {(membership?.status === "CANCELLED" || membership?.status === "EXPIRED") && !isPolling && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {membership.status === "EXPIRED" ? "Your membership has expired." : "Your membership has been cancelled."}
              </p>
              <Button onClick={() => { void handleJoin(); }} disabled={isJoining} size="sm" variant="outline">
                {isJoining ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Rejoin"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe payment modal */}
      <PaymentModal
        open={paymentModalOpen}
        clientSecret={clientSecret ?? ""}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />

      {/* Cancel subscription confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your membership subscription to{" "}
              <strong>{entityName}</strong>? You will retain access until the end of the current
              billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleCancelSubscription(); }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling…
                </>
              ) : (
                "End Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
