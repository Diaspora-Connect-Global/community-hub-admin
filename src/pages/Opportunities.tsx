import { Plus, Search, MoreHorizontal, Eye, Edit, X, Download, Users } from "lucide-react";
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

const opportunities = [
  { id: "OPP001", title: "Marketing Internship", type: "Job", applications: 45, status: "Active", postedAt: "2024-01-15" },
  { id: "OPP002", title: "Volunteer Teacher", type: "Volunteer", applications: 23, status: "Active", postedAt: "2024-01-14" },
  { id: "OPP003", title: "Digital Skills Training", type: "Training", applications: 89, status: "Active", postedAt: "2024-01-12" },
  { id: "OPP004", title: "Small Business Grant", type: "Funding", applications: 156, status: "Closed", postedAt: "2024-01-10" },
  { id: "OPP005", title: "Community Event Coordinator", type: "Job", applications: 34, status: "Active", postedAt: "2024-01-08" },
];

const typeColors: Record<string, string> = {
  Job: "bg-blue-500/10 text-blue-400",
  Volunteer: "bg-green-500/10 text-green-400",
  Training: "bg-purple-500/10 text-purple-400",
  Funding: "bg-primary/10 text-primary",
  Other: "bg-secondary text-secondary-foreground",
};

export default function Opportunities() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Opportunities</h1>
          <p className="text-muted-foreground mt-1">Create and manage job postings, training, and funding opportunities.</p>
        </div>
        <Button variant="warm">
          <Plus className="h-4 w-4 mr-2" />
          Create Opportunity
        </Button>
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
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                      <DropdownMenuItem><Users className="h-4 w-4 mr-2" />View Applicants</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Export CSV</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><X className="h-4 w-4 mr-2" />Close</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
