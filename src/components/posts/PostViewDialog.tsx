import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, Globe2, Lock, MessageSquare, Share2, Bookmark, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsTree } from "@/components/posts/CommentsTree";
import { communityPostService } from "@/services/communityPostService";
import { getCommunity } from "@/services/graphql/community/queries";
import type { PostAttachment, PostReactionsPage } from "@/services/graphql/posts";
import { graphqlErrorMessage } from "@/lib/graphqlErrors";
import {
  REACTION_EMOJI,
  displayNameOrFallback,
  initialsOf,
  normaliseReactionKind,
  segmentPostText,
  toReactionSummary,
  type ReactionKind,
} from "@/lib/postView";

export interface PostViewData {
  id: string;
  content: string;
  createdAtIso: string;
  visibility: string;
  status: string;
  attachments: PostAttachment[];
  comments: number;
  shares: number;
  saves: number;
}

interface PostViewDialogProps {
  post: PostViewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
}

function attachmentName(att: PostAttachment): string {
  if (att.objectKey) return att.objectKey.split("/").pop() || att.objectKey;
  if (att.url) {
    try {
      return new URL(att.url).pathname.split("/").pop() || att.url;
    } catch {
      return att.url;
    }
  }
  return "file";
}

/** Only http(s) URLs are ever put in an href/src. */
function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function PostText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
      {segmentPostText(text).map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <span key={i} className="font-medium text-primary">
            {seg.value}
          </span>
        ),
      )}
    </p>
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const { t } = useTranslation();
  const v = visibility.toUpperCase();
  if (v === "COMMUNITY") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" aria-hidden="true" /> {t("postView.visibility.community")}
      </Badge>
    );
  }
  if (v === "PUBLIC" || v === "EVERYONE") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Globe2 className="h-3 w-3" aria-hidden="true" /> {t("postView.visibility.public")}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Lock className="h-3 w-3" aria-hidden="true" /> {t("postView.visibility.restricted")}
    </Badge>
  );
}

