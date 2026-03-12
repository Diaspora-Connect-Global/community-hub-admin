/**
 * TypeScript types for Opportunity Service GraphQL API.
 * Enums and types match the schema; used by fragments and operations.
 */

export type OpportunityTypeEnum =
  | "EMPLOYMENT"
  | "SCHOLARSHIP"
  | "INVESTMENT"
  | "FELLOWSHIP"
  | "INITIATIVE"
  | "GRANT"
  | "PROGRAM"
  | "VOLUNTEER"
  | "CONTRACT";

export type OpportunityCategoryEnum =
  | "EMPLOYMENT_CAREER"
  | "EDUCATION_TRAINING"
  | "FUNDING_GRANTS"
  | "FELLOWSHIPS_LEADERSHIP"
  | "BUSINESS_INVESTMENT"
  | "VOLUNTEERING_SOCIAL_IMPACT"
  | "EVENT_CREATIVE_INDUSTRY"
  | "AGRICULTURE_SUSTAINABILITY"
  | "REAL_ESTATE_INFRASTRUCTURE"
  | "GOVERNMENT_EMBASSY_INITIATIVES"
  | "INNOVATION_RESEARCH"
  | "FINANCE_ECONOMICS"
  | "RETURN_REINTEGRATION";

export type WorkModeEnum = "REMOTE" | "HYBRID" | "ONSITE";
export type EngagementTypeEnum = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type VisibilityEnum = "PUBLIC" | "COMMUNITY_ONLY" | "ASSOCIATION_ONLY";
export type ApplicationMethodEnum = "EXTERNAL_LINK" | "IN_PLATFORM_FORM" | "EMAIL_REQUEST";
export type OpportunityStatusEnum = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type OwnerTypeEnum = "USER" | "COMMUNITY" | "ASSOCIATION";
export type PriorityLevelEnum = "HIGH" | "NORMAL" | "LOW";
export type ApplicationStatusEnum = "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export interface OpportunityOwnerType {
  id: string;
  name: string;
  avatarUrl: string | null;
  type: string;
}

export interface FileRefType {
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface OpportunityType {
  id: string;
  ownerType: OwnerTypeEnum;
  ownerId: string;
  owner: OpportunityOwnerType | null;
  type: OpportunityTypeEnum;
  category: OpportunityCategoryEnum;
  subCategory: string | null;
  title: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  workMode: WorkModeEnum | null;
  engagementType: EngagementTypeEnum | null;
  location: string | null;
  visibility: VisibilityEnum;
  applicationMethod: ApplicationMethodEnum;
  externalLink: string | null;
  applicationEmail: string | null;
  status: OpportunityStatusEnum;
  priorityLevel: PriorityLevelEnum;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  deadline: string | null;
  applicationCount: number;
  skills: string[];
  tags: string[];
  isSavedByCurrentUser: boolean | null;
  hasCurrentUserApplied: boolean | null;
  currentUserApplicationId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
}

export interface ApplicationType {
  id: string;
  opportunityId: string;
  applicantId: string;
  status: ApplicationStatusEnum;
  resumeFileRef: FileRefType | null;
  coverLetter: string | null;
  customAnswers: string | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  opportunity?: OpportunityType | null;
}

export interface OpportunityListResponse {
  opportunities: OpportunityType[];
  total: number;
}

export interface ApplicationListResponse {
  applications: ApplicationType[];
  total: number;
}

export interface CreateOpportunityResponse {
  id: string;
}

/** ListOpportunitiesInput — defaults: limit 20, offset 0, status "PUBLISHED" */
export interface ListOpportunitiesInput {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  type?: OpportunityTypeEnum;
  category?: OpportunityCategoryEnum;
  subCategory?: string;
  workMode?: WorkModeEnum;
  engagementType?: EngagementTypeEnum;
  location?: string;
  ownerType?: OwnerTypeEnum;
  ownerId?: string;
  status?: OpportunityStatusEnum | "ALL";
  sortBy?: string;
  sortOrder?: string;
}

export interface GetApplicationsInput {
  opportunityId: string;
  limit?: number;
  offset?: number;
  status?: string;
}

export interface CreateOpportunityInput {
  ownerType: OwnerTypeEnum;
  ownerId: string;
  type: OpportunityTypeEnum;
  category: OpportunityCategoryEnum;
  title: string;
  description: string;
  visibility: VisibilityEnum;
  applicationMethod: ApplicationMethodEnum;
  responsibilities?: string;
  requirements?: string;
  workMode?: WorkModeEnum;
  engagementType?: EngagementTypeEnum;
  location?: string;
  externalLink?: string;
  applicationEmail?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  deadline?: string;
  subCategory?: string;
  skills?: string[];
  tags?: string[];
}

export interface UpdateOpportunityInput {
  applicationMethod?: ApplicationMethodEnum;
  externalLink?: string;
  applicationEmail?: string;
  title?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  workMode?: WorkModeEnum;
  engagementType?: EngagementTypeEnum;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  deadline?: string;
  subCategory?: string;
  skills?: string[];
  tags?: string[];
}

export interface ReviewApplicationInput {
  applicationId: string;
  notes?: string;
}

export interface SetOpportunityPriorityInput {
  opportunityId: string;
  priority: PriorityLevelEnum;
}
