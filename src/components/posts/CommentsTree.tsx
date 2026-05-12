import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { communityPostService } from "@/services/communityPostService";
import type { Comment } from "@/services/graphql/posts";

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
}

function CommentNode({ comment, postId }: CommentNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReplies = comment.replyCount > 0;

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

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-card px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {comment.authorDisplayName || comment.authorHandle || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">{formatRelative(comment.createdAt)}</p>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.text}</p>
        {hasReplies && (
          <button
            type="button"
            onClick={toggle}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? "Hide" : "View"} {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
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
            <CommentNode key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}
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
        <CommentNode key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
}
