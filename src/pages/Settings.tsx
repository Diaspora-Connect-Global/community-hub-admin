import { useCallback, useEffect, useState } from "react";
import { Save, X, Image, Sun, Moon, Languages, Globe, Mail, Phone, Link, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { getCommunity } from "@/services/graphql/community/queries";
import { updateCommunity } from "@/services/graphql/community/mutations";
import type { Community } from "@/services/graphql/community/types";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Australia", "Austria", "Bangladesh",
  "Belgium", "Benin", "Botswana", "Brazil", "Burkina Faso", "Burundi", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Côte d'Ivoire",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea",
  "Eswatini", "Ethiopia", "Finland", "France", "Gabon", "Gambia", "Germany", "Ghana", "Greece",
  "Guinea", "Guinea-Bissau", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Kenya",
  "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Mexico",
  "Morocco", "Mozambique", "Namibia", "Netherlands", "Niger", "Nigeria", "Norway", "Pakistan",
  "Poland", "Portugal", "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sudan", "Sweden", "Switzerland",
  "Tanzania", "Togo", "Tunisia", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Zambia", "Zimbabwe"
];

/** Map gateway string values to compact UI select keys */
function policyFromApi(raw: string | undefined, fallback: "admins"): "admins" | "members" | "moderators" {
  if (!raw) return fallback;
  const u = raw.toUpperCase();
  if (u.includes("ALL") && (u.includes("MEMBER") || u.includes("COMMUNITY"))) return "members";
  if (u.includes("MODERATOR")) return "moderators";
  return "admins";
}