function MediaGrid({ attachments }: { attachments: PostAttachment[] }) {
  const { t } = useTranslation();
  const images = attachments.filter((a) => a.type === "IMAGE" && safeUrl(a.url));
  let imageIndex = 0;
  return (
    <section aria-labelledby="post-view-media" className="space-y-2">
      <h3 id="post-view-media" className="text-sm font-semibold text-foreground">
        {t("postView.media", { count: attachments.length })}
      </h3>
      <div className={`grid gap-2 ${images.length === 1 && attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {attachments.map((att) => {
          const url = safeUrl(att.url);
          const name = attachmentName(att);
          if (att.type === "IMAGE" && url) {
            imageIndex += 1;
            return (
              <a
                key={att.id}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="block overflow-hidden rounded-lg border border-border bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={url}
                  alt={t("postView.imageAlt", { index: imageIndex, count: images.length })}
                  loading="lazy"
                  className="max-h-80 w-full object-cover"
                />
              </a>
            );
          }
          if (att.type === "VIDEO" && url) {
            return (
              <video
                key={att.id}
                src={url}
                controls
                preload="metadata"
                aria-label={t("postView.videoLabel", { name })}
                className="col-span-full max-h-80 w-full rounded-lg border border-border bg-black"
              />
            );
          }
          if (att.type === "AUDIO" && url) {
            return (
              <audio key={att.id} src={url} controls aria-label={name} className="col-span-full w-full" />
            );
          }
          return (
            <a
              key={att.id}
              href={url ?? undefined}
              target="_blank"
              rel="noreferrer noopener"
              className="col-span-full flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 break-all">{name}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

const REACTION_ORDER: ReactionKind[] = ["HAPPY", "HOPEFUL", "SAD"];

function ReactionsSection({ postId }: { postId: string }) {
  const { t } = useTranslation();
  const [page, setPage] = useState<PostReactionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (cursor?: string | null, isCancelled: () => boolean = () => false) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const next = await communityPostService.postReactions(postId, 30, cursor);
      if (isCancelled()) return;
      setPage((prev) => (cursor && prev ? { ...next, reactors: [...prev.reactors, ...next.reactors] } : next));
    } catch (err) {
      if (!isCancelled()) setError(graphqlErrorMessage(err, t("postView.reactionsLoadError")));
    } finally {
      if (!isCancelled()) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    void load(null, () => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const summary = toReactionSummary(page);
  const labels: Record<ReactionKind, string> = {
    HAPPY: t("postView.reactions.happy"),
    HOPEFUL: t("postView.reactions.hopeful"),
    SAD: t("postView.reactions.sad"),
  };
  const counts: Record<ReactionKind, number> = { HAPPY: summary.happy, HOPEFUL: summary.hopeful, SAD: summary.sad };

  return (
    <section aria-labelledby="post-view-reactions" className="space-y-3">
      <h3 id="post-view-reactions" className="text-sm font-semibold text-foreground">
        {t("postView.reactions.title")}
        {page && <span className="ml-1.5 font-normal text-muted-foreground">({summary.total})</span>}
      </h3>
      {loading ? (
        <div className="flex gap-2" role="status" aria-label={t("postView.loading")}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 flex-1 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-destructive" role="alert">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load(null)}>
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-2">
            {REACTION_ORDER.map((kind) => (
              <li key={kind} className="rounded-lg border border-border bg-card px-2 py-2 text-center">
                <span aria-hidden="true" className="text-xl leading-none">
                  {REACTION_EMOJI[kind]}
                </span>
                <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{counts[kind]}</p>
                <p className="text-xs text-muted-foreground">{labels[kind]}</p>
              </li>
            ))}
          </ul>
          {summary.total === 0 ? (
            <p className="text-sm text-muted-foreground">{t("postView.reactions.none")}</p>
          ) : (
            page &&
            page.reactors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("postView.reactions.whoReacted")}
                </h4>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {page.reactors.map((r, i) => {
                    const name = displayNameOrFallback(r.fullName, null, t("postView.member"));
                    const kind = normaliseReactionKind(r.reactionType);
                    return (
                      <li key={`${i}-${r.reactedAt}`} className="flex min-w-0 items-center gap-2 text-sm">
                        <Avatar className="h-7 w-7">
                          {r.avatarUrl && safeUrl(r.avatarUrl) && <AvatarImage src={r.avatarUrl} alt="" />}
                          <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                            {initialsOf(name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-foreground">{name}</span>
                        <span title={labels[kind]} role="img" aria-label={labels[kind]}>
                          {REACTION_EMOJI[kind]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {page.hasMore && page.nextCursor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingMore}
                    onClick={() => void load(page.nextCursor)}
                  >
                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    {t("common.loadMore")}
                  </Button>
                )}
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}

export function PostViewDialog({ post, open, onOpenChange, communityId }: PostViewDialogProps) {
  const { t, i18n } = useTranslation();
  const [commentTotal, setCommentTotal] = useState<number | null>(null);

  useEffect(() => {
    setCommentTotal(null);
  }, [post?.id]);

  const { data: community } = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => getCommunity(communityId),
    enabled: open && Boolean(communityId),
    staleTime: 5 * 60_000,
  });

  const authorName = community?.name?.trim() || t("postView.authorFallback");
  const posted = post ? new Date(post.createdAtIso) : null;
  const postedLabel =
    posted && !Number.isNaN(posted.getTime())
      ? posted.toLocaleString(i18n.language, { dateStyle: "long", timeStyle: "short" })
      : "";
  const status = post?.status.toLowerCase() ?? "";
  const showStatus = status !== "" && status !== "active" && status !== "published";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-3 border-b border-border px-4 pb-3 pt-4 text-left sm:px-6">
          <div className="flex items-center gap-3 pr-6">
            <Avatar className="h-11 w-11">
              {community?.avatarUrl && safeUrl(community.avatarUrl) && (
                <AvatarImage src={community.avatarUrl} alt="" />
              )}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initialsOf(authorName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="truncate font-display text-base">{authorName}</DialogTitle>
              <DialogDescription asChild>
                <p className="text-xs text-muted-foreground">
                  {postedLabel && (
                    <time dateTime={post?.createdAtIso}>{t("postView.postedOn", { date: postedLabel })}</time>
                  )}
                </p>
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {post && <VisibilityBadge visibility={post.visibility} />}
            {showStatus && (
              <Badge variant="outline" className="capitalize">
                {status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {post && (
          <div className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
            {post.content.trim() && <PostText text={post.content} />}
            {post.attachments.length > 0 && <MediaGrid attachments={post.attachments} />}

            <ul
              className="flex flex-wrap items-center gap-x-5 gap-y-1 border-y border-border py-2.5 text-sm text-muted-foreground"
              aria-label={t("postView.engagement")}
            >
              <li className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {t("postView.commentsCount", { count: Math.max(post.comments, commentTotal ?? 0) })}
              </li>
              <li className="flex items-center gap-1.5">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {t("postView.sharesCount", { count: post.shares })}
              </li>
              <li className="flex items-center gap-1.5">
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                {t("postView.savesCount", { count: post.saves })}
              </li>
            </ul>

            <ReactionsSection postId={post.id} />

            <section aria-labelledby="post-view-comments" className="space-y-3">
              <h3 id="post-view-comments" className="text-sm font-semibold text-foreground">
                {t("postView.comments")}
              </h3>
              <CommentsTree postId={post.id} onLoaded={setCommentTotal} />
            </section>
          </div>
        )}

        <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
