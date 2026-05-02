import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentAdmin,
  getAdminActiveSessions,
  updateAdminProfile,
  updateNotificationPreferences,
} from "@/services/graphql/admin-management/profile";
import type {
  AdminProfile,
  AdminSession,
  UpdateAdminProfileInput,
  UpdateNotificationPreferencesInput,
} from "@/services/graphql/admin-management/profile";

export const useGetCurrentAdmin = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentAdmin();
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch profile";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { profile, loading, error, fetchProfile };
};

export const useGetAdminActiveSessions = () => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminActiveSessions();
      setSessions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch sessions";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { sessions, loading, error, fetchSessions };
};

export const useUpdateAdminProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const saveProfile = useCallback(
    async (input: UpdateAdminProfileInput) => {
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

export const useUpdateNotificationPreferences = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const savePreferences = useCallback(
    async (input: UpdateNotificationPreferencesInput) => {
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
