"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { CompanyMembership } from "@/lib/company-context";
import { setActiveCompanyAction } from "./actions";

export function CompanySwitcher({
  memberships,
  activeCompanyId,
}: {
  memberships: CompanyMembership[];
  activeCompanyId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="company-switcher" className="text-sm font-medium">
        Company
      </label>
      <select
        id="company-switcher"
        defaultValue={activeCompanyId}
        disabled={pending}
        onChange={(event) => {
          const companyId = event.target.value;
          startTransition(async () => {
            await setActiveCompanyAction(companyId);
            router.refresh();
          });
        }}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30"
      >
        {memberships.map((membership) => (
          <option key={membership.company.id} value={membership.company.id}>
            {membership.company.name}
          </option>
        ))}
      </select>
    </div>
  );
}
