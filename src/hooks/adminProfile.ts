import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentAdmin,
  getAdminActiveSessions,
  updateAdminProfile,
  updateNotificationPreferences,
  updateAdminPassword,
  requestAdminAvatarUploadUrl,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
} from "@/services/graphql/admin-management/profile";
import type {
  AdminProfile,
  AdminSession,
  UpdateAdminProfileInput,
  UpdateNotificationPreferencesInput,
  AdminAvatarUploadUrlResponse,
  TwoFactorResponse,
  VerifyTwoFactorResponse,
} from "@/services/graphql/admin-management/profile";
import type { AdminCommonResponse } from "@/services/graphql/admin-management/types";

// ── Read hooks ────────────────────────────────────────────────────────────────

export interface UseGetCurrentAdminResult {
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
  /** Imperatively re-fetches the profile. Alias for React Query's refetch. */
  fetchProfile: () => void;
}

export const useGetCurrentAdmin = (): UseGetCurrentAdminResult => {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-profile", "current"],
    queryFn: async (): Promise<AdminProfile> => getCurrentAdmin(),
    staleTime: 30_000,
  });

  return {
    profile: data ?? null,
    loading: isFetching,
    error: error?.message ?? null,
    fetchProfile: () => void refetch(),
  };
};

export interface UseGetAdminActiveSessionsResult {
  sessions: AdminSession[];
  loading: boolean;
  error: string | null;
  /** Imperatively re-fetches active sessions. Alias for React Query's refetch. */
  fetchSessions: () => void;
}

export const useGetAdminActiveSessions = (): UseGetAdminActiveSessionsResult => {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-active-sessions"],
    queryFn: async (): Promise<AdminSession[]> => getAdminActiveSessions(),
    staleTime: 30_000,
  });

  return {
    sessions: data ?? [],
    loading: isFetching,
    error: error?.message ?? null,
    fetchSessions: () => void refetch(),
  };
};

// ── Mutation hooks ────────────────────────────────────────────────────────────
// These remain imperative (useState + useCallback) because they are write
// operations with success toasts; they are not candidates for useQuery.

export interface UseUpdateAdminProfileResult {
  loading: boolean;
  error: string | null;
  saveProfile: (input: UpdateAdminProfileInput) => Promise<AdminCommonResponse>;
}

export const useUpdateAdminProfile = (): UseUpdateAdminProfileResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const saveProfile = useCallback(
    async (input: UpdateAdminProfileInput): Promise<AdminCommonResponse> => {
      setLoading(true);
      setError(null);
      try {
        const result = await updateAdminProfile(input);
        if (result.success) {
          toast({ title: "Success", description: result.message || "Profile updated" });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { loading, error, saveProfile };
};

export interface UseUpdateNotificationPreferencesResult {
  loading: boolean;
  error: string | null;
  savePreferences: (
    input: UpdateNotificationPreferencesInput,
  ) => Promise<AdminCommonResponse>;
}

export const useUpdateNotificationPreferences =
  (): UseUpdateNotificationPreferencesResult => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const savePreferences = useCallback(
      async (
        input: UpdateNotificationPreferencesInput,
      ): Promise<AdminCommonResponse> => {
        setLoading(true);
        setError(null);
        try {
          const result = await updateNotificationPreferences(input);
          if (result.success) {
            toast({
              title: "Success",
              description: result.message || "Notification preferences saved",
            });
          }
          return result;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to save notification preferences";
          setError(message);
          toast({ title: "Error", description: message, variant: "destructive" });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [toast],
    );

    return { loading, error, savePreferences };
  };

// ── Password ──────────────────────────────────────────────────────────────────

export interface UseUpdateAdminPasswordResult {
  loading: boolean;
  error: string | null;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AdminCommonResponse>;
}

export const useUpdateAdminPassword = (): UseUpdateAdminPasswordResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AdminCommonResponse> => {
      setLoading(true);
      setError(null);
      try {
        const result = await updateAdminPassword(currentPassword, newPassword);
        if (result.success) {
          toast({ title: "Success", description: result.message || "Password updated successfully" });
        } else {
          const msg = result.message || "Failed to update password";
          setError(msg);
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update password";
        setError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { loading, error, changePassword };
};

// ── Avatar upload ─────────────────────────────────────────────────────────────

export interface UseAdminAvatarUploadResult {
  uploading: boolean;
  error: string | null;
  uploadAvatar: (file: File) => Promise<string | null>;
}

export const useAdminAvatarUpload = (): UseAdminAvatarUploadResult => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadAvatar = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      setError(null);
      try {
        const { uploadUrl, readUrl }: AdminAvatarUploadUrlResponse =
          await requestAdminAvatarUploadUrl(file.name, file.type);
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.statusText}`);
        }
        return readUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload photo";
        setError(message);
        toast({ title: "Upload failed", description: message, variant: "destructive" });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [toast],
  );

  return { uploading, error, uploadAvatar };
};

// ── 2FA ───────────────────────────────────────────────────────────────────────

export interface UseEnableTwoFactorResult {
  loading: boolean;
  error: string | null;
  initEnable: (method: "APP" | "SMS") => Promise<TwoFactorResponse | null>;
}

export const useEnableTwoFactor = (): UseEnableTwoFactorResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const initEnable = useCallback(
    async (method: "APP" | "SMS"): Promise<TwoFactorResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await enableTwoFactor(method);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to enable 2FA";
        setError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { loading, error, initEnable };
};

export interface UseVerifyTwoFactorResult {
  loading: boolean;
  error: string | null;
  verifyCode: (code: string) => Promise<VerifyTwoFactorResponse | null>;
}

export const useVerifyTwoFactor = (): UseVerifyTwoFactorResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const verifyCode = useCallback(
    async (code: string): Promise<VerifyTwoFactorResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await verifyTwoFactor(code);
        if (result.success) {
          toast({ title: "2FA enabled", description: "Two-factor authentication is now active." });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to verify code";
        setError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { loading, error, verifyCode };
};

export interface UseDisableTwoFactorResult {
  loading: boolean;
  error: string | null;
  doDisable: () => Promise<AdminCommonResponse | null>;
}

export const useDisableTwoFactor = (): UseDisableTwoFactorResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const doDisable = useCallback(async (): Promise<AdminCommonResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await disableTwoFactor();
      if (result.success) {
        toast({ title: "2FA disabled", description: "Two-factor authentication has been disabled." });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disable 2FA";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { loading, error, doDisable };
};
