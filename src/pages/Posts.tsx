import { canSubmitPost, hasMeaningfulPostText, isPostEmptyError, POST_EMPTY_HINT, POST_EMPTY_MESSAGE } from "@/lib/postContent";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Plus,
  MoreHorizontal,
  Eye,
  Trash2,
  MessageSquare,
  Heart,
  Image,
  FileText,
  FileVideo,
  X,
  Pencil,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { communityPostService } from "@/services/communityPostService";
import type {
  AttachmentType,
  MentionInput,
  Post as ApiPost,
  PostAttachment,
  PostVisibility,
} from "@/services/graphql/posts";
import { MentionTextarea } from "@/components/posts/MentionTextarea";
import { clearDraft, draftKey, loadDraft, saveDraft } from "@/lib/composerDraft";
import { CommentsTree } from "@/components/posts/CommentsTree";
import { graphqlErrorMessage } from "@/lib/graphqlErrors";

type PostVisibilityOption = "COMMUNITY" | "PUBLIC";
type ComposerMode = "create" | "edit";

interface UiPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  media: boolean;
  comments: number;
  likes: number;
  createdAt: string;
  visibility: PostVisibility;
  attachments: PostAttachment[];
}

function normalizeVisibility(visibility: PostVisibility | undefined): PostVisibilityOption {
  const upper = (visibility ?? "").toString().toUpperCase();
  return upper === "COMMUNITY" ? "COMMUNITY" : "PUBLIC";
}

function mapPost(post: ApiPost): UiPost {
  const text = post.text?.trim() ?? "";
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "Untitled post";
  const attachments = post.attachments ?? [];
  return {
    id: post.id,
    title: firstLine.slice(0, 80),
    excerpt: text.length > 72 ? `${text.slice(0, 72)}...` : text,
    content: text,
    media: attachments.length > 0,
    comments: post.engagementCounts?.comments ?? 0,
    likes: post.engagementCounts?.likes ?? 0,
    createdAt: new Date(post.createdAt).toLocaleDateString(),
    visibility: post.visibility,
    attachments,
  };
}

function resolveAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function attachmentFileName(att: PostAttachment): string {
  if (att.objectKey) {
    const parts = att.objectKey.split("/");
    return parts[parts.length - 1] || att.objectKey;
  }
  if (att.url) {
    try {
      const u = new URL(att.url);
      const parts = u.pathname.split("/");
      return parts[parts.length - 1] || att.url;
    } catch {
      return att.url;
    }
  }
  return att.id;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [visibility, setVisibility] = useState<PostVisibilityOption>("COMMUNITY");
  const [mentions, setMentions] = useState<MentionInput[]>([]);
  const [composerMode, setComposerMode] = useState<ComposerMode>("create");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Browser-only drafts (create mode), keyed per signed-in admin + community.
  const draftStorageKey = useMemo(
    () => draftKey(admin?.userId ?? admin?.id, communityId),
    [admin?.userId, admin?.id, communityId],
  );
  const [draftRestored, setDraftRestored] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const latestDraftRef = useRef({ content, visibility, mentions });
  latestDraftRef.current = { content, visibility, mentions };

  const persistDraftNow = () => {
    const d = latestDraftRef.current;
    if (hasMeaningfulPostText(d.content)) {
      saveDraft(draftStorageKey, { text: d.content, visibility: d.visibility, mentions: d.mentions });
    } else {
      clearDraft(draftStorageKey);
    }
  };

  // Debounced autosave while the create composer is open.
  useEffect(() => {
    if (!createModalOpen || composerMode !== "create") return;
    const handle = setTimeout(persistDraftNow, 700);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, visibility, mentions, createModalOpen, composerMode, draftStorageKey]);

  const previewUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        urls[fileKey(file)] = URL.createObjectURL(file);
      }
    });
    return urls;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setSelectedFiles((prev) => {
      const existing = new Set(prev.map(fileKey));
      const merged = [...prev];
      incoming.forEach((file) => {
        const key = fileKey(file);
        if (!existing.has(key)) {
          existing.add(key);
          merged.push(file);
        }
      });
      return merged;
    });
  };

  const removeFile = (key: string) => {
    setSelectedFiles((prev) => prev.filter((file) => fileKey(file) !== key));
  };

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
        const feed = await communityPostService.getCommunityFeed(communityId, 20, 0);

        if (cancelled) return;

        setAuthorityChecked(true);
        // Community admins post via createPost(COMMUNITY, scopeId); no separate authority query in API guide
        setHasPostingAuthority(true);
        setAuthorityReason(undefined);
        const mapped = feed.posts.map(mapPost);
        setPosts(mapped);

        // The backend feed's engagementCounts.comments is unreliable (often 0 even when
        // comments exist), so derive the count per post from the actual comments list.
        const counts = await Promise.all(
          mapped.map((p) =>
            communityPostService
              .postComments(p.id, 100, 0)
              .then((cs) => cs.reduce((sum, c) => sum + 1 + (c.replyCount ?? 0), 0))
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        setPosts((prev) =>
          prev.map((p) => {
            const i = mapped.findIndex((m) => m.id === p.id);
            const derived = i >= 0 ? counts[i] : null;
            return derived != null && derived > p.comments ? { ...p, comments: derived } : p;
          }),
        );
      } catch (error) {
        if (cancelled) return;
        const message = graphqlErrorMessage(error, "Failed to load posts");
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

  const handleView = async (post: UiPost) => {
    setSelectedPost(post);
    setViewModalOpen(true);
    try {
      const [fresh, topLevel] = await Promise.all([
        communityPostService.post(post.id),
        communityPostService.postComments(post.id, 100, 0).catch(() => []),
      ]);
      const mapped = mapPost(fresh);
      const derived = topLevel.reduce((sum, c) => sum + 1 + (c.replyCount ?? 0), 0);
      mapped.comments = Math.max(mapped.comments, derived);
      setSelectedPost(mapped);
      setPosts((prev) => prev.map((p) => (p.id === mapped.id ? mapped : p)));
    } catch {
      // keep stale snapshot if refresh fails
    }
  };

  const handleDelete = (post: UiPost) => {
    setSelectedPost(post);
    setDeleteModalOpen(true);
  };

  const resetComposer = () => {
    setContent("");
    setSelectedFiles([]);
    setVisibility("COMMUNITY");
    setMentions([]);
    setComposerMode("create");
    setEditingPostId(null);
    setDraftRestored(false);
  };

  const openCreate = () => {
    resetComposer();
    const draft = loadDraft(draftStorageKey);
    if (draft && hasMeaningfulPostText(draft.text)) {
      setContent(draft.text);
      setVisibility(draft.visibility === "PUBLIC" ? "PUBLIC" : "COMMUNITY");
      setMentions(draft.mentions);
      setEditorKey((k) => k + 1);
      setDraftRestored(true);
    }
    setCreateModalOpen(true);
  };

  const discardDraft = () => {
    clearDraft(draftStorageKey);
    setContent("");
    setVisibility("COMMUNITY");
    setMentions([]);
    setEditorKey((k) => k + 1);
    setDraftRestored(false);
    toast({ title: t("composer.draftDiscarded") });
  };

  const saveDraftAndClose = () => {
    persistDraftNow();
    setCreateModalOpen(false);
    resetComposer();
    toast({ title: t("composer.draftSaved"), description: t("composer.draftSavedDesc") });
  };

  const closeComposer = () => {
    if (composerMode === "create") persistDraftNow();
    setCreateModalOpen(false);
  };

  const openEdit = (post: UiPost) => {
    setComposerMode("edit");
    setEditingPostId(post.id);
    setContent(post.content);
    setVisibility(normalizeVisibility(post.visibility));
    setMentions([]);
    setSelectedFiles([]);
    setCreateModalOpen(true);
  };

  const handleComposerOpenChange = (open: boolean) => {
    if (!open && composerMode === "create") persistDraftNow();
    setCreateModalOpen(open);
    if (!open) resetComposer();
  };

  const confirmDelete = async () => {
    if (!selectedPost) return;

    setDeleting(true);
    try {
      const ok = await communityPostService.deletePost(selectedPost.id);
      if (!ok) throw new Error("Delete failed");

      setPosts((prev) => prev.filter((post) => post.id !== selectedPost.id));
      setDeleteModalOpen(false);
      setSelectedPost(null);
      toast({ title: "Post removed", description: "The post was removed successfully." });
    } catch (error) {
      const message = graphqlErrorMessage(error, "Failed to delete post");
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Never an empty post: text, or (new posts only) an attachment. The server enforces the same rule.
  const canSubmit = composerMode === "edit"
    ? hasMeaningfulPostText(content)
    : canSubmitPost(content, selectedFiles.length);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({ title: "Post is empty", description: POST_EMPTY_MESSAGE, variant: "destructive" });
      return;
    }

    if (composerMode === "edit") {
      if (!editingPostId) return;
      setSubmitting(true);
      try {
        await communityPostService.editPost({
          id: editingPostId,
          text: content.trim(),
          visibility,
        });
        const updated = await communityPostService.post(editingPostId);
        setPosts((prev) => prev.map((p) => (p.id === editingPostId ? mapPost(updated) : p)));
        setCreateModalOpen(false);
        resetComposer();
        toast({ title: "Post updated", description: "Your changes are saved." });
      } catch (error) {
        const message = graphqlErrorMessage(error, "Failed to update post");
        toast({ title: "Update failed", description: message, variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!communityId) {
      toast({ title: "Missing community", description: "No community context found.", variant: "destructive" });
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

      const mentionedUserIds = mentions
        .filter((m) => m.entityType === "USER")
        .map((m) => m.entityId);

      const result = await communityPostService.createCommunityPost({
        communityId,
        text: content.trim(),
        visibility,
        attachments,
        mentionedUserIds,
        mentions,
      });

      const created = await communityPostService.post(result.id);
      setPosts((prev) => [mapPost(created), ...prev]);
      clearDraft(draftStorageKey);
      setCreateModalOpen(false);
      resetComposer();
      toast({ title: "Post published", description: "Your post is now live." });
    } catch (error) {
      const message = isPostEmptyError(error) ? POST_EMPTY_MESSAGE : graphqlErrorMessage(error, "Failed to publish post");
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

        <Button
          variant="outline"
          disabled={!canManageCommunityPosts || !hasPostingAuthority}
          onClick={openCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("posts.createPost")}
        </Button>

        <Dialog open={createModalOpen} onOpenChange={handleComposerOpenChange}>
          <DialogContent
            className="sm:max-w-[600px]"
            onEscapeKeyDown={(e) => {
              // Escape closes an open suggestion list first, not the whole composer.
              if (document.activeElement?.getAttribute("aria-expanded") === "true") e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {composerMode === "edit" ? "Edit Post" : "Create New Post"}
              </DialogTitle>
              <DialogDescription>
                {composerMode === "edit"
                  ? "Update the post text or change who can see it."
                  : "Share an announcement with your community."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {draftRestored && composerMode === "create" && (
                <div role="status" className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{t("composer.draftRestored")}</p>
                    <p className="text-xs text-muted-foreground">{t("composer.draftRestoredDesc")}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={discardDraft}>
                    {t("composer.discardDraft")}
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="post-content">Content</Label>
                <MentionTextarea
                  key={editorKey}
                  id="post-content"
                  initialMentions={mentions}
                  placeholder={t("composer.placeholder")}
                  rows={6}
                  value={content}
                  onChange={setContent}
                  onMentionsChange={setMentions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(value) => setVisibility(value as PostVisibilityOption)}
                >
                  <SelectTrigger id="post-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMUNITY">Community only</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {visibility === "COMMUNITY"
                    ? "Only members of this community can see this post."
                    : "Anyone can see this post."}
                </p>
              </div>

              {composerMode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="post-files">Attachments</Label>
                <Input
                  ref={fileInputRef}
                  id="post-files"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) => {
                    const files = event.target.files ? Array.from(event.target.files) : [];
                    addFiles(files);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                />
                {selectedFiles.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFiles.map((file) => {
                        const key = fileKey(file);
                        const previewUrl = previewUrls[key];
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        return (
                          <div
                            key={key}
                            className="relative group rounded-md border border-border bg-muted/30 overflow-hidden aspect-square"
                          >
                            {isImage && previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : isVideo && previewUrl ? (
                              <video
                                src={previewUrl}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
                                {isVideo ? (
                                  <FileVideo className="h-6 w-6" />
                                ) : (
                                  <FileText className="h-6 w-6" />
                                )}
                                <p className="line-clamp-2 text-center text-[10px] leading-tight">
                                  {file.name}
                                </p>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(key)}
                              className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                              <p className="truncate text-[10px] text-white">{file.name}</p>
                              <p className="text-[10px] text-white/80">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              )}
            </div>

            {!canSubmit && (
              <p id="post-empty-hint" className="text-xs text-muted-foreground">{POST_EMPTY_HINT}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeComposer} disabled={submitting}>
                Cancel
              </Button>
              {composerMode === "create" && (
                <Button
                  variant="outline"
                  onClick={saveDraftAndClose}
                  disabled={submitting || !hasMeaningfulPostText(content)}
                  title={selectedFiles.length > 0 ? t("composer.attachmentsNotSaved") : undefined}
                >
                  {t("composer.saveDraft")}
                </Button>
              )}
              <Button variant="outline" onClick={handleSubmit} disabled={submitting || !canSubmit} aria-describedby={!canSubmit ? "post-empty-hint" : undefined}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {composerMode === "edit" ? "Save changes" : "Publish"}
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading posts...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No posts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className="group">
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
                        <DropdownMenuItem onClick={() => openEdit(post)} className="text-foreground">
                          <Pencil className="h-4 w-4 mr-2" />Edit
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
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedPost?.title}</DialogTitle>
            <DialogDescription>Posted on {selectedPost?.createdAt}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
            {selectedPost && selectedPost.attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  Attachments ({selectedPost.attachments.length})
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selectedPost.attachments.map((att) => {
                    const name = attachmentFileName(att);
                    if (att.type === "IMAGE" && att.url) {
                      return (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-md border border-border bg-muted/30"
                        >
                          <img
                            src={att.url}
                            alt={name}
                            className="aspect-square w-full object-cover"
                          />
                        </a>
                      );
                    }
                    if (att.type === "VIDEO" && att.url) {
                      return (
                        <video
                          key={att.id}
                          src={att.url}
                          controls
                          className="aspect-square w-full rounded-md border border-border bg-black object-cover"
                        />
                      );
                    }
                    if (att.type === "AUDIO" && att.url) {
                      return (
                        <audio
                          key={att.id}
                          src={att.url}
                          controls
                          className="col-span-2 w-full sm:col-span-3"
                        />
                      );
                    }
                    return (
                      <a
                        key={att.id}
                        href={att.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground hover:bg-muted/50"
                      >
                        <FileText className="h-6 w-6" />
                        <span className="line-clamp-3 break-all">{name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedPost && (
              <div className="space-y-2 pt-2 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground">Comments</h3>
                <CommentsTree postId={selectedPost.id} />
              </div>
            )}
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
