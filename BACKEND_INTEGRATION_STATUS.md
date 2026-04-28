# Community Hub Admin — Backend Integration Status

GraphQL endpoint: `VITE_GRAPHQL_URL` (default: `https://api.diaspoplug.net/graphql`)

---

## ✅ INTEGRATED — Real backend data

| Page | Route | Services Used |
|------|-------|---------------|
| Login | `/login` | `adminAuthService` (login mutation) |
| Dashboard | `/` | `getCommunityStats` (community service) |
| Members | `/members` | `listCommunityMembers`, `searchMembers`, `listPendingMemberships`, `approveMembership`, `rejectMembership`, `banUser`, `unbanUser`, `suspendMember`, `unsuspendMember`, `removeMember`, `inviteMember` |
| Opportunities | `/opportunities` | `listOpportunities`, `createOpportunity`, `updateOpportunity`, `publishOpportunity`, `closeOpportunity`, `deleteOpportunity`, `getApplications`, `acceptApplication`, `rejectApplication` |
| Groups | `/groups` | `discoverGroups`, `createGroup`, `updateGroup`, `deleteGroup` |
| Events | `/events` | `listEvents`, `getEvent`, `getEventStats`, `getEventRegistrations`, `createEvent`, `updateEvent`, `publishEvent`, `deleteEvent`, `cancelEvent`, `createEventTicket`, `updateEventTicket`, `markRegistrationCheckedIn` |
| Posts | `/posts` | `communityPostService` (list, create, update, delete, publish, unpublish) |
| Marketplace | `/marketplace` | `VendorService` (listVendorProducts, createProduct, updateProduct, deleteProduct, listVendorOrders) |
| Vendors | `/vendors` | `VendorService` (listVendors, suspendVendor, reinstateVendor, getVendorDashboard) |
| Associations | `/associations` | `getCommunity`, `getCommunityAssociations`, `createAssociation`, `updateAssociation`, `linkAssociation` |
| Settings | `/settings` | `getCommunity`, `updateCommunity`, `updateCommunityVisibility`, `updateCommunityJoinPolicy`, `getCommunityCoverUploadUrl`, `getCommunityAvatarUploadUrl` |
| Audit Log | `/audit` | `getModerationLogs` (community service — scoped to community entity) |

---

## ⚠️ PARTIAL — Real data + some mock/static UI

| Page | Real Data | Mock/Static Remaining | Why Still Mock |
|------|-----------|----------------------|----------------|
| Audit Log | Live `getModerationLogs` (action, entityType, entityId, details, performedBy) | `actorName`, `notes` (human-readable summary), `target` (entity name) | `getModerationLogs` returns IDs not names; no reverse lookup |

---

## ❌ TODO — Backend APIs needed

### 1. Community Reports / Content Moderation (`/reports`)
**Current state**: Entire page uses hardcoded `reportsData` (5 mock items).
**Needs**:
- `getCommunityReports(communityId, status?, type?, limit, offset)` — list flagged content reports scoped to a community
  - Return fields: `id, item (title), description, type (POST|LISTING|OPPORTUNITY|GROUP|EVENT), reportedBy (userId), status (OPEN|INVESTIGATING|RESOLVED|ESCALATED), createdAt`
- `updateCommunityReport(reportId, status, resolutionNotes?)` — resolve/escalate a report
- `removeCommunityContent(communityId, contentType, contentId, reason)` — admin remove content

### 2. KYC / Identity Registry (`/registry`)
**Current state**: Entire page uses hardcoded `verificationsData` (5 mock items: ID documents, proof of address, business registration).
**Needs**:
- `getCommunityVerifications(communityId, status?, limit, offset)` — list member identity verification submissions
  - Return fields: `id, userId, userName, docType, documentDetails, submittedAt, status (PENDING|APPROVED|REJECTED)`
- `approveVerification(verificationId, notes?)` — approve an identity document
- `rejectVerification(verificationId, reason)` — reject with reason

### 3. Admin Profile Settings (`/profile`)
**Current state**: Static form (no data loaded, Save button doesn't call any API).
**Needs**:
- `getAdminProfile()` — return current admin's profile info (name, email, phone, bio, avatar, notification preferences, security settings)
- `updateAdminProfile(input)` — update name, contact info, bio, avatar
- `updateAdminPassword(currentPassword, newPassword)` — change password
- `updateAdminNotificationPreferences(prefs)` — toggle email/push/in-app notifications
- `update2FASettings(enabled, method)` — enable/disable two-factor auth

---

## Backend Service Map

| Service | GraphQL Port | gRPC Port | Status |
|---------|-------------|-----------|--------|
| API Gateway | 3000 | — | Routes all GraphQL |
| auth-service | 3001 | 50051 | Active |
| user-service | 3002 | 50052 | Active |
| community-service | 3003 | 50053 | Active |
| event-service | 3009 | 50059 | Active |
| opportunity-service | 3010 | 50060 | Active |
| vendor-service | 3007 | 50057 | Active |
| marketplace-service | 3011 | 50062 | Active |
| post-feed-service | 3008 | 50058 | Active |
| group-service | 3013 | 50064 | Active |
| admin-service | 3006 | 50061 | Active |
| kyc-service | 3014 | 50065 | Active (needed for Registry) |
