// TypeScript types for the Post & Feed service

export type PostStatus = "active" | "hidden" | "deleted" | "draft";
export type PostVisibility = "public" | "private" | "followers";
export type PostAuthorType = "USER" | "COMMUNITY" | "ASSOCIATION";
export type AttachmentType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
export type FeedType = "PERSONAL" | "COMMUNITY" | "TRENDING";
export type FileType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
export type TrendingTimeRange = "1h" | "24h" | "7d" | "30d";
export type PostReportReason = "SPAM" | "ABUSE" | "POLICY_VIOLATION" | "OTHER";

export interface PostAttachment {
  id: string;
  type: AttachmentType;
  objectKey?: string;
  mimeType?: string;
  url?: string;
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
  createdAt: string;
  updatedAt?: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
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
  authorAvatarUrl?: string;
  createdAt: string;
}

export interface TrendingHashtag {
  hashtag: string;
  count: number;
}

export interface GetTrendingHashtagsInput {
  limit?: number;
  timeRange?: TrendingTimeRange;
}

export interface GetFeedInput {
  type: FeedType;
  limit?: number;
  offset?: number;
}

export interface PostAttachmentInput {
  objectKey: string;
  mimeType: string;
  type: AttachmentType;
}

export interface CreatePostInput {
  text?: string;
  authorType: PostAuthorType;
  authorId: string;
  visibility?: PostVisibility;
  attachments?: PostAttachmentInput[];
}

export interface ReportPostInput {
  postId: string;
  reason: PostReportReason;
  details?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  fileUrl: string;
}

export interface PostCommonResponse {
  success: boolean;
  message?: string;
}
