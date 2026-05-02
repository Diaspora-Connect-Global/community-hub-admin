export interface CommunityVerification {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  communityId?: string;
  docType?: string;
  documentDetails?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  status?: string;
}

export interface CommunityVerificationListResponse {
  items: CommunityVerification[];
  total: number;
}
