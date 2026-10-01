import { Check, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Badge,
  Callout,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { relative } from "@/lib/format";
import { roles } from "@/mocks";
import { adminService } from "@/services/adminService";
import type { User } from "@/types";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    let active = true;
    adminService.listUsers().then((rows) => active && setUsers(rows));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Users &amp; roles"
        description="Who can do what. Roles map to token scopes, and the API checks the scope and the tenant on every request."
      />

      <Callout tone="brand" icon={<ShieldCheck size={15} />} title="One role carries the clinical boundary">
        Only roles marked as licensed may issue a medical-necessity
        determination. The service layer enforces it: a denial or partial
        approval cannot be recorded without a named licensed reviewer.
      </Callout>

      <Card className="mt-5">
        <CardHeader title="Directory" description={`${users?.length ?? 0} users across both tenants.`} />
        {!users ? (
          <LoadingBlock label="Loading users" />
        ) : (
          <TableWrap>
            <caption className="sr-only">User directory</caption>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Roles</Th>
                <Th>Tenant</Th>
                <Th>MFA</Th>
                <Th>Status</Th>
                <Th>Last active</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-aqua-600 text-[10px] font-semibold text-white"
                        aria-hidden
                      >
                        {u.initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-content">
                          {u.name}
                        </span>
                        <span className="block truncate text-xs text-content-muted">{u.title}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1.5">
                      {u.roleIds.map((rid) => {
                        const role = roles.find((r) => r.id === rid);
                        return (
                          <Badge
                            key={rid}
                            tone={role?.canMakeClinicalDetermination ? "accent" : "neutral"}
                          >
                            {role?.label ?? rid}
                          </Badge>
                        );
                      })}
                    </span>
                  </Td>
                  <Td className="text-xs text-content-muted">{u.tenantId}</Td>
                  <Td>
                    {u.mfaEnrolled ? (
                      <Check size={15} className="text-tint-accent-on" aria-label="Enrolled" />
                    ) : (
                      <X size={15} className="text-content-danger" aria-label="Not enrolled" />
                    )}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        u.status === "active" ? "accent" : u.status === "invited" ? "signal" : "neutral"
                      }
                    >
                      {u.status}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-content-muted">
                    {relative(u.lastActiveAt)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Permission matrix"
          description="Each role's scopes. The UI renders from these; the API enforces them."
        />
        <CardBody className="space-y-4">
          {roles.map((r) => (
            <div key={r.id} className="rounded-lg border border-line px-3.5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content">{r.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
                    {r.description}
                  </p>
                </div>
                {r.canMakeClinicalDetermination && (
                  <Badge tone="accent">
                    <ShieldCheck size={11} aria-hidden />
                    Licensed
                  </Badge>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {r.scopes.map((s) => (
                  <code
                    key={s}
                    className="rounded bg-surface-inset px-1.5 py-0.5 font-mono text-[10px] text-content-secondary"
                  >
                    {s}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
