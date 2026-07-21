import { Info, ShieldCheck, Mail, CreditCard, DoorOpen } from "lucide-react";

export type JoinPolicyValue = "OPEN" | "FREE" | "APPROVAL" | "INVITE_ONLY" | "PAID" | string;

const CONFIG: Record<
  "OPEN" | "APPROVAL" | "INVITE_ONLY" | "PAID",
  { icon: typeof Info; title: string; body: (entity: string) => string; tone: string }
> = {
  OPEN: { icon: DoorOpen, title: "Open — anyone can join", body: (e) => `New members join this ${e} instantly. There is nothing to approve.`, tone: "bg-muted/40 border-border text-muted-foreground" },
  APPROVAL: { icon: ShieldCheck, title: "Approval required", body: (e) => `Requests to join this ${e} wait for your decision. Approve or decline each one below.`, tone: "bg-warning/10 border-warning/30 text-foreground" },
  INVITE_ONLY: { icon: Mail, title: "Invite only", body: (e) => `People can't request to join this ${e} — add them with Invite Member.`, tone: "bg-primary/10 border-primary/30 text-foreground" },
  PAID: { icon: CreditCard, title: "Paid membership", body: (e) => `Members join this ${e} after paying. A request appears here only once its payment succeeds.`, tone: "bg-success/10 border-success/30 text-foreground" },
};

function normalize(policy: JoinPolicyValue): "OPEN" | "APPROVAL" | "INVITE_ONLY" | "PAID" {
  const p = (policy ?? "").toString().toUpperCase();
  if (p === "APPROVAL" || p === "INVITE_ONLY" || p === "PAID") return p;
  return "OPEN";
}

export function JoinPolicyBanner({ joinPolicy, entityLabel }: { joinPolicy: JoinPolicyValue; entityLabel: "community" | "association" }) {
  const key = normalize(joinPolicy);
  const { icon: Icon, title, body, tone } = CONFIG[key];
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${tone}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs opacity-90">{body(entityLabel)}</p>
      </div>
    </div>
  );
}
