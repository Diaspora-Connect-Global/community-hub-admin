/**
 * EventFormModal — handles both "Create" and "Edit" modes.
 *
 * Mode is controlled by the `mode` prop:
 *   - "create": renders "Create Event" dialog; submits via onSubmit(form)
 *   - "edit":   renders "Edit Event" dialog; submits via onSubmit(form)
 *
 * The parent owns the form state and passes it down via `form` / `onChange`.
 */
import {
  Building,
  MapPin,
  Users,
  DollarSign,
  MessageSquare,
  Plus,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import type { EventFormState } from "@/pages/events/types";
import { EVENT_CATEGORIES } from "@/pages/events/types";

const FORM_CATEGORIES = EVENT_CATEGORIES.filter((c) => c !== "All Categories");

interface EventFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  form: EventFormState;
  submitting: boolean;
  onChange: (form: EventFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function EventFormModal({
  mode,
  open,
  form,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: EventFormModalProps) {
  // Field prefix to avoid id collisions between create/edit instances
  const p = mode === "create" ? "create" : "edit";

  const set = (patch: Partial<EventFormState>) => onChange({ ...form, ...patch });

  const idPrefix = (field: string) => `${p}-${field}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create" ? "Create Event" : "Edit Event"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new community event."
              : "Make changes to your event."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ----------------------------------------------------------------
              Basic Information
          ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor={idPrefix("title")}>
                  Event Name {mode === "create" && "*"}
                </Label>
                <Input
                  id={idPrefix("title")}
                  placeholder="Enter event name..."
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={idPrefix("description")}>
                  Description {mode === "create" && "*"}
                </Label>
                <Textarea
                  id={idPrefix("description")}
                  placeholder="Describe your event..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category {mode === "create" && "*"}</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => set({ category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Event Banner {mode === "create" && "*"}</Label>
                  <ImageUpload
                    value={form.banner}
                    onChange={(v) => set({ banner: v })}
                    previewClassName="w-full h-32 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ----------------------------------------------------------------
              Location & Schedule
          ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location &amp; Schedule
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label>Event Type {mode === "create" && "*"}</Label>
                <RadioGroup
                  value={form.eventType}
                  onValueChange={(v) =>
                    set({ eventType: v as "Physical" | "Online" })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Physical"
                      id={idPrefix("physical")}
                    />
                    <Label
                      htmlFor={idPrefix("physical")}
                      className="cursor-pointer"
                    >
                      Physical
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Online" id={idPrefix("online")} />
                    <Label
                      htmlFor={idPrefix("online")}
                      className="cursor-pointer"
                    >
                      Online
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {form.eventType === "Physical" ? (
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("venue")}>
                    Venue {mode === "create" && "*"}
                  </Label>
                  <Input
                    id={idPrefix("venue")}
                    placeholder="Enter venue address..."
                    value={form.venue}
                    onChange={(e) => set({ venue: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("onlineLink")}>
                    Online Event Link {mode === "create" && "*"}
                  </Label>
                  <Input
                    id={idPrefix("onlineLink")}
                    placeholder="https://zoom.us/j/..."
                    value={form.onlineLink}
                    onChange={(e) => set({ onlineLink: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("startDateTime")}>
                    Start Date &amp; Time {mode === "create" && "*"}
                  </Label>
                  <Input
                    id={idPrefix("startDateTime")}
                    type="datetime-local"
                    value={form.startDateTime}
                    onChange={(e) => set({ startDateTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("endDateTime")}>
                    End Date &amp; Time {mode === "create" && "*"}
                  </Label>
                  <Input
                    id={idPrefix("endDateTime")}
                    type="datetime-local"
                    value={form.endDateTime}
                    onChange={(e) => set({ endDateTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ----------------------------------------------------------------
              Capacity Management
          ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacity Management
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label>Participant Limit</Label>
                <RadioGroup
                  value={form.participantLimit}
                  onValueChange={(v) =>
                    set({
                      participantLimit: v as "Unlimited" | "Set Limit",
                    })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Unlimited"
                      id={idPrefix("unlimited")}
                    />
                    <Label
                      htmlFor={idPrefix("unlimited")}
                      className="cursor-pointer"
                    >
                      Unlimited
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Set Limit"
                      id={idPrefix("setLimit")}
                    />
                    <Label
                      htmlFor={idPrefix("setLimit")}
                      className="cursor-pointer"
                    >
                      Set Limit
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {form.participantLimit === "Set Limit" && (
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("maxParticipants")}>
                    Maximum Participants {mode === "create" && "*"}
                  </Label>
                  <Input
                    id={idPrefix("maxParticipants")}
                    type="number"
                    min={1}
                    value={form.maxParticipants}
                    onChange={(e) =>
                      set({ maxParticipants: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ----------------------------------------------------------------
              Ticketing
          ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ticketing (Free or Paid)
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label>Event Pricing Type</Label>
                <RadioGroup
                  value={form.pricingType}
                  onValueChange={(v) =>
                    set({ pricingType: v as "Free" | "Paid" })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Free" id={idPrefix("free")} />
                    <Label
                      htmlFor={idPrefix("free")}
                      className="cursor-pointer"
                    >
                      Free
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Paid" id={idPrefix("paid")} />
                    <Label
                      htmlFor={idPrefix("paid")}
                      className="cursor-pointer"
                    >
                      Paid
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {form.pricingType === "Paid" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>
                        Ticket Categories {mode === "create" && "*"}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          set({
                            ticketCategories: [
                              ...form.ticketCategories,
                              {
                                id: `TC${Date.now()}`,
                                name: "",
                                price: 0,
                                description: "",
                              },
                            ],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Category
                      </Button>
                    </div>

                    {form.ticketCategories.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No ticket categories added yet. Click "Add Category" to
                        create one.
                      </p>
                    )}

                    {form.ticketCategories.map((category, index) => (
                      <div
                        key={category.id}
                        className="p-3 border border-border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Category {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              set({
                                ticketCategories:
                                  form.ticketCategories.filter(
                                    (_, i) => i !== index,
                                  ),
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              placeholder="e.g., VIP, Regular"
                              value={category.name}
                              onChange={(e) => {
                                const updated = [...form.ticketCategories];
                                updated[index] = {
                                  ...updated[index],
                                  name: e.target.value,
                                };
                                set({ ticketCategories: updated });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price (USD)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                              value={category.price}
                              onChange={(e) => {
                                const updated = [...form.ticketCategories];
                                updated[index] = {
                                  ...updated[index],
                                  price: parseFloat(e.target.value) || 0,
                                };
                                set({ ticketCategories: updated });
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">
                            Description (optional)
                          </Label>
                          <Input
                            placeholder="Brief description of this ticket type"
                            value={category.description ?? ""}
                            onChange={(e) => {
                              const updated = [...form.ticketCategories];
                              updated[index] = {
                                ...updated[index],
                                description: e.target.value,
                              };
                              set({ ticketCategories: updated });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Refund Policy {mode === "create" && "*"}</Label>
                    <Select
                      value={form.refundPolicy}
                      onValueChange={(v) => set({ refundPolicy: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No refunds">No refunds</SelectItem>
                        <SelectItem value="Full refund before event start">
                          Full refund before event start
                        </SelectItem>
                        <SelectItem value="Partial refund before event start">
                          Partial refund before event start
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------
              Group Creation — only shown in create mode (edit form omits it
              because the original edit dialog did not include this section)
          ---------------------------------------------------------------- */}
          {mode === "create" && (
            <>
              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Group Creation Option
                </h3>
                <div className="space-y-4 pl-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={idPrefix("createGroup")}>
                      Automatically Create Event Group Chat?
                    </Label>
                    <Switch
                      id={idPrefix("createGroup")}
                      checked={form.createGroup}
                      onCheckedChange={(v) => set({ createGroup: v })}
                    />
                  </div>
                  {form.createGroup && (
                    <div className="space-y-2">
                      <Label htmlFor={idPrefix("groupName")}>
                        Group Name *
                      </Label>
                      <Input
                        id={idPrefix("groupName")}
                        placeholder="Enter group name..."
                        value={form.groupName}
                        onChange={(e) => set({ groupName: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : mode === "create" ? (
              <Send className="h-4 w-4 mr-2" />
            ) : null}
            {mode === "create" ? "Create & Publish" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
