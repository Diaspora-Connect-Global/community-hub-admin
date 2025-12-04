import { useState } from "react";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Pin, MessageSquare, Heart, Image } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

const posts = [
  { id: "P001", title: "Community Meetup Next Week", excerpt: "Join us for our monthly community gathering...", media: true, comments: 24, likes: 156, pinned: true, createdAt: "2024-01-15" },
  { id: "P002", title: "New Job Opportunities Available", excerpt: "We have partnered with several companies...", media: false, comments: 18, likes: 89, pinned: false, createdAt: "2024-01-14" },
  { id: "P003", title: "Cultural Festival Announcement", excerpt: "Save the date for our annual cultural...", media: true, comments: 42, likes: 234, pinned: true, createdAt: "2024-01-13" },
  { id: "P004", title: "Welcome New Members!", excerpt: "A warm welcome to all our new members...", media: false, comments: 12, likes: 67, pinned: false, createdAt: "2024-01-12" },
  { id: "P005", title: "Community Guidelines Update", excerpt: "We've updated our community guidelines...", media: false, comments: 8, likes: 45, pinned: false, createdAt: "2024-01-11" },
];

export default function Posts() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Posts & Announcements</h1>
          <p className="text-muted-foreground mt-1">Create and manage your community posts.</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="warm">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display">Create New Post</DialogTitle>
              <DialogDescription>Share an announcement with your community.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter post title..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Content</Label>
                <Textarea id="body" placeholder="Write your post content..." rows={6} />
              </div>
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop images or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4 (max 5 files)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pinned" />
                <Label htmlFor="pinned" className="text-sm font-normal">Pin this post</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="secondary">Save Draft</Button>
              <Button variant="warm">Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Title / Excerpt</TableHead>
              <TableHead className="w-20 text-center">Media</TableHead>
              <TableHead className="w-24 text-center">Comments</TableHead>
              <TableHead className="w-24 text-center">Likes</TableHead>
              <TableHead className="w-20 text-center">Pinned</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{post.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{post.title}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">{post.excerpt}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {post.media && <Image className="h-4 w-4 mx-auto text-primary" />}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{post.likes}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {post.pinned && <Badge variant="secondary" className="bg-primary/10 text-primary"><Pin className="h-3 w-3" /></Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{post.createdAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Pin className="h-4 w-4 mr-2" />{post.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
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
    </div>
  );
}
