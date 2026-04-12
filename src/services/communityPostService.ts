import {
  communityPostingAuthority,
  createCommunityPost,
  getCommunityFeed,
  post,
  postComments,
  createComment,
  addEngagement,
  removeEngagement,
  reportPost,
  requestUploadUrl,
  adminDeletePost,
  type CommunityPostingAuthority,
  type CommunityFeedResponse,
  type Post,
  type Comment,
  type CreatedComment,
  type CreateCommunityPostInput,
  type CreateCommentInput,
  type AddEngagementInput,
  type ReportPostInput,
  type AttachmentType,
  type UploadUrlResponse,
} from "@/services/graphql/posts";
import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";

interface UploadAttachmentInput {
  file: File;
  type: AttachmentType;
  vendorId?: string;
}

interface UploadedAttachment {
  objectKey: string;
  mimeType: string;
  type: AttachmentType;
  size: number;
}

export interface CommunityPostApi {
  getPostingAuthority(communityId: string): Promise<{ hasAuthority: boolean; reason?: string }>;
  createCommunityPost(input: {
    communityId: string;
    text: string;
    visibility: "PUBLIC" | "EVERYONE" | "FRIENDS" | "ONLY_ME";
    attachments?: Array<{
      objectKey: string;
      type: AttachmentType;
      mimeType: string;
      size: number;
      duration?: number;
    }>;
    mentionedUserIds?: string[];
  }): Promise<{ id: string }>;
  getCommunityFeed(communityId: string, limit: number, offset: number): Promise<CommunityFeedResponse>;
  adminDeletePost(postId: string): Promise<boolean>;
}

async function withReadRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export class CommunityPostService implements CommunityPostApi {
  async getPostingAuthority(communityId: string): Promise<CommunityPostingAuthority> {
    return communityPostingAuthority(communityId);
  }

  async requestUploadUrl(
    fileName: string,
    fileType: AttachmentType,
    contentType: string,
    vendorId?: string
  ): Promise<UploadUrlResponse> {
    return requestUploadUrl(fileName, fileType, contentType, vendorId);
  }

  async uploadAttachment(input: UploadAttachmentInput): Promise<UploadedAttachment> {
    const upload = await this.requestUploadUrl(
      input.file.name,
      input.type,
      input.file.type,
      input.vendorId
    );

    await uploadFileToSignedUrl(upload.uploadUrl, input.file, input.file.type);

    return {
      objectKey: upload.objectKey,
      mimeType: input.file.type,
      type: input.type,
      size: input.file.size,
    };
  }

  async createCommunityPost(input: CreateCommunityPostInput): Promise<{ id: string }> {
    if (!input.visibility) {
      throw new Error("visibility is required for createCommunityPost");
    }

    const result = await createCommunityPost(input);
    return { id: result.id };
  }

  async getCommunityFeed(
    communityId: string,
    limit: number,
    offset: number
  ): Promise<CommunityFeedResponse> {
    return withReadRetry(() => getCommunityFeed(communityId, limit, offset));
  }

  async post(postId: string): Promise<Post> {
    return withReadRetry(() => post(postId));
  }

  async postComments(
    postId: string,
    limit = 20,
    offset = 0,
    parentId?: string
  ): Promise<Comment[]> {
    return withReadRetry(() => postComments(postId, limit, offset, parentId));
  }

  async createComment(input: CreateCommentInput): Promise<CreatedComment> {
    return createComment(input);
  }

  async addEngagement(input: AddEngagementInput): Promise<boolean> {
    const result = await addEngagement(input);
    return result.success;
  }

  async removeEngagement(input: AddEngagementInput): Promise<boolean> {
    const result = await removeEngagement(input);
    return result.success;
  }

  async reportPost(input: ReportPostInput): Promise<boolean> {
    const result = await reportPost(input);
    return result.success;
  }

  async adminDeletePost(postId: string): Promise<boolean> {
    const result = await adminDeletePost(postId);
    return result.success;
  }
}

export const communityPostService = new CommunityPostService();
