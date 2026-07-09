import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { communityPostService } from "@/services/communityPostService";
import { deleteComment } from "@/services/graphql/posts";
import type { Comment } from "@/services/graphql/posts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommentsTreeProps {
  postId: string;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

interface CommentNodeProps {
  comment: Comment;
  postId: string;
  /** Called with this comment's id after it is successfully deleted. */
  onDeleted: (commentId: string) => void;
}

function CommentNode({ comment, postId, onDeleted }: CommentNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [replyCount, setReplyCount] = useState(comment.replyCount);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasReplies = replyCount > 0;

  const loadReplies = async () => {
    if (loadedOnce || loadingReplies) return;
    setLoadingReplies(true);
    setError(null);
    try {
      const data = await communityPostService.postComments(postId, 50, 0, comment.id);
      setReplies(data);
      setLoadedOnce(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load replies");
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void loadReplies();
  };

  const handleReplyDeleted = (replyId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    setReplyCount((prev) => Math.max(0, prev - 1));
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteComment(comment.id);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete comment");
      }
      toast.success("Comment deleted");
      setConfirmOpen(false);
      onDeleted(comment.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-card px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {comment.authorDisplayName || comment.authorHandle || "Unknown"}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{formatRelative(comment.createdAt)}</p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              title="Delete comment"
              aria-label="Delete comment"
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.text}</p>
        {hasReplies && (
          <button
            type="button"
            onClick={toggle}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? "Hide" : "View"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="ml-5 space-y-2 border-l-2 border-border pl-3">
          {loadingReplies && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading replies…
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {!loadingReplies && replies.length === 0 && loadedOnce && (
            <p className="text-xs text-muted-foreground">No replies.</p>
          )}
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              postId={postId}
              onDeleted={handleReplyDeleted}
            />
          ))}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it and its replies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CommentsTree({ postId }: CommentsTreeProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await communityPostService.postComments(postId, 50, 0);
        if (!cancelled) setComments(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load comments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (comments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" /> No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          postId={postId}
          onDeleted={handleCommentDeleted}
        />
      ))}
    </div>
  );
}
