import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { StaffPanel } from "./StaffPanel";
import { RegistrationSettingsPanel } from "./RegistrationSettingsPanel";

/** Approvals · Staff · Registration settings for one event. */
export function EventNetworkingTabs({ eventId, onChanged }: { eventId: string; onChanged?: () => void }) {
  return (
    <Tabs defaultValue="approvals" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="approvals">Approvals</TabsTrigger>
        <TabsTrigger value="staff">Staff</TabsTrigger>
        <TabsTrigger value="settings">Registration</TabsTrigger>
      </TabsList>
      <TabsContent value="approvals" className="mt-4"><ApprovalsPanel eventId={eventId} onChanged={onChanged} /></TabsContent>
      <TabsContent value="staff" className="mt-4"><StaffPanel eventId={eventId} /></TabsContent>
      <TabsContent value="settings" className="mt-4"><RegistrationSettingsPanel eventId={eventId} /></TabsContent>
    </Tabs>
  );
}
