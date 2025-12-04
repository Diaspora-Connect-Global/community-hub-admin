import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, X, Download, Users } from "lucide-react";
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

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  type: string;
  applications: number;
  status: string;
  postedAt: string;
}

const opportunitiesData: Opportunity[] = [
  { id: "OPP001", title: "Marketing Internship", description: "Join our marketing team for a 3-month internship program. Great opportunity for fresh graduates looking to gain experience in digital marketing and brand management.", type: "Job", applications: 45, status: "Active", postedAt: "2024-01-15" },
  { id: "OPP002", title: "Volunteer Teacher", description: "Help teach basic computer skills to community members. Flexible hours, weekends preferred. No prior teaching experience required.", type: "Volunteer", applications: 23, status: "Active", postedAt: "2024-01-14" },
  { id: "OPP003", title: "Digital Skills Training", description: "Free training program covering web development, data analysis, and digital marketing. 8-week intensive course with certification.", type: "Training", applications: 89, status: "Active", postedAt: "2024-01-12" },
  { id: "OPP004", title: "Small Business Grant", description: "Up to $10,000 funding available for small businesses owned by community members. Applications reviewed quarterly.", type: "Funding", applications: 156, status: "Closed", postedAt: "2024-01-10" },
  { id: "OPP005", title: "Community Event Coordinator", description: "Part-time position to help organize and manage community events. Strong organizational and communication skills required.", type: "Job", applications: 34, status: "Active", postedAt: "2024-01-08" },
];

const typeColors: Record<string, string> = {
  Job: "bg-blue-500/10 text-blue-400",
  Volunteer: "bg-green-500/10 text-green-400",
  Training: "bg-purple-500/10 text-purple-400",
  Funding: "bg-primary/10 text-primary",
  Other: "bg-secondary text-secondary-foreground",
};

export default function Opportunities() {
  const location = useLocation();
  const [opportunities, setOpportunities] = useState<Opportunity[]>(opportunitiesData);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", type: "", status: "" });

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleView = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setViewModalOpen(true);
  };

  const handleEdit = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setEditForm({
      title: opp.title,
      description: opp.description || "",
      type: opp.type,
      status: opp.status,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedOpp) {
      setOpportunities(opportunities.filter((o) => o.id !== selectedOpp.id));
      setDeleteModalOpen(false);
      setSelectedOpp(null);
    }
  };

  const saveEdit = () => {
    if (selectedOpp) {
      setOpportunities(
        opportunities.map((o) =>
          o.id === selectedOpp.id
            ? { ...o, title: editForm.title, description: editForm.description, type: editForm.type, status: editForm.status }
            : o
        )
      );
      setEditModalOpen(false);
      setSelectedOpp(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Opportunities</h1>
          <p className="text-muted-foreground mt-1">Create and manage job postings, training, and funding opportunities.</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display">Create New Opportunity</DialogTitle>
              <DialogDescription>Post a new job, training, or funding opportunity.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter opportunity title..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Job">Job</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Funding">Funding</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the opportunity..." rows={6} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="outline">Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-32 text-center">Applications</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28">Posted</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{opp.id}</TableCell>
                <TableCell className="font-medium text-foreground">{opp.title}</TableCell>
                <TableCell>
                  <Badge className={typeColors[opp.type]}>{opp.type}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{opp.applications}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={opp.status === "Active" ? "default" : "secondary"} className={opp.status === "Active" ? "bg-success/10 text-success" : ""}>
                    {opp.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{opp.postedAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(opp)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <Users className="h-4 w-4 mr-2" />View Applicants
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(opp)} className="text-foreground">
                        <Edit className="h-4 w-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">
                        <Download className="h-4 w-4 mr-2" />Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(opp)} className="text-destructive">
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedOpp?.title}</DialogTitle>
            <DialogDescription>Posted on {selectedOpp?.postedAt}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Badge className={typeColors[selectedOpp?.type || "Other"]}>{selectedOpp?.type}</Badge>
              <Badge variant={selectedOpp?.status === "Active" ? "default" : "secondary"} className={selectedOpp?.status === "Active" ? "bg-success/10 text-success" : ""}>
                {selectedOpp?.status}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{selectedOpp?.applications} applications</span>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground">{selectedOpp?.description}</p>
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
            <DialogTitle className="font-display">Edit Opportunity</DialogTitle>
            <DialogDescription>Make changes to this opportunity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select value={editForm.type} onValueChange={(value) => setEditForm({ ...editForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Job">Job</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Funding">Funding</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={6}
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
            <DialogTitle className="font-display text-destructive">Delete Opportunity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedOpp?.title}"? This action cannot be undone.
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
