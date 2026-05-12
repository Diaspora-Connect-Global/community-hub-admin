import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, Globe, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getGroup, getGroupMembers } from "@/services/graphql/groups/queries";
import type { Group, GroupMember } from "@/services/graphql/groups/types";
import OverviewTab from "@/components/groups/OverviewTab";
import MembersTab from "@/components/groups/MembersTab";
import InvitationsTab from "@/components/groups/InvitationsTab";
import JoinRequestsTab from "@/components/groups/JoinRequestsTab";
import BlockedTab from "@/components/groups/BlockedTab";
import SettingsTab from "@/components/groups/SettingsTab";
import ChatTab from "@/components/groups/ChatTab";

function PrivacyBadge({ privacy }: { privacy: Group["privacy"] }) {
  const Icon =
    privacy === "PUBLIC" ? Globe : privacy === "SECRET" ? ShieldAlert : Lock;
  const label = privacy.charAt(0) + privacy.slice(1).toLowerCase();
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  const reload = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [g, m] = await Promise.all([
        getGroup(groupId),
        getGroupMembers(groupId, 100, 0),
      ]);
      setGroup(g);
      setMembers(m.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDeleted = () => {
    toast({ title: "Group deleted" });
    navigate("/groups");
  };

  const handleUpdated = (updated: Group) => {
    setGroup((prev) => ({ ...prev, ...updated }));
  };

  if (!groupId) {
    return <div className="text-sm text-muted-foreground">Invalid group id.</div>;
  }

  if (loading && !group) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading group…
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to groups
        </Button>
        <div className="text-destructive text-sm">{error ?? "Group not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/groups")}
          className="-ml-2 mb-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to groups
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{group.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <PrivacyBadge privacy={group.privacy} />
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {group.memberCount} members
              </span>
              {group.category && (
                <span className="text-sm text-muted-foreground">{group.category}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab group={group} />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab
            groupId={group.id}
            members={members}
            onChanged={reload}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ChatTab groupId={group.id} members={members} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsTab groupId={group.id} />
        </TabsContent>

        <TabsContent value="requests">
          <JoinRequestsTab groupId={group.id} onChanged={reload} />
        </TabsContent>

        <TabsContent value="blocked">
          <BlockedTab groupId={group.id} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab
            group={group}
            members={members}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
