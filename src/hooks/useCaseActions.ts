import { useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  assignCase,
  updateCaseStatus,
  addCaseInternalNote,
  uploadCaseEvidence,
} from "@/services/graphql/support";
import type {
  SupportCase,
  SupportCaseNote,
  SupportCaseEvidence,
  SupportCaseStatus,
} from "@/services/graphql/support";

export interface UseCaseActionsReturn {
  /** Generic per-action busy flag, e.g. "assign", "status", "note", "evidence". */
  busy: string | null;
  assign: (caseId: string, assigneeUserId: string) => Promise<SupportCase | null>;
  changeStatus: (args: {
    caseId: string;
    targetStatus: SupportCaseStatus;
    reason?: string;
    resolutionSummary?: string;
  }) => Promise<SupportCase | null>;
  addNote: (caseId: string, body: string) => Promise<SupportCaseNote | null>;
  addEvidence: (caseId: string, file: File) => Promise<SupportCaseEvidence | null>;
}

/**
 * Workflow actions for a single case: assign, status transition, internal note,
 * and evidence upload — each with toast feedback and light validation. Returns
 * the mutation result (or null on failure) so callers can refresh local state.
 */
export function useCaseActions(): UseCaseActionsReturn {
  const [busy, setBusy] = useState<string | null>(null);

  const assign = useCallback(
    async (caseId: string, assigneeUserId: string): Promise<SupportCase | null> => {
      if (!assigneeUserId.trim()) {
        toast({
          title: "Validation",
          description: "An assignee is required.",
          variant: "destructive",
        });
        return null;
      }
      setBusy("assign");
      try {
        const updated = await assignCase(caseId, assigneeUserId.trim());
        toast({ title: "Case assigned", description: "The case has been assigned." });
        return updated;
      } catch (err) {
        toast({
          title: "Failed to assign case",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const changeStatus = useCallback(
    async (args: {
      caseId: string;
      targetStatus: SupportCaseStatus;
      reason?: string;
      resolutionSummary?: string;
    }): Promise<SupportCase | null> => {
      if (args.targetStatus === "RESOLVED" && !args.resolutionSummary?.trim()) {
        toast({
          title: "Validation",
          description: "A resolution summary is required to resolve a case.",
          variant: "destructive",
        });
        return null;
      }
      setBusy("status");
      try {
        const updated = await updateCaseStatus({
          caseId: args.caseId,
          targetStatus: args.targetStatus,
          reason: args.reason?.trim() || undefined,
          resolutionSummary: args.resolutionSummary?.trim() || undefined,
        });
        toast({
          title: "Status updated",
          description: `Case moved to ${args.targetStatus}.`,
        });
        return updated;
      } catch (err) {
        toast({
          title: "Failed to update status",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const addNote = useCallback(
    async (caseId: string, body: string): Promise<SupportCaseNote | null> => {
      if (!body.trim()) {
        toast({
          title: "Validation",
          description: "Note cannot be empty.",
          variant: "destructive",
        });
        return null;
      }
      setBusy("note");
      try {
        const note = await addCaseInternalNote(caseId, body.trim());
        toast({ title: "Note added", description: "Internal note saved." });
        return note;
      } catch (err) {
        toast({
          title: "Failed to add note",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const addEvidence = useCallback(
    async (caseId: string, file: File): Promise<SupportCaseEvidence | null> => {
      setBusy("evidence");
      try {
        const evidence = await uploadCaseEvidence(caseId, file);
        toast({ title: "Evidence uploaded", description: file.name });
        return evidence;
      } catch (err) {
        toast({
          title: "Failed to upload evidence",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  return { busy, assign, changeStatus, addNote, addEvidence };
}
