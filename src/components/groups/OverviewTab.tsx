import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Group } from "@/services/graphql/groups/types";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OverviewTab({ group }: { group: Group }) {
  const ownerName =
    group.owner
      ? `${group.owner.firstName ?? ""} ${group.owner.lastName ?? ""}`.trim()
      : group.ownerName ?? group.ownerId;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-medium">About</h2>
        <p className="text-sm text-foreground whitespace-pre-line">
          {group.description?.trim() || (
            <span className="text-muted-foreground">No description provided.</span>
          )}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-medium">Details</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Group ID</dt>
            <dd className="font-mono text-xs break-all">{group.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Members</dt>
            <dd>
              {group.memberCount}
              {group.maxMembers ? ` / ${group.maxMembers}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Category</dt>
            <dd>{group.category ?? "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground mb-1">Owner</dt>
            <dd className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                {group.owner?.avatarUrl ? (
                  <AvatarImage src={group.owner.avatarUrl} alt={ownerName} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {initials(ownerName || "?")}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground">{ownerName || "Unknown"}</span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
