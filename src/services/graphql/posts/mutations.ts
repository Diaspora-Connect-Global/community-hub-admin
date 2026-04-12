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
} from "./types";

export async function deletePost(id: string): Promise<PostCommonResponse> {
  const mutation = `
    mutation DeletePost($id: String!) {
      deletePost(id: $id) {
        success
        message
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

export async function applyAdminPriority(
  postId: string,
  priority: number
): Promise<PostCommonResponse> {
  const mutation = `
    mutation ApplyAdminPriority($postId: String!, $priority: Int!) {
      applyAdminPriority(postId: $postId, priority: $priority) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ applyAdminPriority: PostCommonResponse }>(
    mutation,
    { postId, priority }
  );
  return data.applyAdminPriority;
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
        fileUrl
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

export async function createCommunityPost(input: CreateCommunityPostInput): Promise<Post> {
  const mutation = `
    mutation CreateCommunityPost($input: CreateCommunityPostInput!) {
      createCommunityPost(input: $input) {
        id
        authorType
        authorId
        text
        visibility
        status
        createdAt
        attachments {
          id
          objectKey
          mimeType
          type
          url
        }
        engagementCounts {
          likes
          comments
          shares
          saves
        }
      }
    }
  `;

  const data = await graphqlRequestWithAuth<{ createCommunityPost: Post }>(mutation, { input });
  return data.createCommunityPost;
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
        message
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
        text
        authorType
        authorId
        visibility
        status
        attachments {
          id
          type
          url
        }
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ createPost: Post }>(mutation, { input });
  return data.createPost;
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
