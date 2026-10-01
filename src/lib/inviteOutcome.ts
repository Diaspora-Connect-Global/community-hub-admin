/**
 * What an `inviteMember` call actually did, from the membership status it
 * returns. The gateway answers "already a member" / "already asked to join"
 * as a normal (non-error) reply, so a toast must not claim an invitation was
 * sent in those cases.
 */
export type InviteOutcome = "invited" | "alreadyMember" | "alreadyRequested";

export function inviteOutcome(status: string | null | undefined): InviteOutcome {
  switch ((status ?? "").trim().toUpperCase()) {
    case "ACTIVE":
      return "alreadyMember";
    case "PENDING":
      return "alreadyRequested";
    default:
      // INVITED: invited now, or an invitation was already waiting.
      return "invited";
  }
}
