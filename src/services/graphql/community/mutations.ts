import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  Community,
  UpdateCommunityInput,
  UpdateCommunityVisibilityInput,
  UpdateCommunityJoinPolicyInput,
  ApproveMembershipInput,
  ApproveResponse,
  RejectMembershipInput,
  RejectResponse,
  InviteMemberInput,
  InviteMemberResponse,
  CommunityRemoveMemberInput,
  RemoveResponse,
  BanUserInput,
  BanResponse,
  UnbanUserInput,
  UnbanResponse,
  SuspendResponse,
  UnsuspendResponse,
  AssignMemberRoleInput,
  CommunityOperationResponse,
  CommunityTransferOwnershipInput,
  CommunityUploadUrlResponse,
  DeleteEntityImageResponse,
  CreateAssociationInput,
  UpdateAssociationInput,
  Association,
  LinkAssociationInput,
  LinkAssociationResponse,
  UpdateReportInput,
  UpdatedReport,
} from "./types";

export async function updateCommunity(input: UpdateCommunityInput): Promise<Community> {
  const mutation = `
    mutation UpdateCommunity($input: UpdateCommunityInput!) {
      updateCommunity(input: $input) {
        id
        name
        description
        website
        contactEmail
        communityRules
        whoCanPost
        countriesServed
        avatarUrl
        coverUrl
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ updateCommunity: Community }>(mutation, { input });
  return data.updateCommunity;
}

export async function updateCommunityVisibility(
  input: UpdateCommunityVisibilityInput
): Promise<Pick<Community, "id" | "visibility">> {
  const mutation = `
    mutation UpdateCommunityVisibility($input: UpdateCommunityVisibilityInput!) {
      updateCommunityVisibility(input: $input) {
        id
        visibility
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    updateCommunityVisibility: Pick<Community, "id" | "visibility">;
  }>(mutation, { input });
  return data.updateCommunityVisibility;
}

export async function updateCommunityJoinPolicy(
  input: UpdateCommunityJoinPolicyInput
): Promise<Pick<Community, "id" | "joinPolicy">> {
  const mutation = `
    mutation UpdateCommunityJoinPolicy($input: UpdateCommunityJoinPolicyInput!) {
      updateCommunityJoinPolicy(input: $input) {
        id
        joinPolicy
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    updateCommunityJoinPolicy: Pick<Community, "id" | "joinPolicy">;
  }>(mutation, { input });
  return data.updateCommunityJoinPolicy;
}

export async function approveMembership(
  input: ApproveMembershipInput
): Promise<ApproveResponse> {
  const mutation = `
    mutation ApproveMembership($input: ApproveMembershipInput!) {
      approveMembership(input: $input) {
        success
        message
        approvedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ approveMembership: ApproveResponse }>(
    mutation,
    { input }
  );
  return data.approveMembership;
}

export async function rejectMembership(
  input: RejectMembershipInput
): Promise<RejectResponse> {
  const mutation = `
    mutation RejectMembership($input: RejectMembershipInput!) {
      rejectMembership(input: $input) {
        success
        message
        rejectedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ rejectMembership: RejectResponse }>(
    mutation,
    { input }
  );
  return data.rejectMembership;
}

export async function inviteMember(input: InviteMemberInput): Promise<InviteMemberResponse> {
  const mutation = `
    mutation InviteMember($input: InviteMemberInput!) {
      inviteMember(input: $input) {
        status
        inviteId
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ inviteMember: InviteMemberResponse }>(
    mutation,
    { input }
  );
  return data.inviteMember;
}

export async function removeMember(input: CommunityRemoveMemberInput): Promise<RemoveResponse> {
  const mutation = `
    mutation RemoveMember($input: CommunityRemoveMemberInput!) {
      removeMember(input: $input) {
        success
        message
        removedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ removeMember: RemoveResponse }>(
    mutation,
    { input }
  );
  return data.removeMember;
}

export async function banUser(input: BanUserInput): Promise<BanResponse> {
  const mutation = `
    mutation BanUser($input: BanUserInput!) {
      banUser(input: $input) {
        success
        message
        bannedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ banUser: BanResponse }>(mutation, { input });
  return data.banUser;
}

export async function unbanUser(input: UnbanUserInput): Promise<UnbanResponse> {
  const mutation = `
    mutation UnbanUser($input: UnbanUserInput!) {
      unbanUser(input: $input) {
        success
        message
        unbannedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ unbanUser: UnbanResponse }>(mutation, { input });
  return data.unbanUser;
}

export async function suspendMember(
  input: CommunityRemoveMemberInput
): Promise<SuspendResponse> {
  const mutation = `
    mutation SuspendMember($input: CommunityRemoveMemberInput!) {
      suspendMember(input: $input) {
        success
        message
        suspendedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ suspendMember: SuspendResponse }>(
    mutation,
    { input }
  );
  return data.suspendMember;
}

export async function unsuspendMember(input: UnbanUserInput): Promise<UnsuspendResponse> {
  const mutation = `
    mutation UnsuspendMember($input: UnbanUserInput!) {
      unsuspendMember(input: $input) {
        success
        message
        unsuspendedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ unsuspendMember: UnsuspendResponse }>(
    mutation,
    { input }
  );
  return data.unsuspendMember;
}

export async function assignMemberRole(
  input: AssignMemberRoleInput
): Promise<CommunityOperationResponse> {
  const mutation = `
    mutation AssignMemberRole($input: AssignMemberRoleInput!) {
      assignMemberRole(input: $input) {
        success
        message
        timestamp
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ assignMemberRole: CommunityOperationResponse }>(
    mutation,
    { input }
  );
  return data.assignMemberRole;
}

export async function transferOwnership(
  input: CommunityTransferOwnershipInput
): Promise<CommunityOperationResponse> {
  const mutation = `
    mutation TransferOwnership($input: CommunityTransferOwnershipInput!) {
      transferOwnership(input: $input) {
        success
        message
        timestamp
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ transferOwnership: CommunityOperationResponse }>(
    mutation,
    { input }
  );
  return data.transferOwnership;
}

export async function getCommunityAvatarUploadUrl(
  communityId: string,
  filename: string,
  contentType: string
): Promise<CommunityUploadUrlResponse> {
  const mutation = `
    mutation GetCommunityAvatarUploadUrl($communityId: ID!, $filename: String!, $contentType: String!) {
      getCommunityAvatarUploadUrl(
        communityId: $communityId
        filename: $filename
        contentType: $contentType
      ) {
        uploadUrl
        fileUrl
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getCommunityAvatarUploadUrl: CommunityUploadUrlResponse;
  }>(mutation, { communityId, filename, contentType });
  return data.getCommunityAvatarUploadUrl;
}

export async function getCommunityCoverUploadUrl(
  communityId: string,
  filename: string,
  contentType: string
): Promise<CommunityUploadUrlResponse> {
  const mutation = `
    mutation GetCommunityCoverUploadUrl($communityId: ID!, $filename: String!, $contentType: String!) {
      getCommunityCoverUploadUrl(
        communityId: $communityId
        filename: $filename
        contentType: $contentType
      ) {
        uploadUrl
        fileUrl
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getCommunityCoverUploadUrl: CommunityUploadUrlResponse;
  }>(mutation, { communityId, filename, contentType });
  return data.getCommunityCoverUploadUrl;
}

export async function deleteEntityImage(
  entityId: string,
  entityType: string,
  imageType: "avatar" | "cover"
): Promise<DeleteEntityImageResponse> {
  const mutation = `
    mutation DeleteEntityImage($entityId: ID!, $entityType: String!, $imageType: String!) {
      deleteEntityImage(entityId: $entityId, entityType: $entityType, imageType: $imageType) {
        success
        message
        timestamp
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ deleteEntityImage: DeleteEntityImageResponse }>(
    mutation,
    { entityId, entityType, imageType }
  );
  return data.deleteEntityImage;
}

export async function createAssociation(input: CreateAssociationInput): Promise<Association> {
  const mutation = `
    mutation CreateAssociation($input: CreateAssociationInput!) {
      createAssociation(input: $input) {
        id
        name
        description
        visibility
        joinPolicy
        contactEmail
        website
        avatarUrl
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ createAssociation: Association }>(
    mutation,
    { input }
  );
  return data.createAssociation;
}

export async function updateAssociation(input: UpdateAssociationInput): Promise<Association> {
  const mutation = `
    mutation UpdateAssociation($input: UpdateAssociationInput!) {
      updateAssociation(input: $input) {
        id
        name
        description
        website
        contactEmail
        countriesServed
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ updateAssociation: Association }>(
    mutation,
    { input }
  );
  return data.updateAssociation;
}

export async function linkAssociation(
  input: LinkAssociationInput
): Promise<LinkAssociationResponse> {
  const mutation = `
    mutation LinkAssociation($input: LinkAssociationInput!) {
      linkAssociation(input: $input) {
        success
        message
        communityId
        associationId
        linkedBy
        linkedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ linkAssociation: LinkAssociationResponse }>(
    mutation,
    { input }
  );
  return data.linkAssociation;
}

export async function getAssociationAvatarUploadUrl(
  associationId: string,
  filename: string,
  contentType: string
): Promise<CommunityUploadUrlResponse> {
  const mutation = `
    mutation GetAssociationAvatarUploadUrl($associationId: ID!, $filename: String!, $contentType: String!) {
      getAssociationAvatarUploadUrl(
        associationId: $associationId
        filename: $filename
        contentType: $contentType
      ) {
        uploadUrl
        fileUrl
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getAssociationAvatarUploadUrl: CommunityUploadUrlResponse;
  }>(mutation, { associationId, filename, contentType });
  return data.getAssociationAvatarUploadUrl;
}

export async function updateCommunityReport(
  reportId: string,
  input: UpdateReportInput,
): Promise<UpdatedReport> {
  const mutation = `
    mutation UpdateCommunityReport($reportId: ID!, $input: UpdateReportInput!) {
      updateCommunityReport(reportId: $reportId, input: $input) {
        id
        status
        resolution
        resolvedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ updateCommunityReport: UpdatedReport }>(
    mutation,
    { reportId, input },
  );
  return data.updateCommunityReport;
}
