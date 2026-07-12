import SettingsPrivacySection from "@/components/settings/SettingsPrivacySection";
import SettingsThemeSection from "@/components/settings/SettingsThemeSection";

export default function Settings() {
  return (
    <main className="flex h-full w-full justify-center overflow-y-auto bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Account settings
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your account profile, interface theme, privacy links, and
            account deletion.
          </p>
        </div>

        <SettingsThemeSection />
        <SettingsPrivacySection />
      </div>
    </main>
  );
}
