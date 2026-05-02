import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Camera, Mail, Phone, MapPin, Globe, Linkedin, Twitter,
  Shield, Bell, Eye, EyeOff, Key, Smartphone, Monitor, LogOut, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import {
  useGetCurrentAdmin,
  useGetAdminActiveSessions,
  useUpdateAdminProfile,
  useUpdateNotificationPreferences,
  useUpdateAdminPassword,
  useAdminAvatarUpload,
  useEnableTwoFactor,
  useVerifyTwoFactor,
  useDisableTwoFactor,
} from "@/hooks/adminProfile";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Privacy settings — local-only until a backend endpoint is added.
// All values are persisted to localStorage under "community_admin_privacy".
// ---------------------------------------------------------------------------
const PRIVACY_STORAGE_KEY = "community_admin_privacy";

interface PrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showTrustScore: boolean;
  showOnlineStatus: boolean;
  activityHistory: boolean;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: "members",
  showEmail: false,
  showPhone: false,
  showLocation: true,
  showTrustScore: true,
  showOnlineStatus: true,
  activityHistory: true,
};

function loadPrivacy(): PrivacySettings {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrivacySettings) : DEFAULT_PRIVACY;
  } catch {
    return DEFAULT_PRIVACY;
  }
}

// ---------------------------------------------------------------------------
// 2FA dialog state machine
// ---------------------------------------------------------------------------
type TwoFaStep =
  | "choose-method"   // user picks APP or SMS
  | "show-qr"         // show QR code + OTP input (APP only)
  | "enter-otp"       // SMS: just enter the code
  | "disable-confirm" // confirm disable
  | "idle";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── UI toggle state ────────────────────────────────────────────────────────
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const claims = useAuthStore((s) => s.claims);
  const logout = useAuthStore((s) => s.logout);
  const emailFromToken = claims?.email ?? "";

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { profile, loading: profileLoading, fetchProfile } = useGetCurrentAdmin();
  const { sessions, loading: sessionsLoading, fetchSessions } = useGetAdminActiveSessions();
  const { loading: savingProfile, saveProfile } = useUpdateAdminProfile();
  const { loading: savingPrefs, savePreferences } = useUpdateNotificationPreferences();
  const { loading: savingPassword, changePassword } = useUpdateAdminPassword();
  const { uploading: uploadingAvatar, uploadAvatar } = useAdminAvatarUpload();
  const { loading: enabling2fa, initEnable } = useEnableTwoFactor();
  const { loading: verifying2fa, verifyCode } = useVerifyTwoFactor();
  const { loading: disabling2fa, doDisable } = useDisableTwoFactor();

  // ── File input ref ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Personal info form ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    avatarUrl: "",
    // Fields below are local-only until UpdateAdminProfileInput is extended by backend
    bio: "",
    dateOfBirth: "",
    gender: "",
    location: "",
    countryOfOrigin: "",
    website: "",
    linkedin: "",
    twitter: "",
  });

  // ── Notification preferences ───────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    quietHoursStart: "",
    quietHoursEnd: "",
    // Sub-category toggles — mapped to API fields below
    newMemberRequests: true,   // -> emailEnabled (category)
    newReports: true,          // -> pushEnabled (category)
    opportunityApps: true,     // -> smsEnabled (category, placeholder)
    weeklyDigest: false,       // local-only until backend adds this field
  });

  // ── Privacy settings (localStorage) ───────────────────────────────────────
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(loadPrivacy);

  useEffect(() => {
    // LOCAL-ONLY: persist privacy settings until a backend endpoint is added
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(privacySettings));
  }, [privacySettings]);

  // ── Password fields ────────────────────────────────────────────────────────
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── 2FA dialog ─────────────────────────────────────────────────────────────
  const [twoFaStep, setTwoFaStep] = useState<TwoFaStep>("idle");
  const [twoFaMethod, setTwoFaMethod] = useState<"APP" | "SMS">("APP");
  const [twoFaQrCode, setTwoFaQrCode] = useState<string | null>(null);
  const [twoFaOtp, setTwoFaOtp] = useState("");
  // Local override for twoFactorEnabled until next profile fetch
  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean | null>(null);

  // ── Delete account dialog ─────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    void fetchProfile();
    void fetchSessions();
  }, [fetchProfile, fetchSessions]);

  useEffect(() => {
    if (!profile) return;
    setFormData((prev) => ({
      ...prev,
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    }));
    setNotifPrefs((prev) => ({
      ...prev,
      emailEnabled: profile.notificationPreferences.emailEnabled,
      pushEnabled: profile.notificationPreferences.pushEnabled,
    }));
    setTwoFaEnabled(null); // reset local override — profile is authoritative
  }, [profile]);

  const effectiveTwoFaEnabled = twoFaEnabled ?? profile?.twoFactorEnabled ?? false;

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayEmail = profile?.email || emailFromToken || "—";

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    await saveProfile({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
      avatarUrl: formData.avatarUrl || undefined,
      // TODO: include bio, dateOfBirth, gender, location, countryOfOrigin,
      // website, linkedin, twitter once UpdateAdminProfileInput is extended
    });
  };

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset so the same file can be re-selected after removal
      e.target.value = "";
      const readUrl = await uploadAvatar(file);
      if (readUrl) {
        setFormData((prev) => ({ ...prev, avatarUrl: readUrl }));
        await saveProfile({ avatarUrl: readUrl });
      }
    },
    [uploadAvatar, saveProfile],
  );

  const handleRemovePhoto = async () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
    await saveProfile({ avatarUrl: "" });
  };

  const handlePasswordUpdate = async () => {
    setPasswordError(null);
    const { currentPassword, newPassword, confirmPassword } = passwordFields;

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      // error toast is handled by the hook
    }
  };

  const handleSaveNotifications = async () => {
    await savePreferences({
      emailEnabled: notifPrefs.emailEnabled,
      pushEnabled: notifPrefs.pushEnabled,
      smsEnabled: notifPrefs.smsEnabled,
      quietHoursStart: notifPrefs.quietHoursStart || undefined,
      quietHoursEnd: notifPrefs.quietHoursEnd || undefined,
    });
  };

  // ── 2FA flow ───────────────────────────────────────────────────────────────

  const handle2FaToggle = (checked: boolean) => {
    if (checked) {
      setTwoFaStep("choose-method");
    } else {
      setTwoFaStep("disable-confirm");
    }
  };

  const handleConfirm2FaMethod = async () => {
    const result = await initEnable(twoFaMethod);
    if (!result) return;
    if (twoFaMethod === "APP" && result.qrCode) {
      setTwoFaQrCode(result.qrCode);
      setTwoFaStep("show-qr");
    } else {
      setTwoFaStep("enter-otp");
    }
  };

  const handleVerify2FaOtp = async () => {
    const result = await verifyCode(twoFaOtp);
    if (result?.success) {
      setTwoFaEnabled(true);
      setTwoFaOtp("");
      setTwoFaQrCode(null);
      setTwoFaStep("idle");
    }
  };

  const handleDisable2Fa = async () => {
    const result = await doDisable();
    if (result?.success) {
      setTwoFaEnabled(false);
      setTwoFaStep("idle");
    }
  };

  const handleClose2FaDialog = () => {
    setTwoFaStep("idle");
    setTwoFaOtp("");
    setTwoFaQrCode(null);
  };

  // ── Download data ──────────────────────────────────────────────────────────

  const handleDownloadData = () => {
    const data = {
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: displayEmail,
        phone: formData.phone,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        location: formData.location,
        countryOfOrigin: formData.countryOfOrigin,
        website: formData.website,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        avatarUrl: formData.avatarUrl,
      },
      notificationPreferences: {
        emailEnabled: notifPrefs.emailEnabled,
        pushEnabled: notifPrefs.pushEnabled,
        smsEnabled: notifPrefs.smsEnabled,
      },
      privacySettings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Your profile data has been exported." });
  };

  // ── Delete account ─────────────────────────────────────────────────────────

  const handleDeleteAccount = () => {
    // Full account deletion requires a system admin action on the backend.
    // Here we log out the session and inform the user to contact their system admin.
    toast({
      title: "Account deletion requested",
      description: "For permanent account deletion, contact your system administrator. You are now being logged out.",
    });
    logout();
    navigate("/login");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isBusy = uploadingAvatar || savingProfile || profileLoading;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information, security, and preferences.</p>
        </div>
        <Button variant="outline" onClick={handleSaveProfile} disabled={isBusy}>
          {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {savingProfile ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="surface-subtle">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* ── Personal Information Tab ──────────────────────────────────────── */}
        <TabsContent value="personal" className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile photo. This will be visible to other community members.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profileLoading
                      ? "—"
                      : `${formData.firstName[0] ?? ""}${formData.lastName[0] ?? ""}`.toUpperCase() || "—"}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-0 right-0 p-1.5 rounded-full surface-brand text-text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  aria-label="Upload photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                  >
                    {uploadingAvatar ? "Uploading…" : "Upload New Photo"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={handleRemovePhoto}
                    disabled={isBusy || !formData.avatarUrl}
                  >
                    Remove
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal details used across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={profileLoading ? "—" : ""}
                    disabled={profileLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={profileLoading ? "—" : ""}
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profileLoading ? "" : `${formData.firstName} ${formData.lastName}`.trim()}
                  placeholder={profileLoading ? "—" : ""}
                  readOnly
                  className="bg-muted cursor-default"
                />
                <p className="text-xs text-muted-foreground">This is how your name will appear to others.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Tell us a bit about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  maxLength={200}
                  disabled={profileLoading}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/200 characters
                  {/* TODO: save bio once UpdateAdminProfileInput supports it */}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={profileLoading}
                    // TODO: save dateOfBirth once UpdateAdminProfileInput supports it
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {/* TODO: save gender once UpdateAdminProfileInput supports it */}
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                    disabled={profileLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How members and the platform can reach you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      className="pl-10 bg-muted cursor-default"
                      value={profileLoading ? "" : displayEmail}
                      readOnly
                      placeholder={profileLoading ? "—" : ""}
                    />
                  </div>
                  {displayEmail && !profileLoading && (
                    <Badge variant="outline" className="text-text-success border-border-success">Verified</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={profileLoading ? "—" : ""}
                      disabled={profileLoading}
                    />
                  </div>
                  <Button variant="outline" size="sm">Verify</Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                {/* TODO: save location once UpdateAdminProfileInput supports it */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country of Origin</Label>
                {/* TODO: save countryOfOrigin once UpdateAdminProfileInput supports it */}
                <Select
                  value={formData.countryOfOrigin}
                  onValueChange={(val) => setFormData({ ...formData, countryOfOrigin: val })}
                  disabled={profileLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ghana">Ghana</SelectItem>
                    <SelectItem value="nigeria">Nigeria</SelectItem>
                    <SelectItem value="kenya">Kenya</SelectItem>
                    <SelectItem value="south-africa">South Africa</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your social media profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TODO: save website/linkedin/twitter once UpdateAdminProfileInput supports them */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    className="pl-10"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    className="pl-10"
                    placeholder="linkedin.com/in/username"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="twitter"
                    className="pl-10"
                    placeholder="@username"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwordFields.currentPassword}
                    onChange={(e) =>
                      setPasswordFields({ ...passwordFields, currentPassword: e.target.value })
                    }
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwordFields.newPassword}
                    onChange={(e) =>
                      setPasswordFields({ ...passwordFields, newPassword: e.target.value })
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Min 8 characters, include uppercase, lowercase, number, and symbol.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordFields.confirmPassword}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, confirmPassword: e.target.value })
                  }
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <Button
                variant="outline"
                onClick={handlePasswordUpdate}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</>
                ) : (
                  "Update Password"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 surface-subtle rounded-lg">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {effectiveTwoFaEnabled
                        ? "2FA is currently enabled."
                        : "Use an authenticator app or SMS to generate codes."}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={effectiveTwoFaEnabled}
                  onCheckedChange={handle2FaToggle}
                  disabled={profileLoading || enabling2fa || disabling2fa}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 surface-subtle rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">Receive codes via email (always on)</p>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage your active sessions across devices.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <p className="text-sm text-muted-foreground">Loading sessions…</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex items-start justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 surface-subtle rounded-lg mt-0.5">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{session.device ?? "Unknown Device"}</p>
                            {session.isCurrent && (
                              <Badge variant="outline" className="text-xs text-text-success border-border-success">
                                Current
                              </Badge>
                            )}
                          </div>
                          {session.browser && (
                            <p className="text-xs text-muted-foreground">{session.browser}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {session.ipAddress ?? ""}
                            {session.location ? ` — ${session.location}` : ""}
                          </p>
                          {session.lastActive && (
                            <p className="text-xs text-muted-foreground">
                              Last active: {new Date(session.lastActive).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button variant="ghost" size="sm" className="text-destructive gap-1">
                          <LogOut className="h-3 w-3" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Choose what emails you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive platform updates and alerts via email.</p>
                </div>
                <Switch
                  checked={notifPrefs.emailEnabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...notifPrefs, emailEnabled: checked };
                    setNotifPrefs(updated);
                    void savePreferences({ emailEnabled: checked });
                  }}
                  disabled={profileLoading || savingPrefs}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Member Requests</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone requests to join your community.</p>
                </div>
                <Switch
                  checked={notifPrefs.newMemberRequests}
                  onCheckedChange={(checked) => {
                    setNotifPrefs((prev) => ({ ...prev, newMemberRequests: checked }));
                    // Mapped to emailEnabled at category level; call save with overall prefs
                    void savePreferences({ emailEnabled: notifPrefs.emailEnabled, pushEnabled: notifPrefs.pushEnabled, smsEnabled: notifPrefs.smsEnabled });
                  }}
                  disabled={profileLoading || savingPrefs}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Reports &amp; Complaints</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for new reports on your content.</p>
                </div>
                <Switch
                  checked={notifPrefs.newReports}
                  onCheckedChange={(checked) => {
                    setNotifPrefs((prev) => ({ ...prev, newReports: checked }));
                    void savePreferences({ emailEnabled: notifPrefs.emailEnabled, pushEnabled: notifPrefs.pushEnabled, smsEnabled: notifPrefs.smsEnabled });
                  }}
                  disabled={profileLoading || savingPrefs}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Opportunity Applications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone applies to your opportunities.</p>
                </div>
                <Switch
                  checked={notifPrefs.opportunityApps}
                  onCheckedChange={(checked) => {
                    setNotifPrefs((prev) => ({ ...prev, opportunityApps: checked }));
                    void savePreferences({ emailEnabled: notifPrefs.emailEnabled, pushEnabled: notifPrefs.pushEnabled, smsEnabled: checked });
                  }}
                  disabled={profileLoading || savingPrefs}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of community activity.</p>
                </div>
                {/* TODO: wire weeklyDigest to a dedicated backend field when available */}
                <Switch
                  checked={notifPrefs.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setNotifPrefs((prev) => ({ ...prev, weeklyDigest: checked }))
                  }
                  disabled={profileLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage notifications on your devices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive real-time notifications on your device.</p>
                </div>
                <Switch
                  checked={notifPrefs.pushEnabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...notifPrefs, pushEnabled: checked };
                    setNotifPrefs(updated);
                    void savePreferences({ pushEnabled: checked });
                  }}
                  disabled={profileLoading || savingPrefs}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important alerts via SMS.</p>
                </div>
                <Switch
                  checked={notifPrefs.smsEnabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...notifPrefs, smsEnabled: checked };
                    setNotifPrefs(updated);
                    void savePreferences({ smsEnabled: checked });
                  }}
                  disabled={profileLoading || savingPrefs}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Quiet Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="time"
                      value={notifPrefs.quietHoursStart}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, quietHoursStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="time"
                      value={notifPrefs.quietHoursEnd}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, quietHoursEnd: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSaveNotifications}
                disabled={savingPrefs || profileLoading}
              >
                {savingPrefs ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  "Save Notification Preferences"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy Tab ──────────────────────────────────────────────────── */}
        {/* LOCAL-ONLY: all privacy toggles are persisted to localStorage only.
            Wire to a backend endpoint once updateAdminPrivacySettings is available. */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>Control who can see your profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select
                  value={privacySettings.profileVisibility}
                  onValueChange={(val) =>
                    setPrivacySettings((prev) => ({ ...prev, profileVisibility: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="members">Members Only - Only community members</SelectItem>
                    <SelectItem value="private">Private - Only you</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">Allow other members to see your email.</p>
                </div>
                <Switch
                  checked={privacySettings.showEmail}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({ ...prev, showEmail: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Phone Number</Label>
                  <p className="text-sm text-muted-foreground">Allow other members to see your phone number.</p>
                </div>
                <Switch
                  checked={privacySettings.showPhone}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({ ...prev, showPhone: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Location</Label>
                  <p className="text-sm text-muted-foreground">Display your location on your profile.</p>
                </div>
                <Switch
                  checked={privacySettings.showLocation}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({ ...prev, showLocation: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Trust Score</Label>
                  <p className="text-sm text-muted-foreground">Display your trust score badge on your profile.</p>
                </div>
                <Switch
                  checked={privacySettings.showTrustScore}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({ ...prev, showTrustScore: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity &amp; Data</CardTitle>
              <CardDescription>Manage your activity data and account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">Let others see when you're online.</p>
                </div>
                <Switch
                  checked={privacySettings.showOnlineStatus}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({ ...prev, showOnlineStatus: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity History</Label>
                  <p className="text-sm text-muted-foreground">Allow the platform to track your activity for analytics.</p>
                </div>
                <Switch
                  checked={privacySettings.activityHistory}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({ ...prev, activityHistory: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="pt-4 space-y-3">
                <Button variant="outline" className="w-full" onClick={handleDownloadData}>
                  Download My Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── 2FA Dialog ──────────────────────────────────────────────────────── */}
      <Dialog
        open={twoFaStep !== "idle"}
        onOpenChange={(open) => { if (!open) handleClose2FaDialog(); }}
      >
        {/* Step: choose method */}
        {twoFaStep === "choose-method" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
              <DialogDescription>Choose your preferred 2FA method.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <button
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${twoFaMethod === "APP" ? "border-primary bg-primary/5" : "border-border"}`}
                onClick={() => setTwoFaMethod("APP")}
              >
                <Smartphone className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">Google Authenticator, Authy, etc.</p>
                </div>
              </button>
              <button
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${twoFaMethod === "SMS" ? "border-primary bg-primary/5" : "border-border"}`}
                onClick={() => setTwoFaMethod("SMS")}
              >
                <Phone className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">SMS</p>
                  <p className="text-xs text-muted-foreground">Receive a code via text message.</p>
                </div>
              </button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose2FaDialog}>Cancel</Button>
              <Button onClick={handleConfirm2FaMethod} disabled={enabling2fa}>
                {enabling2fa ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up…</> : "Continue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}

        {/* Step: show QR code (APP) */}
        {twoFaStep === "show-qr" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Open your authenticator app and scan the QR code below, then enter the 6-digit code to complete setup.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-2">
              {twoFaQrCode && (
                <img
                  src={`data:image/png;base64,${twoFaQrCode}`}
                  alt="2FA QR Code"
                  className="h-48 w-48 border rounded"
                />
              )}
              <div className="w-full space-y-2">
                <Label htmlFor="otpInput">Verification Code</Label>
                <Input
                  id="otpInput"
                  placeholder="Enter 6-digit code"
                  value={twoFaOtp}
                  onChange={(e) => setTwoFaOtp(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose2FaDialog}>Cancel</Button>
              <Button
                onClick={handleVerify2FaOtp}
                disabled={verifying2fa || twoFaOtp.length < 6}
              >
                {verifying2fa ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</> : "Verify & Enable"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}

        {/* Step: enter OTP (SMS) */}
        {twoFaStep === "enter-otp" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                A verification code has been sent to your registered phone number.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-2">
              <Label htmlFor="smsOtpInput">Verification Code</Label>
              <Input
                id="smsOtpInput"
                placeholder="Enter 6-digit code"
                value={twoFaOtp}
                onChange={(e) => setTwoFaOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose2FaDialog}>Cancel</Button>
              <Button
                onClick={handleVerify2FaOtp}
                disabled={verifying2fa || twoFaOtp.length < 6}
              >
                {verifying2fa ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</> : "Verify & Enable"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}

        {/* Step: disable confirmation */}
        {twoFaStep === "disable-confirm" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Are you sure you want to disable 2FA? This will make your account less secure.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose2FaDialog}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDisable2Fa}
                disabled={disabling2fa}
              >
                {disabling2fa ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Disabling…</> : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Delete Account Dialog ────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete My Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. For permanent account deletion, contact your system
              administrator. Type <strong>DELETE</strong> below to confirm you want to be logged out and
              your deletion request submitted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="deleteConfirm">Type DELETE to confirm</Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE"}
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
