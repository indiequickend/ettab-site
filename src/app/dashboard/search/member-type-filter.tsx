"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Checkbox } from "@/components/ui/checkbox";
import { memberTypeValues } from "@/lib/validation/auth";

const TYPE_LABELS: Record<(typeof memberTypeValues)[number], string> = {
  hotelier: "Hotelier",
  tour_operator: "Tour Operator",
  car_vendor: "Car Vendor",
};

export function MemberTypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = new Set((searchParams.get("types") ?? "").split(",").filter(Boolean));

  function toggle(type: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(type);
    } else {
      next.delete(type);
    }

    const params = new URLSearchParams(searchParams.toString());
    if (next.size > 0) {
      params.set("types", Array.from(next).join(","));
    } else {
      params.delete("types");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4">
      {memberTypeValues.map((type) => (
        <label key={type} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selected.has(type)}
            onCheckedChange={(checked) => toggle(type, checked === true)}
          />
          {TYPE_LABELS[type]}
        </label>
      ))}
    </div>
  );
}
