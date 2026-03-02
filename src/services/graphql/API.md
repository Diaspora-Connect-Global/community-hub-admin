# GraphQL API Reference — Community Hub Admin

This doc lists **queries** and **mutations** implemented in this app, where they live, and how to call them.

**Auth:** All opportunity operations use `graphqlRequestWithAuth()`, which sends the admin JWT and, on 401, refreshes the session and retries once. Tokens are stored in the Zustand auth store (sessionStorage).

---

## 1. Authentication

**Module:** `@/services/graphql/authentication/`  
**Auth:** Login and refresh are unauthenticated (no Bearer token); refresh sends the refresh token in the mutation input.

### Mutation: `adminLogin`

| Item | Details |
|------|--------|
| **Function** | `adminLoginMutation(input)` from `adminLogin.ts` |
| **Usage** | Use `login()` from `@/services/authentication/adminAuthService` (calls this and updates store). |
| **Input** | `AdminLoginInput`: `{ email: string, password: string }` |
| **Returns** | `AdminLoginResponse`: `success`, `message`, `error`, `accessToken`, `refreshToken`, `admin` (id, userId, scopeType, scopeId, isActive, role) |

### Mutation: `adminRefreshToken`

| Item | Details |
|------|--------|
| **Function** | `adminRefreshTokenMutation(input)` from `adminRefreshToken.ts` |
| **Usage** | Prefer `refreshSession()` from the auth service (uses store and updates it). |
| **Input** | `AdminRefreshTokenInput`: `{ refreshToken: string }` |
| **Returns** | `AdminRefreshTokenResponse`: `success`, `message`, `error`, `accessToken`, `refreshToken` |

**Auth service helpers:**

| Function | Description |
|----------|-------------|
| `login(input)` | Login; stores tokens and admin in sessionStorage via Zustand. |
| `refreshSession()` | Uses stored refresh token to get new access/refresh tokens; updates store. Returns `false` and clears auth if refresh fails. |
| `graphqlRequestWithAuth(query, variables)` | Runs a GraphQL request with current access token. On 401, calls `refreshSession()` and retries once. Use for all admin-scoped operations. |
| `logout()` | Clears tokens and admin from store and sessionStorage. |

---

## 2. Opportunities (Community Admin)

**Module:** `@/services/graphql/opportunities`  
**Auth:** All functions use `graphqlRequestWithAuth()` (auto refresh on 401).

### Queries

| Operation | Function | Input | Returns |
|-----------|----------|--------|--------|
| **Get single opportunity** | `getOpportunity(id)` | `id: string` | `Promise<OpportunityType \| null>` |
| **List / search opportunities** | `listOpportunities(input?)` | `ListOpportunitiesInput` (optional): `limit`, `offset`, `searchTerm`, `type`, `category`, `subCategory`, `workMode`, `engagementType`, `location`, `ownerType`, `ownerId`, `status`, `sortBy`, `sortOrder` | `Promise<OpportunityListResponse>` (`opportunities`, `total`) |
| **Applications for an opportunity** | `getApplications(input)` | `GetApplicationsInput`: `opportunityId: string`, `limit?`, `offset?`, `status?` | `Promise<ApplicationListResponse>` (`applications`, `total`) |
| **Get single application** | `getApplication(id)` | `id: string` | `Promise<ApplicationType \| null>` |

### Mutations

| Operation | Function | Input | Returns |
|-----------|----------|--------|--------|
| **Create opportunity** | `createOpportunity(input)` | `CreateOpportunityInput`: `ownerType`, `ownerId`, `type`, `category`, `title`, `description`, `visibility`, `applicationMethod`, plus optional `responsibilities`, `requirements`, `workMode`, `engagementType`, `location`, `externalLink`, `applicationEmail`, `salaryMin`, `salaryMax`, `salaryCurrency`, `deadline`, `subCategory`, `skills`, `tags` | `Promise<CreateOpportunityResponse>` (`id`, `title`, `status`, `createdAt`). New opportunity is `DRAFT`. |
| **Update opportunity** | `updateOpportunity(id, input)` | `id: string`, `UpdateOpportunityInput` (all optional): `title`, `description`, `responsibilities`, `requirements`, `workMode`, `engagementType`, `location`, `salaryMin`, `salaryMax`, `salaryCurrency`, `deadline`, `subCategory`, `skills`, `tags` | `Promise<boolean>` |
| **Publish opportunity** | `publishOpportunity(id)` | `id: string` | `Promise<boolean>` (DRAFT → PUBLISHED) |
| **Close opportunity** | `closeOpportunity(id, reason?)` | `id: string`, `reason?: string` | `Promise<boolean>` |
| **Delete opportunity** | `deleteOpportunity(id)` | `id: string` | `Promise<boolean>` |
| **Review application** | `reviewApplication(input)` | `ReviewApplicationInput`: `applicationId: string`, `reviewNotes?`, `status?` | `Promise<boolean>` |
| **Accept application** | `acceptApplication(id)` | `id: string` (application ID) | `Promise<boolean>` |
| **Reject application** | `rejectApplication(id, reason?)` | `id: string`, `reason?: string` | `Promise<boolean>` |

---

## 3. Imports

```ts
// Auth
import {
  login,
  logout,
  refreshSession,
  graphqlRequestWithAuth,
  getAccessToken,
  useAuthStore,
} from "@/services/authentication/adminAuthService";

// Opportunities — queries
import {
  getOpportunity,
  listOpportunities,
  getApplications,
  getApplication,
} from "@/services/graphql/opportunities";

// Opportunities — mutations
import {
  createOpportunity,
  updateOpportunity,
  publishOpportunity,
  closeOpportunity,
  deleteOpportunity,
  reviewApplication,
  acceptApplication,
  rejectApplication,
} from "@/services/graphql/opportunities";

// Types and inputs
import type {
  OpportunityType,
  ApplicationType,
  OpportunityListResponse,
  ApplicationListResponse,
  ListOpportunitiesInput,
  GetApplicationsInput,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  ReviewApplicationInput,
} from "@/services/graphql/opportunities";
```

---

## 4. Not implemented in this app

- **Auth:** No “me” or current-admin query; login and refresh are implemented.
- **Opportunities:** `setOpportunityPriority` (system admin only), and user-facing operations (`submitApplication`, `withdrawApplication`, `saveOpportunity`, `unsaveOpportunity`, `getOpportunityFeed`, `userApplications`, `getSavedOpportunities`) are not in this admin codebase.
