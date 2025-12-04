import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";

interface Group {
  id: string;
  name: string;
  description?: string;
  privacy: string;
  members: number;
  createdAt: string;
  lastActive: string;
  profilePicture?: string;
}

const groupsData: Group[] = [
  { id: "GRP001", name: "Business Network", description: "A community for entrepreneurs and business professionals to network and share opportunities.", privacy: "Private", members: 245, createdAt: "2024-01-15", lastActive: "2 hours ago" },
  { id: "GRP002", name: "Tech Professionals", description: "Connect with technology professionals, share knowledge, and discuss industry trends.", privacy: "Public", members: 189, createdAt: "2024-01-12", lastActive: "30 min ago" },
  { id: "GRP003", name: "Cultural Heritage", description: "Celebrating and preserving our cultural heritage through stories, traditions, and events.", privacy: "Private", members: 312, createdAt: "2024-01-10", lastActive: "1 hour ago" },
  { id: "GRP004", name: "Women in Leadership", description: "Empowering women through mentorship, resources, and community support.", privacy: "Private", members: 156, createdAt: "2024-01-08", lastActive: "5 hours ago" },
  { id: "GRP005", name: "Student Connect", description: "A space for students to collaborate, share resources, and support each other.", privacy: "Public", members: 423, createdAt: "2024-01-05", lastActive: "15 min ago" },
];

export default function Groups() {
  const location = useLocation();
  const [groups, setGroups] = useState<Group[]>(groupsData);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", privacy: "", profilePicture: "" });
  const [createForm, setCreateForm] = useState({ name: "", description: "", privacy: "", profilePicture: "" });

  // Open create modal if navigated with state
  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleView = (group: Group) => {
    setSelectedGroup(group);
    setViewModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setEditForm({
      name: group.name,
      description: group.description || "",
      privacy: group.privacy,
      profilePicture: group.profilePicture || "",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (group: Group) => {
    setSelectedGroup(group);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGroup) {
      setGroups(groups.filter((g) => g.id !== selectedGroup.id));
      setDeleteModalOpen(false);
      setSelectedGroup(null);
    }
  };

  const saveEdit = () => {
    if (selectedGroup) {
      setGroups(
        groups.map((g) =>
          g.id === selectedGroup.id
            ? { ...g, name: editForm.name, description: editForm.description, privacy: editForm.privacy, profilePicture: editForm.profilePicture }
            : g
        )
      );
      setEditModalOpen(false);
      setSelectedGroup(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Groups (My Groups)</h1>
          <p className="text-muted-foreground mt-1">Create and manage your community groups. Messages are end-to-end encrypted.</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display">Create New Group</DialogTitle>
              <DialogDescription>Create a new group for your community.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Group Profile Picture</Label>
                <ImageUpload
                  value={createForm.profilePicture}
                  onChange={(value) => setCreateForm({ ...createForm, profilePicture: value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter group name..." 
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy</Label>
                <Select 
                  value={createForm.privacy} 
                  onValueChange={(value) => setCreateForm({ ...createForm, privacy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select privacy level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your group..." 
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="outline">Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(group)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View Metadata
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <Users className="h-4 w-4 mr-2" />Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(group)} className="text-foreground">
                        <Edit className="h-4 w-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <Archive className="h-4 w-4 mr-2" />Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(group)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </DropdownMenuItem>
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedGroup?.name}</DialogTitle>
            <DialogDescription>Created on {selectedGroup?.createdAt}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                {selectedGroup?.privacy === "Private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {selectedGroup?.privacy}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{selectedGroup?.members} members</span>
              </div>
              <span className="text-sm text-muted-foreground">Last active: {selectedGroup?.lastActive}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground">{selectedGroup?.description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Group</DialogTitle>
            <DialogDescription>Make changes to your group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label>Group Profile Picture</Label>
              <ImageUpload
                value={editForm.profilePicture}
                onChange={(value) => setEditForm({ ...editForm, profilePicture: value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-privacy">Privacy</Label>
              <Select value={editForm.privacy} onValueChange={(value) => setEditForm({ ...editForm, privacy: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be undone and all group data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
