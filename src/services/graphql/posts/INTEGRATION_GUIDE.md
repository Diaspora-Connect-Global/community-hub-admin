# Community Admin App — Post Service Frontend Integration Guide

Last updated: 2026-04-12

## Purpose
This guide defines the Community Admin frontend integration contract for post APIs in API Gateway GraphQL.

## Primary community-admin operations
- `communityPostingAuthority(communityId)`
- `createCommunityPost(input)`
- `getCommunityFeed(communityId, limit, offset)`

## General post operations used in Community Admin
- `post(id)`
- `postComments(postId, limit, offset, parentId)`
- `createComment(input)`
- `addEngagement(input)` / `removeEngagement(input)`
- `reportPost(input)`
- `requestUploadUrl(fileName, fileType, contentType, vendorId)`

## Moderation/admin operation
- `adminDeletePost(input)`

## Required flow
1. Check posting authority before opening composer.
2. Upload attachments first (request URL → PUT upload → collect `objectKey`).
3. Create post with explicit `visibility`.
4. Read feed with `limit/offset` pagination.
5. Handle comments/reactions.
6. Use `adminDeletePost` for community-authored post removal.

## Frontend contracts

### CreateCommunityPostInput
- `communityId: ID!`
- `text: String!`
- `visibility?: String` (set explicitly, recommend `PUBLIC`)
- `attachments?: CommunityPostAttachmentInput[]`
- `mentionedUserIds?: String[]`

### CommunityPostAttachmentInput
- `objectKey: String!`
- `type: String!` (`IMAGE` | `VIDEO` | `DOCUMENT`)
- `mimeType: String!`
- `size: Int!`
- `duration?: Int`

### AddEngagementInput
- `postId: String!`
- `engagementType: String!` (`LIKE` | `SAVE` | `SHARE`)

## Error handling UI mapping
- `Unauthorized` → "Please sign in again"
- `You do not have permission to post in this community` → "You must be an active member to post"
- `Post not found` → refresh feed and remove stale card
- `Only the author can edit/delete this post` → route community removals through `adminDeletePost`
- Upload failures → retry upload before create mutation

## Retry policy
- Reads (`getCommunityFeed`, `post`) → retry up to 2 times
- Writes (`createCommunityPost`, `createComment`, engagements) → no blind retry

## Implemented frontend API
Use [src/services/communityPostService.ts](src/services/communityPostService.ts) for the high-level integration wrapper.
