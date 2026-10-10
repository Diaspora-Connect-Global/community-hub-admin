import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { registrationStatusLabel, registrationStatusTone, TONE_CLASSES } from "@/lib/eventNetworking";

/** A registration status as the organiser reads it (Awaiting approval, Waitlisted, Declined…). */
export function RegistrationStatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_CLASSES[registrationStatusTone(status)], className)}>
      {registrationStatusLabel(status)}
    </Badge>
  );
}
