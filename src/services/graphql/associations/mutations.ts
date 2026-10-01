import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type {
  AssociationDetail,
  AssociationLinkRequest,
  AssociationMembershipMutationInput,
  AssociationOperationResponse,
  CreateAssociationInput,
  CreateAssociationResult,
  LinkAssociationInput,
  RemoveAssociationMemberInput,
  UpdateAssociationInput,
} from "./types";

const CREATE_ASSOCIATION = `
  mutation CreateAssociation($input: CreateAssociationInput!) {
    createAssociation(input: $input) {
      id
      name
      defaultGroupId
      joinPolicy
      visibility
      createdAt
    }
  }
`;

const UPDATE_ASSOCIATION = `
  mutation UpdateAssociation($input: UpdateAssociationInput!) {
    updateAssociation(input: $input) {
      id
      name
      description
      joinPolicy
      visibility
      avatarUrl
      updatedAt
    }
  }
`;

const LINK_ASSOCIATION = `
  mutation LinkAssociation($input: LinkAssociationInput!) {
    linkAssociation(input: $input) {
      success
      message
    }
  }
`;

const UNLINK_ASSOCIATION = `
  mutation UnlinkAssociation($input: LinkAssociationInput!) {
    unlinkAssociation(input: $input) {
      success
      message
    }
  }
`;

const APPROVE_MEMBERSHIP = `
  mutation ApproveMembership($input: ApproveMembershipInput!) {
    approveMembership(input: $input) {
      success
      message
    }
  }
`;

const REJECT_MEMBERSHIP = `
  mutation RejectMembership($input: RejectMembershipInput!) {
    rejectMembership(input: $input) {
      success
      message
    }
  }
`;

const REMOVE_MEMBER = `
  mutation RemoveMember($input: CommunityRemoveMemberInput!) {
    removeMember(input: $input) {
      success
      message
    }
  }
`;

const INVITE_MEMBER = `
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      success
      message
    }
  }
`;

const ASSOCIATION_LINK_REQUEST_FIELDS = `
  communityId
  associationId
  status
  requestedAt
  decidedAt
  associationName
  associationAvatarUrl
`;

const APPROVE_ASSOCIATION_LINK = `
  mutation ApproveAssociationLink($communityId: ID!, $associationId: ID!) {
    approveAssociationLink(communityId: $communityId, associationId: $associationId) {
      ${ASSOCIATION_LINK_REQUEST_FIELDS}
    }
  }
`;

const REJECT_ASSOCIATION_LINK = `
  mutation RejectAssociationLink($communityId: ID!, $associationId: ID!) {
    rejectAssociationLink(communityId: $communityId, associationId: $associationId) {
      ${ASSOCIATION_LINK_REQUEST_FIELDS}
    }
  }
`;

export async function createAssociation(
  input: CreateAssociationInput,
): Promise<CreateAssociationResult> {
  const data = await graphqlRequestWithAuth<
    { createAssociation: CreateAssociationResult },
    { input: CreateAssociationInput }
  >(CREATE_ASSOCIATION, { input });
  return data.createAssociation;
}

export async function updateAssociation(
  input: UpdateAssociationInput,
): Promise<AssociationDetail> {
  const data = await graphqlRequestWithAuth<
    { updateAssociation: AssociationDetail },
    { input: UpdateAssociationInput }
  >(UPDATE_ASSOCIATION, { input });
  return data.updateAssociation;
}

export async function linkAssociation(
  input: LinkAssociationInput,
): Promise<AssociationOperationResponse> {
  const data = await graphqlRequestWithAuth<
    { linkAssociation: AssociationOperationResponse },
    { input: LinkAssociationInput }
  >(LINK_ASSOCIATION, { input });
  return data.linkAssociation;
}

export async function unlinkAssociation(
  input: LinkAssociationInput,
): Promise<AssociationOperationResponse> {
  const data = await graphqlRequestWithAuth<
    { unlinkAssociation: AssociationOperationResponse },
    { input: LinkAssociationInput }
  >(UNLINK_ASSOCIATION, { input });
  return data.unlinkAssociation;
}

export async function approveAssociationMembership(
  input: AssociationMembershipMutationInput,
): Promise<AssociationOperationResponse> {
  const data = await graphqlRequestWithAuth<
    { approveMembership: AssociationOperationResponse },
    { input: AssociationMembershipMutationInput }
  >(APPROVE_MEMBERSHIP, { input });
  return data.approveMembership;
}

export async function rejectAssociationMembership(
  input: AssociationMembershipMutationInput,
): Promise<AssociationOperationResponse> {
  const data = await graphqlRequestWithAuth<
    { rejectMembership: AssociationOperationResponse },
    { input: AssociationMembershipMutationInput }
  >(REJECT_MEMBERSHIP, { input });
  return data.rejectMembership;
}

export async function removeAssociationMember(
  input: RemoveAssociationMemberInput,
): Promise<AssociationOperationResponse> {
  const data = await graphqlRequestWithAuth<
    { removeMember: AssociationOperationResponse },
    { input: RemoveAssociationMemberInput }
  >(REMOVE_MEMBER, { input });
  return data.removeMember;
}

export async function inviteAssociationMember(
  input: AssociationMembershipMutationInput,
): Promise<AssociationOperationResponse> {
  const data = await graphqlRequestWithAuth<
    { inviteMember: AssociationOperationResponse },
    { input: AssociationMembershipMutationInput }
  >(INVITE_MEMBER, { input });
  return data.inviteMember;
}

/** Community admin approves an association's pending link request (the link becomes ACTIVE). */
export async function approveAssociationLink(
  communityId: string,
  associationId: string,
): Promise<AssociationLinkRequest> {
  const data = await graphqlRequestWithAuth<
    { approveAssociationLink: AssociationLinkRequest },
    { communityId: string; associationId: string }
  >(APPROVE_ASSOCIATION_LINK, { communityId, associationId });
  return data.approveAssociationLink;
}

/** Community admin declines an association's pending link request. */
export async function rejectAssociationLink(
  communityId: string,
  associationId: string,
): Promise<AssociationLinkRequest> {
  const data = await graphqlRequestWithAuth<
    { rejectAssociationLink: AssociationLinkRequest },
    { communityId: string; associationId: string }
  >(REJECT_ASSOCIATION_LINK, { communityId, associationId });
  return data.rejectAssociationLink;
}
