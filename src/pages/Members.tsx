import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { MembersTable } from "@/pages/members/MembersTable";
import { PendingMembersTab } from "@/pages/members/PendingMembersTab";
import { MemberModals } from "@/pages/members/MemberActionModal";
import { useMembersData } from "@/hooks/useMembersData";
import { useMemberActions } from "@/hooks/useMemberActions";

export default function Members() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const scopeId = admin?.scopeId ?? "";
  const scopeType = (admin?.scopeType ?? "COMMUNITY") as string;
  const entityType = scopeType === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";

  const [activeTab, setActiveTab] = useState("members");

  const data = useMembersData({ scopeId, entityType });

  const actions = useMemberActions({
    scopeId,
    entityType,
    page: data.page,
    onMembersChanged: data.fetchMembers,
    onPendingChanged: data.removePendingById,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("members.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("members.subtitle")}</p>
        </div>
        {data.totalMembers > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {data.totalMembers.toLocaleString()} total
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Requests
            {data.pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs w-5 h-5">
                {data.pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-4">
          <MembersTable
            members={data.members}
            loading={data.loading}
            searching={data.searching}
            error={data.error}
            searchTerm={data.searchTerm}
            page={data.page}
            totalMembers={data.totalMembers}
            actionLoading={actions.actionLoading}
            onSearchChange={data.setSearchTerm}
            onPageChange={data.handlePageChange}
            onView={data.handleView}
            onOpenRoleDialog={actions.openRoleDialog}
            onOpenSuspendDialog={actions.openSuspendDialog}
            onUnsuspend={actions.handleUnsuspend}
            onOpenBanDialog={actions.openBanDialog}
            onUnban={actions.handleUnban}
            onOpenRemoveDialog={actions.openRemoveDialog}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <PendingMembersTab
            pendingRequests={data.pendingRequests}
            loadingPending={data.loadingPending}
            actionLoading={actions.actionLoading}
            onApprove={actions.handleApprove}
            onReject={actions.handleReject}
          />
        </TabsContent>
      </Tabs>

      <MemberModals
        {...actions}
        entityType={entityType}
        viewModalOpen={data.viewModalOpen}
        onViewModalOpenChange={data.setViewModalOpen}
        selectedMember={data.selectedMember}
        loadingDetail={data.loadingDetail}
      />
    </div>
  );
}
