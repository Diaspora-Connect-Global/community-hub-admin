import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { registrationStatusLabel, registrationStatusTone, type RegistrationTone } from "@/lib/eventNetworking";

/** Colour per tone, written in this console's own design tokens. */
const TONE_CLASSES: Record<RegistrationTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  muted: "bg-secondary text-secondary-foreground",
};

/** A registration status as the organiser reads it (Awaiting approval, Waitlisted, Declined…). */
export function RegistrationStatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_CLASSES[registrationStatusTone(status)], className)}>
      {registrationStatusLabel(status)}
    </Badge>
  );
}
