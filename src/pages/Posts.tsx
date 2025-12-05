import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { MultiImageUpload } from "@/components/ui/multi-image-upload";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  media: boolean;
  comments: number;
  likes: number;
  pinned: boolean;
  createdAt: string;
}

const postsData: Post[] = [
  { id: "P001", title: "Community Meetup Next Week", excerpt: "Join us for our monthly community gathering...", content: "Join us for our monthly community gathering at the main hall. We'll be discussing upcoming events, sharing success stories, and networking with fellow community members. Refreshments will be provided. Don't miss this opportunity to connect!", media: true, comments: 24, likes: 156, pinned: true, createdAt: "2024-01-15" },
  { id: "P002", title: "New Job Opportunities Available", excerpt: "We have partnered with several companies...", content: "We have partnered with several companies to bring exclusive job opportunities to our community members. Positions available include software developers, marketing specialists, and project managers. Apply through the opportunities section.", media: false, comments: 18, likes: 89, pinned: false, createdAt: "2024-01-14" },
  { id: "P003", title: "Cultural Festival Announcement", excerpt: "Save the date for our annual cultural...", content: "Save the date for our annual cultural festival happening on March 15th! This year we're featuring performances from 20+ cultural groups, food from around the world, and activities for all ages. Early bird tickets available now.", media: true, comments: 42, likes: 234, pinned: true, createdAt: "2024-01-13" },
  { id: "P004", title: "Welcome New Members!", excerpt: "A warm welcome to all our new members...", content: "A warm welcome to all our new members who joined us this month! We're excited to have you as part of our growing community. Please take a moment to introduce yourself in the comments and let us know what brought you here.", media: false, comments: 12, likes: 67, pinned: false, createdAt: "2024-01-12" },
  { id: "P005", title: "Community Guidelines Update", excerpt: "We've updated our community guidelines...", content: "We've updated our community guidelines to ensure a safe and inclusive environment for everyone. Key changes include updated moderation policies, new reporting features, and clearer expectations for member conduct. Please review the full guidelines.", media: false, comments: 8, likes: 45, pinned: false, createdAt: "2024-01-11" },
];

export default function Posts() {
  const { t } = useTranslation();
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>(postsData);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", pinned: false, media: [] as string[] });
  const [createForm, setCreateForm] = useState({ title: "", content: "", pinned: false, media: [] as string[] });

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleView = (post: Post) => {
    setSelectedPost(post);
    setViewModalOpen(true);
  };

  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setEditForm({
      title: post.title,
      content: post.content || post.excerpt,
      pinned: post.pinned,
      media: [],
    });
    setEditModalOpen(true);
  };

  const handleDelete = (post: Post) => {
    setSelectedPost(post);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPost) {
      setPosts(posts.filter((p) => p.id !== selectedPost.id));
      setDeleteModalOpen(false);
      setSelectedPost(null);
    }
  };

  const saveEdit = () => {
    if (selectedPost) {
      setPosts(
        posts.map((p) =>
          p.id === selectedPost.id
            ? { ...p, title: editForm.title, content: editForm.content, excerpt: editForm.content.substring(0, 50) + "...", pinned: editForm.pinned }
            : p
        )
      );
      setEditModalOpen(false);
      setSelectedPost(null);
    }
  };

  const togglePin = (post: Post) => {
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, pinned: !p.pinned } : p)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("posts.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("posts.subtitle")}</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {t("posts.createPost")}
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
                <Input 
                  id="title" 
                  placeholder="Enter post title..." 
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Content</Label>
                <Textarea 
                  id="body" 
                  placeholder="Write your post content..." 
                  rows={6}
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Media</Label>
                <MultiImageUpload
                  value={createForm.media}
                  onChange={(media) => setCreateForm({ ...createForm, media })}
                  maxFiles={5}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="pinned"
                  checked={createForm.pinned}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, pinned: checked as boolean })}
                />
                <Label htmlFor="pinned" className="text-sm font-normal">Pin this post</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="outline">Save Draft</Button>
              <Button variant="outline">Publish</Button>
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
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(post)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(post)} className="text-foreground">
                        <Edit className="h-4 w-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePin(post)} className="text-foreground">
                        <Pin className="h-4 w-4 mr-2" />{post.pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(post)} className="text-destructive">
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
            <DialogTitle className="font-display">{selectedPost?.title}</DialogTitle>
            <DialogDescription>Posted on {selectedPost?.createdAt}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{selectedPost?.comments} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{selectedPost?.likes} likes</span>
              </div>
              {selectedPost?.pinned && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Pin className="h-3 w-3 mr-1" />Pinned
                </Badge>
              )}
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground">{selectedPost?.content || selectedPost?.excerpt}</p>
            </div>
            {selectedPost?.media && (
              <div className="border border-border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">Media attachments available</span>
                </div>
              </div>
            )}
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
            <DialogTitle className="font-display">Edit Post</DialogTitle>
            <DialogDescription>Make changes to your post.</DialogDescription>
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
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Media</Label>
              <MultiImageUpload
                value={editForm.media}
                onChange={(media) => setEditForm({ ...editForm, media })}
                maxFiles={5}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-pinned"
                checked={editForm.pinned}
                onCheckedChange={(checked) => setEditForm({ ...editForm, pinned: checked as boolean })}
              />
              <Label htmlFor="edit-pinned" className="text-sm font-normal">Pin this post</Label>
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
            <DialogTitle className="font-display text-destructive">Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
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
