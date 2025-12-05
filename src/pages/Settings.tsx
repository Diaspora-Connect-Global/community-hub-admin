import { useState } from "react";
import { Save, X, Image, Sun, Moon, Languages, Globe, Mail, Phone, Link, MapPin } from "lucide-react";
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
import { useTheme } from "next-themes";
import { toast } from "sonner";

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

const COMMUNITY_TYPES = ["Embassy", "NGO", "Church", "Association", "Club", "Other"];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  // Form state
  const [communityName, setCommunityName] = useState("Ghana Community");
  const [description, setDescription] = useState("A vibrant community connecting Ghanaians across the diaspora. Share opportunities, celebrate culture, and build meaningful connections.");
  const [communityType, setCommunityType] = useState<string>("");
  const [countriesServed, setCountriesServed] = useState<string[]>([]);
  const [whoCanPost, setWhoCanPost] = useState("admins");
  const [groupCreationPermission, setGroupCreationPermission] = useState("admins");
  const [postModeration, setPostModeration] = useState(true);

  // Contact fields (for all community types)
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Embassy-specific fields
  const [embassyCountry, setEmbassyCountry] = useState("");
  const [locationCountry, setLocationCountry] = useState("");

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
    setCountriesServed(countriesServed.filter(c => c !== country));
  };

  const handleSave = () => {
    if (!communityName.trim()) {
      toast.error(t("settings.validation.communityNameRequired"));
      return;
    }
    if (!communityType) {
      toast.error(t("settings.validation.communityTypeRequired"));
      return;
    }
    if (countriesServed.length === 0) {
      toast.error(t("settings.validation.countriesRequired"));
      return;
    }
    if (communityType === "Embassy") {
      if (!embassyCountry) {
        toast.error(t("settings.validation.embassyCountryRequired"));
        return;
      }
      if (!locationCountry) {
        toast.error(t("settings.validation.locationCountryRequired"));
        return;
      }
    }
    toast.success(t("settings.notifications.saveSuccess"));
  };

  const handleCancel = () => {
    // Reset form to defaults
    setCommunityName("Ghana Community");
    setDescription("A vibrant community connecting Ghanaians across the diaspora.");
    setCommunityType("");
    setCountriesServed([]);
    setWhoCanPost("admins");
    setGroupCreationPermission("admins");
    setPostModeration(true);
    setAddress("");
    setContactEmail("");
    setContactPhone("");
    setWebsite("");
    setEmbassyCountry("");
    setLocationCountry("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            {t("common.cancel")}
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {t("settings.saveChanges")}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
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
            <Label>{t("settings.basicInfo.communityType")} *</Label>
            <Select value={communityType} onValueChange={setCommunityType}>
              <SelectTrigger>
                <SelectValue placeholder={t("settings.basicInfo.selectCommunityType")} />
              </SelectTrigger>
              <SelectContent>
                {COMMUNITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`settings.communityTypes.${type.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.countriesServed")} *</Label>
            <Select onValueChange={handleAddCountry}>
              <SelectTrigger>
                <SelectValue placeholder={t("settings.basicInfo.selectCountries")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.filter(c => !countriesServed.includes(c)).map((country) => (
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
          <div className="space-y-2">
            <Label>{t("settings.basicInfo.bannerLogo")}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("settings.basicInfo.uploadHint")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("settings.basicInfo.uploadRecommended")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information - For all community types */}
      <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t("settings.contact.title")}
          </CardTitle>
          <CardDescription>{t("settings.contact.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Embassy-specific fields - only show for Embassy type */}
          {communityType === "Embassy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("settings.embassy.embassyCountry")} *
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
          {communityType === "Embassy" && <Separator />}
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

      {/* Language & Appearance */}
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
