import { Component, ReactNode, Suspense } from "react";
import { isChunkLoadError, lazyRoute } from "@/lib/lazyRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { graphqlErrorMessage } from "@/lib/graphqlErrors";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { EventsOnlyGate } from "@/components/events/networking/EventsOnlyGate";

// Route-based code splitting — each page is loaded only when its route is visited
const Dashboard = lazyRoute(() => import("./pages/Dashboard"));
const Posts = lazyRoute(() => import("./pages/Posts"));
const Opportunities = lazyRoute(() => import("./pages/Opportunities"));
const Marketplace = lazyRoute(() => import("./pages/Marketplace"));
const Groups = lazyRoute(() => import("./pages/Groups"));
const GroupDetail = lazyRoute(() => import("./pages/GroupDetail"));
const Events = lazyRoute(() => import("./pages/Events"));
const Members = lazyRoute(() => import("./pages/Members"));
const Associations = lazyRoute(() => import("./pages/Associations"));
const Reports = lazyRoute(() => import("./pages/Reports"));
const Directory = lazyRoute(() => import("./pages/Directory"));
const Registries = lazyRoute(() => import("./pages/Registries"));
const RegistryDetail = lazyRoute(() => import("./pages/registries/RegistryDetail"));
const Cases = lazyRoute(() => import("./pages/Cases"));
const CaseDetail = lazyRoute(() => import("./pages/cases/CaseDetail"));
const SupportCaseTypes = lazyRoute(() => import("./pages/SupportCaseTypes"));
const ServiceRequests = lazyRoute(() => import("./pages/ServiceRequests"));
const ServiceRequestDetail = lazyRoute(() => import("./pages/serviceRequests/ServiceRequestDetail"));
const ServiceRequestTypes = lazyRoute(() => import("./pages/ServiceRequestTypes"));
const Resources = lazyRoute(() => import("./pages/Resources"));
const RolesAdmins = lazyRoute(() => import("./pages/RolesAdmins"));
const Settings = lazyRoute(() => import("./pages/Settings"));
const Audit = lazyRoute(() => import("./pages/Audit"));
const Profile = lazyRoute(() => import("./pages/Profile"));
const NotFound = lazyRoute(() => import("./pages/NotFound"));
const Login = lazyRoute(() => import("./pages/Login"));
const SetPassword = lazyRoute(() => import("./pages/SetPassword"));

// Module-level QueryClient so it is never recreated on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Shown while a lazy page chunk is being fetched
function PageLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

// Class component — required by React for error boundaries
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {isChunkLoadError(this.state.error)
              ? "A new version of the console is available. Reload the page."
              : graphqlErrorMessage(this.state.error, "An unexpected error occurred. Please refresh the page.")}
          </p>
          <button
            className="mt-4 text-sm underline text-primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Public: reached from the new-admin welcome email (and the older /reset link). */}
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/reset" element={<SetPassword />} />
            <Route path="/reset-password" element={<SetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EventsOnlyGate>
                    <PermissionGate>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/posts" element={<Posts />} />
                        <Route
                          path="/opportunities"
                          element={<Opportunities />}
                        />
                        <Route
                          path="/marketplace"
                          element={<Marketplace />}
                        />
                        <Route path="/groups" element={<Groups />} />
                        <Route path="/groups/:groupId" element={<GroupDetail />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/members" element={<Members />} />
                        <Route path="/members/requests" element={<Members />} />
                        <Route
                          path="/associations"
                          element={<Associations />}
                        />
                        {/* KYC verification review is platform-admin only until
                            verifications are community-scoped (see AdminSidebar). */}
                        <Route path="/registry" element={<Navigate to="/" replace />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/directory" element={<Directory />} />
                        <Route path="/registries" element={<Registries />} />
                        <Route path="/registries/:id" element={<RegistryDetail />} />
                        <Route path="/cases" element={<Cases />} />
                        <Route path="/cases/:id" element={<CaseDetail />} />
                        <Route
                          path="/support/case-types"
                          element={<SupportCaseTypes />}
                        />
                        <Route
                          path="/service-request-types"
                          element={<ServiceRequestTypes />}
                        />
                        <Route path="/resources" element={<Resources />} />
                        <Route path="/service-requests" element={<ServiceRequests />} />
                        <Route
                          path="/service-requests/:id"
                          element={<ServiceRequestDetail />}
                        />
                        <Route path="/roles-admins" element={<RolesAdmins />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/audit" element={<Audit />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    </PermissionGate>
                    </EventsOnlyGate>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
