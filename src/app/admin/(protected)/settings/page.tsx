import { requirePermission } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage");
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control site-wide behavior.</p>
      </div>

      <SettingsForm initialAutoVerification={settings.autoVerification} />
    </div>
  );
}
