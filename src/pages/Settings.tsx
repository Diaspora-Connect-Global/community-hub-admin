import { Save, RotateCcw, Image, Sun, Moon, Languages } from "lucide-react";
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Community Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your community's basic info and moderation rules.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-display">Basic Information</CardTitle>
          <CardDescription>Update your community's name, description, and branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input id="name" defaultValue="Ghana Community" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              rows={4}
              defaultValue="A vibrant community connecting Ghanaians across the diaspora. Share opportunities, celebrate culture, and build meaningful connections."
            />
          </div>
          <div className="space-y-2">
            <Label>Banner / Logo</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop an image or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x400px for banner, 200x200px for logo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Appearance */}
      <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <CardTitle className="font-display">Language & Appearance</CardTitle>
          <CardDescription>Customize language and visual preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Language
            </Label>
            <Select defaultValue="en">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">German (Deutsch)</SelectItem>
                <SelectItem value="fr">French (Français)</SelectItem>
                <SelectItem value="nl">Dutch (Nederlands)</SelectItem>
                <SelectItem value="es">Spanish (Español)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label>Theme Mode</Label>
            <div className="flex gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership & Moderation */}
      <Card className="animate-fade-in" style={{ animationDelay: "150ms" }}>
        <CardHeader>
          <CardTitle className="font-display">Membership & Moderation</CardTitle>
          <CardDescription>Control who can join and post in your community.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Open Join</Label>
              <p className="text-sm text-muted-foreground">If disabled, membership requests require admin approval.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Who Can Post</Label>
            <Select defaultValue="members">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="members">Members Only</SelectItem>
                <SelectItem value="admins">Admins Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Group Creation</Label>
            <Select defaultValue="members">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="members">Members Only</SelectItem>
                <SelectItem value="admins">Admins Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Post Moderation</Label>
              <p className="text-sm text-muted-foreground">If enabled, posts require admin approval before they're visible.</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Rules & Guidelines */}
      <Card className="animate-fade-in" style={{ animationDelay: "250ms" }}>
        <CardHeader>
          <CardTitle className="font-display">Rules & Guidelines</CardTitle>
          <CardDescription>Define community rules that members must follow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rules">Community Rules</Label>
            <Textarea 
              id="rules" 
              rows={8}
              placeholder="Enter your community rules and guidelines..."
              defaultValue={`1. Be respectful and courteous to all members
2. No spam, self-promotion, or irrelevant content
3. Keep discussions on-topic and constructive
4. Protect your privacy and that of others
5. Report any violations to the admin team`}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pin Rules</Label>
              <p className="text-sm text-muted-foreground">Display rules prominently at the top of the community.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
