import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  Link2,
  Building2,
  Globe,
  Users,
  CreditCard,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const countryOptions = [
  "Ghana", "Nigeria", "Kenya", "South Africa", "Ethiopia", "Tanzania",
  "Uganda", "Cameroon", "Côte d'Ivoire", "Senegal", "Germany", "France",
  "Netherlands", "Belgium", "United Kingdom", "United States",
];

const communityOptions = [
  { id: "1", name: "Ghana Community Berlin", type: "Community Organization" },
  { id: "2", name: "Nigerian Association Munich", type: "Association" },
  { id: "3", name: "African Students Network", type: "Club" },
  { id: "4", name: "Diaspora Women's Group", type: "NGO" },
];

const associationTypes = ["NGO", "Club", "Church", "Community Organization", "Other"];

interface Association {
  id: string;
  name: string;
  description: string;
  type: string;
  countriesServed: string[];
  linkedCommunities: { id: string; name: string; type: string }[];
  isPaid: boolean;
  paymentType: string;
  paymentAmount: number;
  paymentCurrency: string;
  subscriptionPeriod: string;
  memberCount: number;
  admins: { id: string; name: string; email: string; role: string }[];
  logo: string;
  joinPolicy: string;
  whoCanPost: string;
  postCount: number;
  opportunityCount: number;
  listingCount: number;
  createdAt: string;
}

const mockAssociations: Association[] = [
  {
    id: "1",
    name: "African Diaspora Network",
    description: "Connecting African communities across Europe",
    type: "NGO",
    countriesServed: ["Ghana", "Nigeria", "Germany", "France"],
    linkedCommunities: [
      { id: "1", name: "Ghana Community Berlin", type: "Community Organization" },
      { id: "2", name: "Nigerian Association Munich", type: "Association" },
    ],
    isPaid: true,
    paymentType: "Subscription",
    paymentAmount: 25,
    paymentCurrency: "EUR",
    subscriptionPeriod: "Monthly",
    memberCount: 2450,
    admins: [
      { id: "1", name: "John Mensah", email: "john@example.com", role: "Super Admin" },
      { id: "2", name: "Mary Osei", email: "mary@example.com", role: "Admin" },
    ],
    logo: "",
    joinPolicy: "Approval Required",
    whoCanPost: "Admins Only",
    postCount: 156,
    opportunityCount: 23,
    listingCount: 45,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Pan-African Youth Alliance",
    description: "Empowering young Africans worldwide",
    type: "Club",
    countriesServed: ["Kenya", "South Africa", "United Kingdom"],
    linkedCommunities: [
      { id: "3", name: "African Students Network", type: "Club" },
    ],
    isPaid: false,
    paymentType: "",
    paymentAmount: 0,
    paymentCurrency: "EUR",
    subscriptionPeriod: "",
    memberCount: 890,
    admins: [
      { id: "3", name: "Peter Kamau", email: "peter@example.com", role: "Admin" },
    ],
    logo: "",
    joinPolicy: "Open",
    whoCanPost: "Admins Only",
    postCount: 78,
    opportunityCount: 12,
    listingCount: 8,
    createdAt: "2024-03-20",
  },
  {
    id: "3",
    name: "Faith Community International",
    description: "Spiritual guidance for African diaspora",
    type: "Church",
    countriesServed: ["Ghana", "Netherlands", "Belgium"],
    linkedCommunities: [],
    isPaid: true,
    paymentType: "One-time",
    paymentAmount: 50,
    paymentCurrency: "EUR",
    subscriptionPeriod: "",
    memberCount: 1200,
    admins: [
      { id: "4", name: "Rev. Samuel Adjei", email: "samuel@example.com", role: "Super Admin" },
    ],
    logo: "",
    joinPolicy: "Approval Required",
    whoCanPost: "Admins Only",
    postCount: 234,
    opportunityCount: 5,
    listingCount: 12,
    createdAt: "2023-11-08",
  },
];

