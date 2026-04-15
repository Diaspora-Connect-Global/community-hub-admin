import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, MoreHorizontal, Eye, Trash2, MessageSquare, Heart, Image } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { communityPostService } from "@/services/communityPostService";
import type { AttachmentType, Post as ApiPost } from "@/services/graphql/posts";

interface UiPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  media: boolean;
  comments: number;
  likes: number;
  createdAt: string;
}

function mapPost(post: ApiPost): UiPost {
  const text = post.text?.trim() ?? "";
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "Untitled post";
  return {
    id: post.id,
    title: firstLine.slice(0, 80),
    excerpt: text.length > 72 ? `${text.slice(0, 72)}...` : text,
    content: text,
    media: (post.attachments?.length ?? 0) > 0,
    comments: post.engagementCounts?.comments ?? 0,
    likes: post.engagementCounts?.likes ?? 0,
    createdAt: new Date(post.createdAt).toLocaleDateString(),
  };
}

function resolveAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

export default function Posts() {
  const { t } = useTranslation();
  const location = useLocation();
  const { toast } = useToast();
  const admin = useAuthStore((state) => state.admin);

  const communityId = admin?.scopeType === "COMMUNITY" ? admin.scopeId ?? "" : "";
  const canManageCommunityPosts = admin?.scopeType === "COMMUNITY" && Boolean(communityId);

  const [posts, setPosts] = useState<UiPost[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [authorityChecked, setAuthorityChecked] = useState(false);
  const [hasPostingAuthority, setHasPostingAuthority] = useState(false);
  const [authorityReason, setAuthorityReason] = useState<string | undefined>();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UiPost | null>(null);

  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
    );
  }, [posts, searchTerm]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!canManageCommunityPosts || !communityId) {
      setAuthorityChecked(true);
      setHasPostingAuthority(false);
      setAuthorityReason("Posts can only be managed in a community-scoped admin session.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [authority, feed] = await Promise.all([
          communityPostService.getPostingAuthority(communityId),
          communityPostService.getCommunityFeed(communityId, 20, 0),
        ]);

        if (cancelled) return;

        setAuthorityChecked(true);
        setHasPostingAuthority(authority.hasAuthority);
        setAuthorityReason(authority.reason);
        setPosts(feed.posts.map(mapPost));
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load posts";
        toast({ title: "Could not load posts", description: message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [canManageCommunityPosts, communityId, toast]);

  const handleView = (post: UiPost) => {
    setSelectedPost(post);
    setViewModalOpen(true);
  };

  const handleDelete = (post: UiPost) => {
    setSelectedPost(post);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPost) return;

    setDeleting(true);
    try {
      const ok = await communityPostService.adminDeletePost(selectedPost.id);
      if (!ok) throw new Error("Delete failed");

      setPosts((prev) => prev.filter((post) => post.id !== selectedPost.id));
      setDeleteModalOpen(false);
      setSelectedPost(null);
      toast({ title: "Post removed", description: "The post was removed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!communityId) {
      toast({ title: "Missing community", description: "No community context found.", variant: "destructive" });
      return;
    }

    if (!content.trim()) {
      toast({ title: "Post content is required", description: "Enter post text before publishing.", variant: "destructive" });
      return;
    }

    if (!hasPostingAuthority) {
      toast({ title: "Permission denied", description: authorityReason ?? "You cannot post in this community.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const attachments = await Promise.all(
        selectedFiles.map(async (file) =>
          communityPostService.uploadAttachment({
            file,
            type: resolveAttachmentType(file),
          })
        )
      );

      const result = await communityPostService.createCommunityPost({
        communityId,
        text: content.trim(),
        visibility: "PUBLIC",
        attachments,
        mentionedUserIds: [],
      });

      const created = await communityPostService.post(result.id);
      setPosts((prev) => [mapPost(created), ...prev]);
      setContent("");
      setSelectedFiles([]);
      setCreateModalOpen(false);
      toast({ title: "Post published", description: "Your post is now live." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish post";
      toast({ title: "Publish failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("posts.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("posts.subtitle")}</p>
          {authorityChecked && !hasPostingAuthority && (
            <p className="text-sm text-destructive mt-2">{authorityReason ?? "You do not have permission to post in this community."}</p>
          )}
        </div>

        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!canManageCommunityPosts || !hasPostingAuthority}>
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
                <Label htmlFor="post-content">Content</Label>
                <Textarea
                  id="post-content"
                  placeholder="Write your post content..."
                  rows={6}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-files">Attachments</Label>
                <Input
                  id="post-files"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) => {
                    const files = event.target.files ? Array.from(event.target.files) : [];
                    setSelectedFiles(files);
                  }}
                />
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles.length.toString()} file(s) selected
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Title / Excerpt</TableHead>
              <TableHead className="w-20 text-center">Media</TableHead>
              <TableHead className="w-24 text-center">Comments</TableHead>
              <TableHead className="w-24 text-center">Likes</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading posts...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No posts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{post.id.slice(0, 8)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleDelete(post)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap">{selectedPost?.content}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
