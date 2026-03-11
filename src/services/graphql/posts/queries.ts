import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  Post,
  PostListResponse,
  PostEngagementCounts,
  Comment,
  TrendingHashtag,
  GetFeedInput,
  GetTrendingHashtagsInput,
  PostAuthorType,
} from "./types";

export async function getPostDetails(postId: string): Promise<Post> {
  const query = `
    query GetPostDetails($input: PostIdInput!) {
      getPostDetails(input: $input) {
        id
        authorType
        authorId
        text
        visibility
        status
        attachments {
          id
          type
          objectKey
          mimeType
          url
        }
        engagementCounts {
          likes
          shares
          saves
          comments
        }
        createdAt
        updatedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getPostDetails: Post }>(query, {
    input: { postId },
  });
  return data.getPostDetails;
}

export async function getPostEngagementCounts(
  postId: string
): Promise<PostEngagementCounts> {
  const query = `
    query GetPostEngagementCounts($input: PostIdInput!) {
      getPostEngagementCounts(input: $input) {
        likes
        shares
        saves
        comments
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getPostEngagementCounts: PostEngagementCounts }>(
    query,
    { input: { postId } }
  );
  return data.getPostEngagementCounts;
}

export async function getFeed(input: GetFeedInput): Promise<PostListResponse> {
  const query = `
    query GetFeed($input: GetFeedInput!) {
      feed(input: $input) {
        posts {
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
            mimeType
          }
          engagementCounts {
            likes
            comments
            shares
            saves
          }
        }
        total
        limit
        offset
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ feed: PostListResponse }>(query, { input });
  return data.feed;
}

export async function getUserPosts(
  authorType?: PostAuthorType,
  authorId?: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const query = `
    query UserPosts($authorType: String, $authorId: String, $limit: Int, $offset: Int) {
      userPosts(
        authorType: $authorType
        authorId: $authorId
        limit: $limit
        offset: $offset
      ) {
        id
        authorType
        authorId
        text
        status
        createdAt
        engagementCounts {
          likes
          comments
          shares
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ userPosts: Post[] }>(query, {
    authorType,
    authorId,
    limit,
    offset,
  });
  return data.userPosts;
}

export async function getPostComments(
  postId: string,
  limit = 20,
  offset = 0,
  parentId?: string
): Promise<Comment[]> {
  const query = `
    query PostComments($postId: String!, $limit: Int, $offset: Int, $parentId: String) {
      postComments(postId: $postId, limit: $limit, offset: $offset, parentId: $parentId) {
        id
        postId
        authorId
        authorType
        text
        parentId
        replyCount
        likeCount
        hasLiked
        authorDisplayName
        authorAvatarUrl
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ postComments: Comment[] }>(query, {
    postId,
    limit,
    offset,
    parentId,
  });
  return data.postComments;
}

export async function searchPosts(
  searchTerm: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const query = `
    query SearchPosts($searchTerm: String!, $limit: Int, $offset: Int) {
      searchPosts(searchTerm: $searchTerm, limit: $limit, offset: $offset) {
        id
        text
        authorId
        authorType
        status
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ searchPosts: Post[] }>(query, {
    searchTerm,
    limit,
    offset,
  });
  return data.searchPosts;
}

export async function getTrendingHashtags(
  input?: GetTrendingHashtagsInput
): Promise<TrendingHashtag[]> {
  const query = `
    query TrendingHashtags($input: GetTrendingHashtagsInput) {
      trendingHashtags(input: $input) {
        hashtag
        count
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ trendingHashtags: TrendingHashtag[] }>(query, {
    input,
  });
  return data.trendingHashtags;
}
