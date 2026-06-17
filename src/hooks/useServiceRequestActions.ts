import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  assignServiceRequest,
  startServiceRequestReview,
  requestServiceRequestInfo,
  approveServiceRequest,
  rejectServiceRequest,
  completeServiceRequest,
  retryServiceRequestPayment,
  addServiceRequestInternalNote,
} from "@/services/graphql/serviceRequests";
import type {
  ServiceRequest,
  ServiceRequestNote,
} from "@/services/graphql/serviceRequests";

interface UseServiceRequestActionsParams {
  requestId: string;
  /** Called with the updated request after any workflow mutation succeeds. */
  onRequestUpdated: (request: ServiceRequest) => void;
  /** Called after a note is successfully added. */
  onNoteAdded?: (note: ServiceRequestNote) => void;
}

export interface UseServiceRequestActionsReturn {
  /** Name of the action currently running (for per-button spinners), or null. */
  pending: string | null;
  startReview: () => Promise<void>;
  assign: (assigneeUserId: string) => Promise<void>;
  requestInfo: (reason: string) => Promise<void>;
  approve: (reason?: string) => Promise<void>;
  reject: (reason: string) => Promise<void>;
  complete: (reason?: string) => Promise<void>;
  retryPayment: () => Promise<void>;
  addNote: (body: string) => Promise<void>;
}

/**
 * Wraps the staff workflow mutations with consistent toast + pending-state
 * handling. Each call pushes the updated request back to the detail page via
 * `onRequestUpdated`, keeping the UI (status, history) in sync without a refetch.
 */
export function useServiceRequestActions({
  requestId,
  onRequestUpdated,
  onNoteAdded,
}: UseServiceRequestActionsParams): UseServiceRequestActionsReturn {
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async (
      name: string,
      fn: () => Promise<ServiceRequest>,
      successTitle: string,
    ) => {
      setPending(name);
      try {
        const updated = await fn();
        onRequestUpdated(updated);
        toast({ title: successTitle });
      } catch (err) {
        toast({
          title: "Action failed",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        throw err;
      } finally {
        setPending(null);
      }
    },
    [onRequestUpdated, toast],
  );

  const startReview = useCallback(
    () =>
      run(
        "startReview",
        () => startServiceRequestReview(requestId),
        "Review started",
      ),
    [run, requestId],
  );

  const assign = useCallback(
    (assigneeUserId: string) =>
      run(
        "assign",
        () => assignServiceRequest(requestId, assigneeUserId),
        "Request assigned",
      ),
    [run, requestId],
  );

  const requestInfo = useCallback(
    (reason: string) =>
      run(
        "requestInfo",
        () => requestServiceRequestInfo(requestId, reason),
        "Information requested",
      ),
    [run, requestId],
  );

  const approve = useCallback(
    (reason?: string) =>
      run("approve", () => approveServiceRequest(requestId, reason), "Request approved"),
    [run, requestId],
  );

  const reject = useCallback(
    (reason: string) =>
      run("reject", () => rejectServiceRequest(requestId, reason), "Request rejected"),
    [run, requestId],
  );

  const complete = useCallback(
    (reason?: string) =>
      run(
        "complete",
        () => completeServiceRequest(requestId, reason),
        "Request completed",
      ),
    [run, requestId],
  );

  const retryPayment = useCallback(
    () =>
      run(
        "retryPayment",
        () => retryServiceRequestPayment(requestId),
        "Payment retry initiated",
      ),
    [run, requestId],
  );

  const addNote = useCallback(
    async (body: string) => {
      setPending("addNote");
      try {
        const note = await addServiceRequestInternalNote({ requestId, body });
        onNoteAdded?.(note);
        toast({ title: "Note added" });
      } catch (err) {
        toast({
          title: "Failed to add note",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        throw err;
      } finally {
        setPending(null);
      }
    },
    [requestId, onNoteAdded, toast],
  );

  return {
    pending,
    startReview,
    assign,
    requestInfo,
    approve,
    reject,
    complete,
    retryPayment,
    addNote,
  };
}
