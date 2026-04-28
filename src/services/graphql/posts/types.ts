// TypeScript types for the Post & Feed service

export type PostStatus = "active" | "hidden" | "deleted" | "draft";
export type PostVisibility =
  | "public"
  | "private"
  | "followers"
  | "PUBLIC"
  | "COMMUNITY"
  | "PRIVATE"
  | "EVERYONE"
  | "FRIENDS"
  | "ONLY_ME";
export type PostAuthorType = "USER" | "COMMUNITY" | "ASSOCIATION";
export type AttachmentType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
export type FeedType = "PERSONAL" | "COMMUNITY" | "TRENDING" | "DISCOVER";
export type FileType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
export type TrendingTimeRange = "1h" | "24h" | "7d" | "30d";
export type PostReportReason = "SPAM" | "ABUSE" | "POLICY_VIOLATION" | "OTHER";
export type EngagementType = "LIKE" | "SAVE" | "SHARE";

export interface PostAttachment {
  id: string;
  type: AttachmentType;
  objectKey?: string;
  mimeType?: string;
  url?: string;
}

export interface PostMention {
  entityId: string;
  entityType: string;
  handle?: string | null;
  displayName?: string | null;
}

export interface PostHashtag {
  id: string;
  tag: string;
  usageCount?: number;
}

export interface PostEngagementCounts {
  likes: number;
  shares: number;
  saves: number;
  comments: number;
}

export interface Post {
  id: string;
  authorType: PostAuthorType;
  authorId: string;
  text?: string;
  visibility: PostVisibility;
  status: PostStatus;
  attachments?: PostAttachment[];
  engagementCounts?: PostEngagementCounts;
  mentions?: PostMention[];
  hashtags?: PostHashtag[];
  createdAt: string;
  updatedAt?: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
  nextCursor?: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorType: PostAuthorType;
  text: string;
  parentId?: string;
  replyCount: number;
  likeCount: number;
  hasLiked?: boolean;
  authorDisplayName?: string;
  authorHandle?: string | null;
  createdAt: string;
}

export interface CreatedComment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  parentId?: string;
  createdAt: string;
}

export type HashtagTrend = "UP" | "DOWN" | "STABLE";

export interface TrendingHashtag {
  id: string;
  tag: string;
  usageCount: number;
  recentUsageCount?: number;
  trend?: HashtagTrend;
}

export interface GetTrendingHashtagsInput {
  limit?: number;
  timeRange?: TrendingTimeRange;
}

export interface GetFeedInput {
  type: FeedType;
  /** Required for `COMMUNITY` feed — use `admin.scopeId` from admin login */
  communityId?: string;
  limit?: number;
  offset?: number;
}

export interface PostAttachmentInput {
  objectKey: string;
  mimeType: string;
  type: AttachmentType;
  size?: number;
}

export interface CommunityPostAttachmentInput extends PostAttachmentInput {
  size: number;
  duration?: number;
}

export interface CreatePostInput {
  text?: string;
  authorType: PostAuthorType;
  authorId: string;
  visibility?: PostVisibility;
  attachments?: PostAttachmentInput[];
}

export interface EditPostInput {
  id: string;
  text?: string;
  visibility?: PostVisibility;
}

/** Subset returned by `editPost` */
export interface EditPostResult {
  id: string;
  text?: string;
  visibility: PostVisibility;
  updatedAt: string;
}

export type PostPriorityLevel = "HIGH" | "NORMAL" | "LOW";

export interface ReportPostInput {
  postId: string;
  reason: PostReportReason;
  details?: string;
}

export interface CreateCommunityPostInput {
  communityId: string;
  text: string;
  visibility?: PostVisibility;
  attachments?: CommunityPostAttachmentInput[];
  mentionedUserIds?: string[];
}

export interface CreateCommentInput {
  postId: string;
  text: string;
  parentId?: string;
}

export interface AddEngagementInput {
  postId: string;
  engagementType: EngagementType;
}

export interface PostIdInput {
  postId: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  fileUrl?: string;
}

export interface PostCommonResponse {
  success: boolean;
  message?: string;
}

export interface CommunityPostingAuthority {
  hasAuthority: boolean;
  role?: string;
  reason?: string;
}

export interface CommunityFeedResponse extends PostListResponse {
  hasMore: boolean;
}
