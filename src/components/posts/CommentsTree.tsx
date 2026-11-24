import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { graphqlErrorMessage } from "@/lib/graphqlErrors";
import { displayNameOrFallback, initialsOf, mergePage, relativeTime } from "@/lib/postView";

const PAGE_SIZE = 20;

interface CommentsTreeProps {
  postId: string;
  /** Reports the total (top-level + replies) once the first page is known. */
  onLoaded?: (topLevelLoaded: number) => void;
}

interface CommentNodeProps {
  comment: Comment;
  postId: string;
  depth: number;
  /** Called with this comment's id after it is successfully deleted. */
  onDeleted: (commentId: string) => void;
}

function CommentNode({ comment, postId, depth, onDeleted }: CommentNodeProps) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [replyCount, setReplyCount] = useState(comment.replyCount);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = displayNameOrFallback(comment.authorDisplayName, comment.authorHandle, t("postView.member"));
  const when = relativeTime(comment.createdAt, i18n.language);
  const absolute = new Date(comment.createdAt);

  const loadReplies = async (offset: number) => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    setError(null);
    try {
      const data = await communityPostService.postComments(postId, PAGE_SIZE, offset, comment.id);
      setReplies((prev) => (offset === 0 ? data : mergePage(prev, data)));
      setHasMoreReplies(data.length === PAGE_SIZE);
      setLoadedOnce(true);
    } catch (err) {
      setError(graphqlErrorMessage(err, t("postView.repliesLoadError")));
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !loadedOnce) void loadReplies(0);
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
        throw new Error(result.message || t("postView.deleteFailed"));
      }
      toast.success(t("postView.commentDeleted"));
      setConfirmOpen(false);
      onDeleted(comment.id);
    } catch (err) {
      toast.error(graphqlErrorMessage(err, t("postView.deleteFailed")));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="min-w-0">
      <div className="flex gap-2.5">
        <Avatar className={depth > 0 ? "h-7 w-7" : "h-9 w-9"}>
          <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-sm bg-muted/50 px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">{name}</p>
              <div className="flex items-center gap-1">
                <time
                  dateTime={comment.createdAt}
                  title={Number.isNaN(absolute.getTime()) ? undefined : absolute.toLocaleString(i18n.language)}
                  className="text-xs text-muted-foreground"
                >
                  {when}
                </time>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  aria-label={t("postView.deleteCommentBy", { name })}
                  title={t("postView.deleteComment")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">{comment.text}</p>
          </div>
          {replyCount > 0 && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              className="mt-1 inline-flex items-center gap-1 rounded px-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {expanded
                ? t("postView.hideReplies", { count: replyCount })
                : t("postView.viewReplies", { count: replyCount })}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-2 border-l border-border pl-3">
              {loadingReplies && !loadedOnce && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> {t("postView.loadingReplies")}
                </div>
              )}
              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}{" "}
                  <button type="button" className="underline" onClick={() => void loadReplies(replies.length)}>
                    {t("common.retry")}
                  </button>
                </p>
              )}
              {replies.length > 0 && (
                <ul className="space-y-3">
                  {replies.map((reply) => (
                    <CommentNode
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      depth={depth + 1}
                      onDeleted={handleReplyDeleted}
                    />
                  ))}
                </ul>
              )}
              {hasMoreReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={loadingReplies}
                  onClick={() => void loadReplies(replies.length)}
                >
                  {loadingReplies && <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />}
                  {t("postView.loadMoreReplies")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("postView.deleteCommentTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("postView.deleteCommentDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

export function CommentsTree({ postId, onLoaded }: CommentsTreeProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number, isCancelled: () => boolean = () => false) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const data = await communityPostService.postComments(postId, PAGE_SIZE, offset);
        if (isCancelled()) return;
        setComments((prev) => (offset === 0 ? data : mergePage(prev, data)));
        setHasMore(data.length === PAGE_SIZE);
        if (offset === 0) onLoaded?.(data.length);
      } catch (err) {
        if (!isCancelled()) setError(graphqlErrorMessage(err, t("postView.commentsLoadError")));
      } finally {
        if (!isCancelled()) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // onLoaded is intentionally not a dependency: it is a notification only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [postId, t],
  );

  useEffect(() => {
    let cancelled = false;
    setComments([]);
    void load(0, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label={t("postView.loadingComments")}>
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-16 flex-1 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-destructive" role="alert">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={() => void load(0)}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
        {t("postView.noComments")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-4">
        {comments.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            postId={postId}
            depth={0}
            onDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
          />
        ))}
      </ul>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {hasMore && (
        <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void load(comments.length)}>
          {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("common.loadMore")}
        </Button>
      )}
    </div>
  );
}
