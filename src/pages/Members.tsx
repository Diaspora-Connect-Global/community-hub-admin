import { useState } from "react";
import { Search, MoreHorizontal, Eye, MessageSquare, UserPlus, Mail } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Member {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  trustScore: number;
}

const membersData: Member[] = [
  { id: "M001", name: "Kwame Asante", email: "kwame@example.com", bio: "Entrepreneur and business consultant with 10+ years of experience in the tech industry.", role: "Member", joinedAt: "2024-01-15", lastActive: "2 hours ago", trustScore: 92 },
  { id: "M002", name: "Ama Mensah", email: "ama@example.com", bio: "Community moderator and event organizer. Passionate about cultural preservation.", role: "Moderator", joinedAt: "2023-12-20", lastActive: "30 min ago", trustScore: 98 },
  { id: "M003", name: "Kofi Owusu", email: "kofi@example.com", bio: "Software developer and educator. Loves teaching coding to beginners.", role: "Member", joinedAt: "2024-01-10", lastActive: "1 day ago", trustScore: 85 },
  { id: "M004", name: "Akua Boateng", email: "akua@example.com", bio: "Marketing professional specializing in digital marketing and brand strategy.", role: "Member", joinedAt: "2024-01-08", lastActive: "5 hours ago", trustScore: 88 },
  { id: "M005", name: "Yaw Mensah", email: "yaw@example.com", bio: "Finance expert and community advisor. Helps members with financial literacy.", role: "Moderator", joinedAt: "2023-11-15", lastActive: "Online", trustScore: 95 },
  { id: "M006", name: "Abena Sarpong", email: "abena@example.com", bio: "Artist and creative director. Organizes cultural workshops and exhibitions.", role: "Member", joinedAt: "2024-01-05", lastActive: "3 days ago", trustScore: 78 },
  { id: "M007", name: "Nana Agyei", email: "nana@example.com", bio: "Student and aspiring entrepreneur. Active in youth community programs.", role: "Member", joinedAt: "2024-01-02", lastActive: "1 week ago", trustScore: 72 },
  { id: "M008", name: "Efua Darko", email: "efua@example.com", bio: "Healthcare professional and wellness advocate. Organizes health awareness programs.", role: "Member", joinedAt: "2023-12-28", lastActive: "2 hours ago", trustScore: 91 },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function getTrustScoreColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 75) return "text-primary";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export default function Members() {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleView = (member: Member) => {
    setSelectedMember(member);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Members Directory</h1>
          <p className="text-muted-foreground mt-1">Browse and search members within your community.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Member</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-28">Joined</TableHead>
              <TableHead className="w-32">Last Active</TableHead>
              <TableHead className="w-28 text-center">Trust Score</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersData.map((member) => (
              <TableRow key={member.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{member.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={member.role === "Moderator" ? "default" : "secondary"} className={member.role === "Moderator" ? "bg-primary/10 text-primary" : ""}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{member.joinedAt}</TableCell>
                <TableCell>
                  <span className={member.lastActive === "Online" ? "text-success font-medium" : "text-muted-foreground text-sm"}>
                    {member.lastActive}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-semibold ${getTrustScoreColor(member.trustScore)}`}>
                    {member.trustScore}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(member)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <MessageSquare className="h-4 w-4 mr-2" />Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <UserPlus className="h-4 w-4 mr-2" />Invite to Group
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <Mail className="h-4 w-4 mr-2" />Invite to Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Profile Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display">Member Profile</DialogTitle>
            <DialogDescription>View member details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {selectedMember ? getInitials(selectedMember.name) : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{selectedMember?.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedMember?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={selectedMember?.role === "Moderator" ? "default" : "secondary"} className={selectedMember?.role === "Moderator" ? "bg-primary/10 text-primary" : ""}>
                {selectedMember?.role}
              </Badge>
              <span className={`font-semibold ${getTrustScoreColor(selectedMember?.trustScore || 0)}`}>
                Trust Score: {selectedMember?.trustScore}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Joined:</span>
                <p className="font-medium">{selectedMember?.joinedAt}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Active:</span>
                <p className={selectedMember?.lastActive === "Online" ? "text-success font-medium" : "font-medium"}>
                  {selectedMember?.lastActive}
                </p>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Bio</span>
              <p className="text-foreground mt-1">{selectedMember?.bio}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
