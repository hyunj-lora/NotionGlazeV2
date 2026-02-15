export { default as Layout } from "./Layout.astro";
export { default as DashboardLayout } from "./DashboardLayout.astro";
export { default as BlogFooter } from "./BlogFooter.astro";
export { default as BlogHeader } from "./BlogHeader.astro";
export { default as ThemeToggle } from "./components/ThemeToggle.astro";
export { default as DashboardSection } from "./components/dashboard/DashboardSection.astro";
export { default as DashboardCard } from "./components/dashboard/DashboardCard.astro";
export { default as StickyFooter } from "./components/dashboard/StickyFooter.astro";
export { default as OnboardingChecklist } from "./components/dashboard/OnboardingChecklist.astro";
export { default as EngineStatus } from "./components/dashboard/EngineStatus.astro";
export { default as ActivityList } from "./components/dashboard/ActivityList.astro";
export { default as ThemePreviewModal } from "./components/dashboard/settings/ThemePreviewModal.astro";

// Settings Modules - Keeping old names for compat in `apps/web` until deprecated
export { default as IdentitySettings } from "./components/dashboard/settings/IdentitySettings.astro";
export { default as DesignSettings } from "./components/dashboard/settings/DesignSettings.astro";
export { default as ArchitectureSettings } from "./components/dashboard/settings/ArchitectureSettings.astro";
export { default as EngineSettings } from "./components/dashboard/settings/EngineSettings.astro";
export { default as DomainSettings } from "./components/dashboard/settings/DomainSettings.astro";
export { default as GrowthSettings } from "./components/dashboard/settings/GrowthSettings.astro";
export { default as AdvancedSettings } from "./components/dashboard/settings/AdvancedSettings.astro";

// New Refactored Settings
export { default as ThemeSettings } from "./components/dashboard/settings/ThemeSettings.astro";
export { default as BrandingSettings } from "./components/dashboard/settings/BrandingSettings.astro";
export { default as LayoutSettings } from "./components/dashboard/settings/LayoutSettings.astro";
export { default as NavigationEditor } from "./components/dashboard/settings/NavigationEditor.astro";
export { default as GeneralSettings } from "./components/dashboard/settings/GeneralSettings.astro";
export { default as SyncSettings } from "./components/dashboard/settings/SyncSettings.astro";

// Billing
export { default as PlanBadge } from "./components/dashboard/billing/PlanBadge.astro";
export { default as PricingCard } from "./components/dashboard/billing/PricingCard.astro";

// Base UI
export { default as Input } from "./components/ui/Input.astro";
export { default as Label } from "./components/ui/Label.astro";
export { default as Select } from "./components/ui/Select.astro";
export { default as Textarea } from "./components/ui/Textarea.astro";
