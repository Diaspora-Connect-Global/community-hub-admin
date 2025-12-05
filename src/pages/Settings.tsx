import { Save, RotateCcw, Image, Sun, Moon, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
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
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("settings.reset")}
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {t("settings.save")}
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
            <Label htmlFor="name">{t("settings.basicInfo.communityName")}</Label>
            <Input id="name" defaultValue="Ghana Community" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("settings.basicInfo.descriptionLabel")}</Label>
            <Textarea 
              id="description" 
              rows={4}
              defaultValue="A vibrant community connecting Ghanaians across the diaspora. Share opportunities, celebrate culture, and build meaningful connections."
            />
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

      {/* Language & Appearance */}
      <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
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

      {/* Membership & Moderation */}
      <Card className="animate-fade-in" style={{ animationDelay: "150ms" }}>
        <CardHeader>
          <CardTitle className="font-display">{t("settings.membership.title")}</CardTitle>
          <CardDescription>{t("settings.membership.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("settings.membership.allowOpenJoin")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.membership.allowOpenJoinHint")}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>{t("settings.membership.whoCanPost")}</Label>
            <Select defaultValue="members">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">{t("settings.membership.everyone")}</SelectItem>
                <SelectItem value="members">{t("settings.membership.membersOnly")}</SelectItem>
                <SelectItem value="admins">{t("settings.membership.adminsOnly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.membership.groupCreation")}</Label>
            <Select defaultValue="members">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">{t("settings.membership.everyone")}</SelectItem>
                <SelectItem value="members">{t("settings.membership.membersOnly")}</SelectItem>
                <SelectItem value="admins">{t("settings.membership.adminsOnly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("settings.membership.postModeration")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.membership.postModerationHint")}</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Rules & Guidelines */}
      <Card className="animate-fade-in" style={{ animationDelay: "250ms" }}>
        <CardHeader>
          <CardTitle className="font-display">{t("settings.rules.title")}</CardTitle>
          <CardDescription>{t("settings.rules.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rules">{t("settings.rules.communityRules")}</Label>
            <Textarea 
              id="rules" 
              rows={8}
              placeholder={t("settings.rules.placeholder")}
              defaultValue={`1. Be respectful and courteous to all members
2. No spam, self-promotion, or irrelevant content
3. Keep discussions on-topic and constructive
4. Protect your privacy and that of others
5. Report any violations to the admin team`}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("settings.rules.pinRules")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.rules.pinRulesHint")}</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
