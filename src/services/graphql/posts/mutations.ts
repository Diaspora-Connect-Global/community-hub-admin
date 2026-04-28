import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  Post,
  CreatedComment,
  PostCommonResponse,
  CreatePostInput,
  CreateCommunityPostInput,
  CreateCommentInput,
  AddEngagementInput,
  ReportPostInput,
  UploadUrlResponse,
  FileType,
  EditPostInput,
  EditPostResult,
  PostPriorityLevel,
} from "./types";

export async function deletePost(id: string): Promise<PostCommonResponse> {
  const mutation = `
    mutation DeletePost($id: String!) {
      deletePost(id: $id) {
        success
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ deletePost: PostCommonResponse }>(mutation, { id });
  return data.deletePost;
}

export async function deleteComment(commentId: string): Promise<PostCommonResponse> {
  const mutation = `
    mutation DeleteComment($input: DeleteCommentInput!) {
      deleteComment(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ deleteComment: PostCommonResponse }>(mutation, {
    input: { commentId },
  });
  return data.deleteComment;
}

export async function adminSetPostPriority(
  postId: string,
  level: PostPriorityLevel
): Promise<PostCommonResponse> {
  const mutation = `
    mutation AdminSetPostPriority($input: SetPostPriorityInput!) {
      adminSetPostPriority(input: $input) {
        success
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ adminSetPostPriority: PostCommonResponse }>(
    mutation,
    { input: { postId, level } }
  );
  return data.adminSetPostPriority;
}

/** @deprecated Prefer adminSetPostPriority — numeric priority is no longer in the public contract */
export async function applyAdminPriority(
  postId: string,
  priority: number
): Promise<PostCommonResponse> {
  const level: PostPriorityLevel =
    priority >= 2 ? "HIGH" : priority <= 0 ? "LOW" : "NORMAL";
  return adminSetPostPriority(postId, level);
}

export async function reportPost(input: ReportPostInput): Promise<PostCommonResponse> {
  const mutation = `
    mutation ReportPost($input: ReportPostInput!) {
      reportPost(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ reportPost: PostCommonResponse }>(mutation, {
    input,
  });
  return data.reportPost;
}

/**
 * Request a signed GCS upload URL.
 * Flow:
 *   1. Call this to get { uploadUrl, objectKey, fileUrl }
 *   2. PUT binary to uploadUrl with the matching Content-Type header
 *   3. Use objectKey in CreatePostInput.attachments
 */
export async function requestUploadUrl(
  fileName: string,
  fileType: FileType,
  contentType: string,
  vendorId?: string
): Promise<UploadUrlResponse> {
  const mutation = `
    mutation RequestUploadUrl($fileName: String!, $fileType: String!, $contentType: String!, $vendorId: String) {
      requestUploadUrl(fileName: $fileName, fileType: $fileType, contentType: $contentType, vendorId: $vendorId) {
        uploadUrl
        objectKey
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ requestUploadUrl: UploadUrlResponse }>(mutation, {
    fileName,
    fileType,
    contentType,
    vendorId,
  });
  return data.requestUploadUrl;
}

/**
 * Publish as the community: uses `createPost` with `authorType: COMMUNITY` and
 * `authorId` = community id (same as admin `scopeId`).
 */
export async function createCommunityPost(input: CreateCommunityPostInput): Promise<Post> {
  return createPost({
    text: input.text,
    authorType: "COMMUNITY",
    authorId: input.communityId,
    visibility: input.visibility ?? "PUBLIC",
    attachments: input.attachments?.map((a) => ({
      objectKey: a.objectKey,
      type: a.type,
      mimeType: a.mimeType,
      size: a.size,
    })),
  });
}

export async function createComment(input: CreateCommentInput): Promise<CreatedComment> {
  const mutation = `
    mutation CreateComment($input: CreateCommentInput!) {
      createComment(input: $input) {
        id
        postId
        userId
        text
        parentId
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ createComment: CreatedComment }>(mutation, {
    input,
  });
  return data.createComment;
}

export async function addEngagement(input: AddEngagementInput): Promise<PostCommonResponse> {
  const mutation = `
    mutation AddEngagement($input: AddEngagementInput!) {
      addEngagement(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ addEngagement: PostCommonResponse }>(mutation, {
    input,
  });
  return data.addEngagement;
}

export async function removeEngagement(input: AddEngagementInput): Promise<PostCommonResponse> {
  const mutation = `
    mutation RemoveEngagement($input: RemoveEngagementInput!) {
      removeEngagement(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ removeEngagement: PostCommonResponse }>(mutation, {
    input,
  });
  return data.removeEngagement;
}

export async function adminDeletePost(postId: string): Promise<PostCommonResponse> {
  const mutation = `
    mutation AdminDeletePost($input: PostIdInput!) {
      adminDeletePost(input: $input) {
        success
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ adminDeletePost: PostCommonResponse }>(mutation, {
    input: { postId },
  });
  return data.adminDeletePost;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        authorType
        authorId
        text
        visibility
        status
        createdAt
        attachments {
          id
          type
          url
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ createPost: Post }>(mutation, { input });
  return data.createPost;
}

export async function editPost(input: EditPostInput): Promise<EditPostResult> {
  const mutation = `
    mutation EditPost($input: EditPostInput!) {
      editPost(input: $input) {
        id
        text
        visibility
        updatedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ editPost: EditPostResult }>(mutation, { input });
  return data.editPost;
}

export async function hidePost(id: string): Promise<PostCommonResponse> {
  const mutation = `
    mutation HidePost($id: String!) {
      hidePost(id: $id) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ hidePost: PostCommonResponse }>(mutation, { id });
  return data.hidePost;
}
