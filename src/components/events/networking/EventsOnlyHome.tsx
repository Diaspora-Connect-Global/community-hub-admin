import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EventsDashboard } from "./EventsDashboard";

/** Landing page of an events-only community: the Events dashboard. */
export function EventsOnlyHome({ communityId }: { communityId: string }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  return (
    <EventsDashboard
      ownerType="COMMUNITY"
      ownerId={communityId}
      locale={i18n.language}
      onOpenEvent={() => navigate("/events")}
    />
  );
}