export default function Associations() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  const [associations, setAssociations] = useState<Association[]>(mockAssociations);
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [linkCommunitiesModalOpen, setLinkCommunitiesModalOpen] = useState(false);
  const [currentAssociation, setCurrentAssociation] = useState<Association | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    countriesServed: [] as string[],
    isPaid: false,
    paymentType: "",
    paymentAmount: 0,
    paymentCurrency: "EUR",
    subscriptionPeriod: "",
    joinPolicy: "Open",
    whoCanPost: "Admins Only",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      countriesServed: [],
      isPaid: false,
      paymentType: "",
      paymentAmount: 0,
      paymentCurrency: "EUR",
      subscriptionPeriod: "",
      joinPolicy: "Open",
      whoCanPost: "Admins Only",
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.type) {
      toast({
        title: t("associations.validation.requiredFields"),
        variant: "destructive",
      });
      return;
    }

    const newAssociation: Association = {
      id: Date.now().toString(),
      ...formData,
      linkedCommunities: [],
      memberCount: 0,
      admins: [],
      logo: "",
      postCount: 0,
      opportunityCount: 0,
      listingCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setAssociations([...associations, newAssociation]);
    setCreateModalOpen(false);
    resetForm();
    toast({ title: t("associations.notifications.createSuccess") });
  };

  const handleEdit = () => {
    if (!currentAssociation) return;

    setAssociations(
      associations.map((a) =>
        a.id === currentAssociation.id ? { ...currentAssociation, ...formData } : a
      )
    );
    setEditModalOpen(false);
    resetForm();
    toast({ title: t("associations.notifications.editSuccess") });
  };

  const handleDelete = () => {
    if (!currentAssociation) return;

    setAssociations(associations.filter((a) => a.id !== currentAssociation.id));
    setDeleteDialogOpen(false);
    setCurrentAssociation(null);
    toast({ title: t("associations.notifications.deleteSuccess") });
  };

  const openEditModal = (association: Association) => {
    setCurrentAssociation(association);
    setFormData({
      name: association.name,
      description: association.description,
      type: association.type,
      countriesServed: association.countriesServed,
      isPaid: association.isPaid,
      paymentType: association.paymentType,
      paymentAmount: association.paymentAmount,
      paymentCurrency: association.paymentCurrency,
      subscriptionPeriod: association.subscriptionPeriod,
      joinPolicy: association.joinPolicy,
      whoCanPost: association.whoCanPost,
    });
    setEditModalOpen(true);
  };

  const openDetailModal = (association: Association) => {
    setCurrentAssociation(association);
    setDetailModalOpen(true);
  };

  const handleExport = () => {
    toast({ title: t("associations.notifications.exportSuccess") });
  };

  const toggleCountryFilter = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  const filteredAssociations = associations
    .filter((a) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(query);
        const matchesType = a.type.toLowerCase().includes(query);
        const matchesCountry = a.countriesServed.some((c) => c.toLowerCase().includes(query));
        const matchesCommunity = a.linkedCommunities.some((c) =>
          c.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesType && !matchesCountry && !matchesCommunity) return false;
      }
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (paidFilter === "paid" && !a.isPaid) return false;
      if (paidFilter === "free" && a.isPaid) return false;
      if (selectedCountries.length > 0) {
        if (!a.countriesServed.some((c) => selectedCountries.includes(c))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount-high":
          return b.paymentAmount - a.paymentAmount;
        case "amount-low":
          return a.paymentAmount - b.paymentAmount;
        default:
          return 0;
      }
    });

  const AssociationForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label>{t("associations.form.name")} *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t("associations.form.namePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("associations.form.description")}</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t("associations.form.descriptionPlaceholder")}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("associations.form.type")} *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("associations.form.typePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {associationTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("associations.form.countriesServed")}</Label>
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background max-h-32 overflow-y-auto">
          {countryOptions.map((country) => (
            <Badge
              key={country}
              variant={formData.countriesServed.includes(country) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  countriesServed: prev.countriesServed.includes(country)
                    ? prev.countriesServed.filter((c) => c !== country)
                    : [...prev.countriesServed, country],
                }));
              }}
            >
              {country}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("associations.form.joinPolicy")}</Label>
        <Select
          value={formData.joinPolicy}
          onValueChange={(value) => setFormData({ ...formData, joinPolicy: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">{t("associations.form.joinPolicyOpen")}</SelectItem>
            <SelectItem value="Approval Required">{t("associations.form.joinPolicyApproval")}</SelectItem>
            <SelectItem value="Invite Only">{t("associations.form.joinPolicyInvite")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("associations.form.whoCanPost")}</Label>
        <Select
          value={formData.whoCanPost}
          onValueChange={(value) => setFormData({ ...formData, whoCanPost: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admins Only">{t("associations.form.adminsOnly")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t("associations.form.paidAssociation")}</Label>
          <Switch
            checked={formData.isPaid}
            onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
          />
        </div>

        {formData.isPaid && (
          <>
            <div className="space-y-2">
              <Label>{t("associations.form.paymentType")}</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("associations.form.paymentTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Subscription">{t("associations.form.subscription")}</SelectItem>
                  <SelectItem value="One-time">{t("associations.form.oneTime")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("associations.form.amount")}</Label>
                <Input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("associations.form.currency")}</Label>
                <Select
                  value={formData.paymentCurrency}
                  onValueChange={(value) => setFormData({ ...formData, paymentCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.paymentType === "Subscription" && (
              <div className="space-y-2">
                <Label>{t("associations.form.subscriptionPeriod")}</Label>
                <Select
                  value={formData.subscriptionPeriod}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionPeriod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("associations.form.subscriptionPeriodPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">{t("associations.form.monthly")}</SelectItem>
                    <SelectItem value="Quarterly">{t("associations.form.quarterly")}</SelectItem>
                    <SelectItem value="Yearly">{t("associations.form.yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("associations.title")}
          </h1>
          <p className="text-muted-foreground">{t("associations.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border text-foreground"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("associations.exportBtn")}
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("associations.createBtn")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("associations.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("associations.filters.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("associations.filters.allTypes")}</SelectItem>
                {associationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paidFilter} onValueChange={setPaidFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("associations.filters.paidStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("associations.filters.all")}</SelectItem>
                <SelectItem value="paid">{t("associations.filters.paid")}</SelectItem>
                <SelectItem value="free">{t("associations.filters.free")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("associations.filters.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">{t("associations.filters.nameAZ")}</SelectItem>
                <SelectItem value="name-desc">{t("associations.filters.nameZA")}</SelectItem>
                <SelectItem value="date-newest">{t("associations.filters.dateNewest")}</SelectItem>
                <SelectItem value="date-oldest">{t("associations.filters.dateOldest")}</SelectItem>
                <SelectItem value="amount-high">{t("associations.filters.amountHigh")}</SelectItem>
                <SelectItem value="amount-low">{t("associations.filters.amountLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCountries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCountries.map((country) => (
              <Badge key={country} variant="secondary" className="gap-1">
                {country}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleCountryFilter(country)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAssociations.length === filteredAssociations.length}
                  onCheckedChange={(checked) => {
                    setSelectedAssociations(
                      checked ? filteredAssociations.map((a) => a.id) : []
                    );
                  }}
                />
              </TableHead>
              <TableHead>{t("associations.table.name")}</TableHead>
              <TableHead>{t("associations.table.type")}</TableHead>
              <TableHead>{t("associations.table.countries")}</TableHead>
              <TableHead>{t("associations.table.communities")}</TableHead>
              <TableHead>{t("associations.table.status")}</TableHead>
              <TableHead>{t("associations.table.payment")}</TableHead>
              <TableHead>{t("associations.table.members")}</TableHead>
              <TableHead>{t("associations.table.admins")}</TableHead>
              <TableHead className="w-12">{t("associations.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssociations.map((association) => (
              <TableRow key={association.id} className="cursor-pointer hover:bg-accent/50">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedAssociations.includes(association.id)}
                    onCheckedChange={(checked) => {
                      setSelectedAssociations(
                        checked
                          ? [...selectedAssociations, association.id]
                          : selectedAssociations.filter((id) => id !== association.id)
                      );
                    }}
                  />
                </TableCell>
                <TableCell onClick={() => openDetailModal(association)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={association.logo} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {association.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{association.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {association.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{association.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {association.countriesServed.slice(0, 2).map((country) => (
                      <Badge key={country} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                    {association.countriesServed.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{association.countriesServed.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {association.linkedCommunities.length} {t("associations.table.linked")}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={association.isPaid ? "default" : "secondary"}>
                    {association.isPaid ? t("associations.filters.paid") : t("associations.filters.free")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {association.isPaid ? (
                    <span className="text-sm">
                      {association.paymentAmount} {association.paymentCurrency}
                      {association.paymentType === "Subscription" && (
                        <span className="text-muted-foreground text-xs">
                          /{association.subscriptionPeriod}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{association.memberCount.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {association.admins.slice(0, 3).map((admin) => (
                      <Avatar key={admin.id} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {admin.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {association.admins.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                        +{association.admins.length - 3}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => openDetailModal(association)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t("associations.actions.viewDetails")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(association)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t("associations.actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentAssociation(association);
                          setAdminModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t("associations.actions.manageAdmins")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentAssociation(association);
                          setLinkCommunitiesModalOpen(true);
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        {t("associations.actions.linkCommunities")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setCurrentAssociation(association);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("associations.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAssociations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {t("associations.noResults")}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("associations.createTitle")}</DialogTitle>
            <DialogDescription>{t("associations.createDescription")}</DialogDescription>
          </DialogHeader>
          <AssociationForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate}>{t("associations.createBtn")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("associations.editTitle")}</DialogTitle>
            <DialogDescription>{t("associations.editDescription")}</DialogDescription>
          </DialogHeader>
          <AssociationForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEdit}>{t("common.saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {currentAssociation?.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {currentAssociation?.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">{t("associations.tabs.basic")}</TabsTrigger>
              <TabsTrigger value="communities">{t("associations.tabs.communities")}</TabsTrigger>
              <TabsTrigger value="admins">{t("associations.tabs.admins")}</TabsTrigger>
              <TabsTrigger value="payment">{t("associations.tabs.payment")}</TabsTrigger>
              <TabsTrigger value="metrics">{t("associations.tabs.metrics")}</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="basic" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t("associations.form.type")}</Label>
                    <p className="font-medium">{currentAssociation?.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t("associations.form.joinPolicy")}</Label>
                    <p className="font-medium">{currentAssociation?.joinPolicy}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("associations.form.description")}</Label>
                  <p>{currentAssociation?.description || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("associations.form.countriesServed")}</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentAssociation?.countriesServed.map((country) => (
                      <Badge key={country} variant="secondary">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="communities" className="space-y-4 m-0">
                {currentAssociation?.linkedCommunities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {t("associations.noLinkedCommunities")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentAssociation?.linkedCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{community.name}</p>
                          <p className="text-sm text-muted-foreground">{community.type}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          {t("associations.actions.unlink")}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="admins" className="space-y-4 m-0">
                {currentAssociation?.admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{admin.role}</Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t("associations.form.paidAssociation")}</Label>
                    <p className="font-medium">
                      {currentAssociation?.isPaid ? t("common.yes") : t("common.no")}
                    </p>
                  </div>
                  {currentAssociation?.isPaid && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">{t("associations.form.paymentType")}</Label>
                        <p className="font-medium">{currentAssociation?.paymentType}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("associations.form.amount")}</Label>
                        <p className="font-medium">
                          {currentAssociation?.paymentAmount} {currentAssociation?.paymentCurrency}
                        </p>
                      </div>
                      {currentAssociation?.paymentType === "Subscription" && (
                        <div>
                          <Label className="text-muted-foreground">
                            {t("associations.form.subscriptionPeriod")}
                          </Label>
                          <p className="font-medium">{currentAssociation?.subscriptionPeriod}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {currentAssociation?.memberCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("associations.metrics.members")}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{currentAssociation?.postCount}</p>
                    <p className="text-sm text-muted-foreground">{t("associations.metrics.posts")}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {currentAssociation?.opportunityCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("associations.metrics.opportunities")}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{currentAssociation?.listingCount}</p>
                    <p className="text-sm text-muted-foreground">{t("associations.metrics.listings")}</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              {t("common.close")}
            </Button>
            <Button
              onClick={() => {
                setDetailModalOpen(false);
                if (currentAssociation) openEditModal(currentAssociation);
              }}
            >
              {t("associations.actions.edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("associations.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("associations.deleteDescription", { name: currentAssociation?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Admins Modal */}
      <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("associations.manageAdminsTitle")}</DialogTitle>
            <DialogDescription>
              {t("associations.manageAdminsDescription", { name: currentAssociation?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {currentAssociation?.admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-destructive">
                  {t("common.remove")}
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("associations.addAdmin")}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminModalOpen(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Communities Modal */}
      <Dialog open={linkCommunitiesModalOpen} onOpenChange={setLinkCommunitiesModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("associations.linkCommunitiesTitle")}</DialogTitle>
            <DialogDescription>
              {t("associations.linkCommunitiesDescription", { name: currentAssociation?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {communityOptions.map((community) => {
                const isLinked = currentAssociation?.linkedCommunities.some(
                  (c) => c.id === community.id
                );
                return (
                  <div
                    key={community.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{community.name}</p>
                      <p className="text-sm text-muted-foreground">{community.type}</p>
                    </div>
                    <Button variant={isLinked ? "destructive" : "outline"} size="sm">
                      {isLinked ? t("associations.actions.unlink") : t("associations.actions.link")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkCommunitiesModalOpen(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
