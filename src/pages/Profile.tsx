import { useState, useEffect } from "react";
import { Save, Camera, Mail, Phone, MapPin, Globe, Linkedin, Twitter, Shield, Bell, Eye, EyeOff, Key, Smartphone, Monitor, LogOut } from "lucide-react";
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
import { useAuthStore } from "@/stores/authStore";
import {
  useGetCurrentAdmin,
  useGetAdminActiveSessions,
  useUpdateAdminProfile,
  useUpdateNotificationPreferences,
} from "@/hooks/adminProfile";

export default function Profile() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const claims = useAuthStore((s) => s.claims);
  const emailFromToken = claims?.email ?? "";

  const { profile, loading: profileLoading, fetchProfile } = useGetCurrentAdmin();
  const { sessions, loading: sessionsLoading, fetchSessions } = useGetAdminActiveSessions();
  const { loading: savingProfile, saveProfile } = useUpdateAdminProfile();
  const { loading: savingPrefs, savePreferences } = useUpdateNotificationPreferences();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    avatarUrl: "",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    quietHoursStart: "",
    quietHoursEnd: "",
  });

  useEffect(() => {
    void fetchProfile();
    void fetchSessions();
  }, [fetchProfile, fetchSessions]);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    });
    setNotifPrefs((prev) => ({
      ...prev,
      emailEnabled: profile.notificationPreferences.emailEnabled,
      pushEnabled: profile.notificationPreferences.pushEnabled,
    }));
  }, [profile]);

  const handleSaveProfile = async () => {
    await saveProfile({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
      avatarUrl: formData.avatarUrl || undefined,
    });
  };

  const handleSaveNotifications = async () => {
    await savePreferences(notifPrefs);
  };

  const displayEmail = profile?.email || emailFromToken || "—";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information, security, and preferences.</p>
        </div>
        <Button variant="outline" onClick={handleSaveProfile} disabled={savingProfile || profileLoading}>
          <Save className="h-4 w-4 mr-2" />
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

        {/* Personal Information Tab */}
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
                  <AvatarImage src={profile?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {profileLoading
                      ? "—"
                      : `${formData.firstName[0] ?? ""}${formData.lastName[0] ?? ""}`.toUpperCase() || "—"}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full surface-brand text-text-white hover:opacity-90 transition-opacity">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Upload New Photo</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
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
                  value={
                    profileLoading
                      ? ""
                      : `${formData.firstName} ${formData.lastName}`.trim()
                  }
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
                  defaultValue=""
                />
                <p className="text-xs text-muted-foreground">Max 200 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" defaultValue="" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select>
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
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="location" className="pl-10" defaultValue="" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country of Origin</Label>
                <Select>
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
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="website" className="pl-10" placeholder="https://yourwebsite.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="linkedin" className="pl-10" placeholder="linkedin.com/in/username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="twitter" className="pl-10" placeholder="@username" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
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
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
              </div>
              <Button variant="outline">Update Password</Button>
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
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">Use an authenticator app to generate codes</p>
                  </div>
                </div>
                <Switch
                  checked={profile?.twoFactorEnabled ?? false}
                  disabled={profileLoading}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 surface-subtle rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">Receive codes via email</p>
                  </div>
                </div>
                <Switch />
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

        {/* Notifications Tab */}
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
                  onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, emailEnabled: checked })}
                  disabled={profileLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Member Requests</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone requests to join your community.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Reports &amp; Complaints</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for new reports on your content.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Opportunity Applications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone applies to your opportunities.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of community activity.</p>
                </div>
                <Switch />
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
                  onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, pushEnabled: checked })}
                  disabled={profileLoading}
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
                  onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, smsEnabled: checked })}
                  disabled={profileLoading}
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
                {savingPrefs ? "Saving…" : "Save Notification Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>Control who can see your profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select defaultValue="members">
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
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Phone Number</Label>
                  <p className="text-sm text-muted-foreground">Allow other members to see your phone number.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Location</Label>
                  <p className="text-sm text-muted-foreground">Display your location on your profile.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Trust Score</Label>
                  <p className="text-sm text-muted-foreground">Display your trust score badge on your profile.</p>
                </div>
                <Switch />
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
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity History</Label>
                  <p className="text-sm text-muted-foreground">Allow the platform to track your activity for analytics.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="pt-4 space-y-3">
                <Button variant="outline" className="w-full">Download My Data</Button>
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
