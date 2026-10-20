import { Search, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdminNotificationsBell } from "@/components/layout/AdminNotificationsBell";
import { useCommunityScope } from "@/hooks/useCommunityScope";
import { Button } from "@/components/ui/button";
import { logout as logoutAdmin } from "@/services/authentication/adminAuthService";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader() {
  const navigate = useNavigate();
  const { communityId } = useCommunityScope();

  const handleSignOut = () => {
    logoutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members, posts, opportunities..."
          className="pl-10 bg-secondary/50 border-border"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications: only what is directed to this admin about this community */}
        <AdminNotificationsBell communityId={communityId || null} />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full surface-brand flex items-center justify-center">
                <User className="h-4 w-4 text-text-white" />
              </div>
              <span className="font-medium">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onSelect={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
