import { Plus, Search, MoreHorizontal, Eye, Edit, Archive, Trash2, Users, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const groups = [
  { id: "GRP001", name: "Business Network", privacy: "Private", members: 245, createdAt: "2024-01-15", lastActive: "2 hours ago" },
  { id: "GRP002", name: "Tech Professionals", privacy: "Public", members: 189, createdAt: "2024-01-12", lastActive: "30 min ago" },
  { id: "GRP003", name: "Cultural Heritage", privacy: "Private", members: 312, createdAt: "2024-01-10", lastActive: "1 hour ago" },
  { id: "GRP004", name: "Women in Leadership", privacy: "Private", members: 156, createdAt: "2024-01-08", lastActive: "5 hours ago" },
  { id: "GRP005", name: "Student Connect", privacy: "Public", members: 423, createdAt: "2024-01-05", lastActive: "15 min ago" },
];

export default function Groups() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Groups (My Groups)</h1>
          <p className="text-muted-foreground mt-1">Create and manage your community groups. Messages are end-to-end encrypted.</p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search groups..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Privacy</TableHead>
              <TableHead className="w-28 text-center">Members</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-32">Last Active</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{group.id}</TableCell>
                <TableCell className="font-medium text-foreground">{group.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    {group.privacy === "Private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {group.privacy}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.members}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{group.createdAt}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{group.lastActive}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Metadata</DropdownMenuItem>
                      <DropdownMenuItem><Users className="h-4 w-4 mr-2" />Manage Members</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Archive className="h-4 w-4 mr-2" />Archive</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* E2EE Notice */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
        <Lock className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          All group messages are <span className="text-foreground font-medium">end-to-end encrypted</span>. You can only manage group metadata and members, not message content.
        </p>
      </div>
    </div>
  );
}
