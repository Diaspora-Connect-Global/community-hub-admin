import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SectionTabs } from "@/components/layout/SectionTabs";
import { MembersTable } from "@/pages/members/MembersTable";
import { PendingMembersTab } from "@/pages/members/PendingMembersTab";
import { MemberModals } from "@/pages/members/MemberActionModal";
import { useMembersData } from "@/hooks/useMembersData";
import { useMemberActions } from "@/hooks/useMemberActions";
import { JoinPolicyBanner } from "@/components/JoinPolicyBanner";
import { getCommunity } from "@/services/graphql/community/queries";
import { getAssociation } from "@/services/graphql/associations/queries";

/** Map a raw backend join-policy string onto the JoinPolicyBanner's vocabulary. */
function toBannerPolicy(raw?: string): "OPEN" | "APPROVAL" | "INVITE_ONLY" | "PAID" {
  const p = (raw ?? "").toUpperCase().replace(/\s+/g, "_");
  if (p === "APPROVAL" || p === "INVITE_ONLY" || p === "PAID") return p;
  if (p === "APPROVAL_REQUIRED" || p === "REQUEST") return "APPROVAL";
  return "OPEN";
}

export default function Members() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const scopeId = admin?.scopeId ?? "";
  const scopeType = (admin?.scopeType ?? "COMMUNITY") as string;
  const entityType = scopeType === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";

  // "Join requests" is its own route (/members/requests) so the merged Members
  // section can show it as a tab beside Registries.
  const { pathname } = useLocation();
  const showPending = pathname === "/members/requests";
  const [joinPolicy, setJoinPolicy] = useState<"OPEN" | "APPROVAL" | "INVITE_ONLY" | "PAID" | null>(null);

  const data = useMembersData({ scopeId, entityType });

  useEffect(() => {
    if (!scopeId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const raw =
          entityType === "ASSOCIATION"
            ? (await getAssociation(scopeId)).joinPolicy
            : (await getCommunity(scopeId)).joinPolicy;
        if (!cancelled) setJoinPolicy(toBannerPolicy(raw));
      } catch {
        if (!cancelled) setJoinPolicy(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [scopeId, entityType]);

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

      {joinPolicy && (
        <JoinPolicyBanner
          joinPolicy={joinPolicy}
          entityLabel={entityType === "ASSOCIATION" ? "association" : "community"}
        />
      )}

      <SectionTabs
        section="members"
        labelKey="nav.members"
        badges={{ "/members/requests": data.pendingRequests.length }}
      />

      {!showPending ? (
        <div className="space-y-4">
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
        </div>
      ) : (
        <div className="space-y-4">
          <PendingMembersTab
            pendingRequests={data.pendingRequests}
            loadingPending={data.loadingPending}
            actionLoading={actions.actionLoading}
            onApprove={actions.handleApprove}
            onReject={actions.handleReject}
            hasMore={data.pendingHasMore}
            loadingMore={data.loadingMorePending}
            onLoadMore={data.loadMorePending}
          />
        </div>
      )}

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
