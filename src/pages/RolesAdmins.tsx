import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import {
  getAdminPermissions,
  hasPermission,
  MANAGE_ROLES_PERMISSION,
} from "@/lib/adminAccess";
import { RolesTab } from "@/pages/roles/RolesTab";
import { AdminsTab } from "@/pages/roles/AdminsTab";

export default function RolesAdmins() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const claims = useAuthStore((s) => s.claims);
  const [activeTab, setActiveTab] = useState("roles");

  // Scope is derived strictly from the authenticated admin's own community —
  // never from the UI — so a community admin can only ever manage roles/admins
  // within their own community.
  const communityId =
    admin?.scopeType === "COMMUNITY" ? admin.scopeId ?? "" : "";

  const permissions = getAdminPermissions(claims, admin);
  const canManage =
    hasPermission(permissions, MANAGE_ROLES_PERMISSION) && !!communityId;

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("rolesAdmins.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("rolesAdmins.subtitle")}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">
              {t("rolesAdmins.noAccess.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {t("rolesAdmins.noAccess.description")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("rolesAdmins.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("rolesAdmins.subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">{t("rolesAdmins.tabs.roles")}</TabsTrigger>
          <TabsTrigger value="admins">{t("rolesAdmins.tabs.admins")}</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4">
          <RolesTab communityId={communityId} />
        </TabsContent>

        <TabsContent value="admins" className="mt-4">
          <AdminsTab communityId={communityId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
