/**
 * EventTicketsPanel
 *
 * Renders the ticket-categories read-only display used inside the
 * "Overview" tab of the View Event Details modal.
 *
 * The original code rendered this inline; extracting it here keeps the
 * view-modal cleaner and makes the ticket display reusable.
 */
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import type { TicketCategory } from "@/pages/events/types";

interface EventTicketsPanelProps {
  ticketCategories: TicketCategory[];
  refundPolicy?: string;
  /** The event's currency — the one its ticket prices are stored in. */
  currency: string;
}

export function EventTicketsPanel({
  ticketCategories,
  refundPolicy,
  currency,
}: EventTicketsPanelProps) {
  const { i18n } = useTranslation();
  if (ticketCategories.length === 0 && !refundPolicy) return null;

  return (
    <div className="space-y-4">
      {ticketCategories.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-foreground font-medium">Ticket Categories</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ticketCategories.map((ticket) => (
              <div key={ticket.id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {ticket.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary"
                  >
                    {formatMoney(ticket.price, currency, i18n.language)}
                  </Badge>
                </div>
                {ticket.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticket.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {refundPolicy && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <strong>Refund Policy:</strong> {refundPolicy}
        </div>
      )}
    </div>
  );
}