function policyToApi(ui: string): string {
  switch (ui) {
    case "members":
      return "ALL_MEMBERS";
    case "moderators":
      return "MODERATORS_AND_ADMINS";
    default:
      return "ADMINS_ONLY";
  }
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const communityId = admin?.scopeType === "COMMUNITY" ? admin.scopeId ?? "" : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedCommunity, setLoadedCommunity] = useState<Community | null>(null);

  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [communityTypeLabel, setCommunityTypeLabel] = useState("");
  const [isEmbassyCommunity, setIsEmbassyCommunity] = useState(false);
  const [countriesServed, setCountriesServed] = useState<string[]>([]);
  const [whoCanPost, setWhoCanPost] = useState("admins");
  const [groupCreationPermission, setGroupCreationPermission] = useState("admins");
  const [postModeration, setPostModeration] = useState(true);

  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [communityRules, setCommunityRules] = useState("");

  const [embassyCountry, setEmbassyCountry] = useState("");
  const [locationCountry, setLocationCountry] = useState("");

  const applyCommunityToForm = useCallback((c: Community) => {
    setLoadedCommunity(c);
    setCommunityName(c.name ?? "");
    setDescription(c.description ?? "");
    setCommunityTypeLabel(c.communityType?.name ?? "");
    setIsEmbassyCommunity(Boolean(c.communityType?.isEmbassy));
    setCountriesServed(c.countriesServed?.length ? [...c.countriesServed] : []);
    setWhoCanPost(policyFromApi(c.whoCanPost, "admins"));
    setGroupCreationPermission(policyFromApi(c.groupCreationPermission ?? c.whoCanPost, "admins"));
    setContactEmail(c.contactEmail ?? "");
    setWebsite(c.website ?? "");
    setCommunityRules(c.communityRules ?? "");
    setAddress("");
    setContactPhone("");
    setEmbassyCountry("");
    setLocationCountry("");
  }, []);

  const loadCommunity = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const c = await getCommunity(communityId);
      applyCommunityToForm(c);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  }, [communityId, applyCommunityToForm]);

  useEffect(() => {
    void loadCommunity();
  }, [loadCommunity]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleAddCountry = (country: string) => {
    if (country && !countriesServed.includes(country)) {
      setCountriesServed([...countriesServed, country]);
    }
  };

  const handleRemoveCountry = (country: string) => {
    setCountriesServed(countriesServed.filter((c) => c !== country));
  };

  const emailSchema = z.string().email().optional().or(z.literal(""));
  const urlSchema = z.string().url().optional().or(z.literal(""));

  const handleSave = async () => {
    if (!communityId) {
      toast.error("No community scope — cannot save.");
      return;
    }
    if (!communityName.trim()) {
      toast.error(t("settings.validation.communityNameRequired"));
      return;
    }
    if (countriesServed.length === 0) {
      toast.error(t("settings.validation.countriesRequired"));
      return;
    }
    if (isEmbassyCommunity) {
      if (!locationCountry.trim()) {
        toast.error(t("settings.validation.locationCountryRequired"));
        return;
      }
    }

    if (contactEmail) {
      const emailResult = emailSchema.safeParse(contactEmail);
      if (!emailResult.success) {
        toast.error(t("settings.validation.invalidEmail"));
        return;
      }
    }

    if (website) {
      const urlResult = urlSchema.safeParse(website);
      if (!urlResult.success) {
        toast.error(t("settings.validation.invalidWebsite"));
        return;
      }
    }

    setSaving(true);
    try {
      let rulesPayload = communityRules;
      if (address.trim() || contactPhone.trim()) {
        const extra = [address.trim() && `Address: ${address.trim()}`, contactPhone.trim() && `Phone: ${contactPhone.trim()}`]
          .filter(Boolean)
          .join("\n");
        rulesPayload = [communityRules.trim(), extra].filter(Boolean).join("\n\n");
      }

      await updateCommunity({
        communityId,
        name: communityName.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        communityRules: rulesPayload.trim() || undefined,
        whoCanPost: policyToApi(whoCanPost),
        groupCreationPermission: policyToApi(groupCreationPermission),
        countriesServed,
        locationCountry: isEmbassyCommunity ? locationCountry.trim() || undefined : undefined,
      });
      toast.success(t("settings.notifications.saveSuccess"));
      await loadCommunity();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (loadedCommunity) {
      applyCommunityToForm(loadedCommunity);
    } else {
      setCommunityName("");
      setDescription("");
      setCountriesServed([]);
      setWhoCanPost("admins");
      setGroupCreationPermission("admins");
      setPostModeration(true);
      setAddress("");
      setContactEmail("");
      setContactPhone("");
      setWebsite("");
      setCommunityRules("");
      setEmbassyCountry("");
      setLocationCountry("");
    }
  };

  if (!communityId) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Community scope required</AlertTitle>
          <AlertDescription>
            Sign in with a community admin account (COMMUNITY scope) to load and edit community settings from the API.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading community…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load community</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void loadCommunity()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t("settings.saveChanges")}
          </Button>
        </div>
      </div>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-display">{t("settings.basicInfo.title")}</CardTitle>
          <CardDescription>{t("settings.basicInfo.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("settings.basicInfo.communityName")} *</Label>
            <Input
              id="name"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder={t("settings.basicInfo.communityNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("settings.basicInfo.descriptionLabel")}</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("settings.basicInfo.descriptionPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.communityType")}</Label>
            {communityTypeLabel ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{communityTypeLabel}</Badge>
                <span className="text-xs text-muted-foreground">Type is assigned by the platform.</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.countriesServed")} *</Label>
            <Select onValueChange={handleAddCountry}>
              <SelectTrigger>
                <SelectValue placeholder={t("settings.basicInfo.selectCountries")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.filter((c) => !countriesServed.includes(c)).map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {countriesServed.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {countriesServed.map((country) => (
                  <Badge
                    key={country}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveCountry(country)}
                  >
                    {country} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.whoCanPost")} *</Label>
            <Select value={whoCanPost} onValueChange={setWhoCanPost}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admins">{t("settings.membership.adminsOnly")}</SelectItem>
                <SelectItem value="members">All members</SelectItem>
                <SelectItem value="moderators">Moderators and admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.groupCreationPermission")} *</Label>
            <Select value={groupCreationPermission} onValueChange={setGroupCreationPermission}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admins">{t("settings.membership.adminsOnly")}</SelectItem>
                <SelectItem value="members">All members</SelectItem>
                <SelectItem value="moderators">Moderators and admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("settings.basicInfo.postModeration")} *</Label>
              <p className="text-sm text-muted-foreground">{t("settings.basicInfo.postModerationHint")}</p>
            </div>
            <Switch checked={postModeration} onCheckedChange={setPostModeration} />
          </div>
          <p className="text-xs text-muted-foreground">
            Post moderation preferences may require matching configuration in the post service; this toggle is local to the admin UI until wired to the API.
          </p>
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.bannerLogo")}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer opacity-60">
              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("settings.basicInfo.uploadHint")}</p>
              <p className="text-xs text-muted-foreground mt-1">Use presigned URL flows (getCommunityAvatarUploadUrl / getCommunityCoverUploadUrl) to connect uploads.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t("settings.contact.title")}
          </CardTitle>
          <CardDescription>{t("settings.contact.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEmbassyCommunity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("settings.embassy.embassyCountry")}
                </Label>
                <Select value={embassyCountry} onValueChange={setEmbassyCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.embassy.selectEmbassyCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("settings.embassy.locationCountry")} *
                </Label>
                <Select value={locationCountry} onValueChange={setLocationCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.embassy.selectLocationCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {isEmbassyCommunity && <Separator />}
          <div className="space-y-2">
            <Label htmlFor="rules">Community rules</Label>
            <Textarea
              id="rules"
              rows={3}
              value={communityRules}
              onChange={(e) => setCommunityRules(e.target.value)}
              placeholder="Guidelines for members…"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("settings.contact.address")}
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("settings.contact.addressPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              Address and phone are appended to community rules on save until dedicated API fields exist.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("settings.contact.email")}
              </Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t("settings.contact.emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t("settings.contact.phone")}
              </Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder={t("settings.contact.phonePlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              {t("settings.contact.website")}
            </Label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t("settings.contact.websitePlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <CardTitle className="font-display">{t("settings.appearance.title")}</CardTitle>
          <CardDescription>{t("settings.appearance.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {t("settings.appearance.language")}
            </Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("languages.en")}</SelectItem>
                <SelectItem value="de">{t("languages.de")}</SelectItem>
                <SelectItem value="fr">{t("languages.fr")}</SelectItem>
                <SelectItem value="nl">{t("languages.nl")}</SelectItem>
                <SelectItem value="es">{t("languages.es")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label>{t("settings.appearance.themeMode")}</Label>
            <div className="flex gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                {t("settings.appearance.light")}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                {t("settings.appearance.dark")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
