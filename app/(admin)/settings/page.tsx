// app/(admin)/settings/page.tsx
"use client";

import { AboutSettingsForm } from "@/app/components/settings/AboutSettingsForm";
import { ContentManager } from "@/app/components/settings/ContentManager";
import { GeneralSettingsForm } from "@/app/components/settings/GeneralSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Ties together the settings components: resort name/logo/contact details
// (General), the About page copy + "what we care about" cards (About), and
// the Activities / Amenities card lists that also feed the hero carousels
// on their public pages.
export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Manage your resort name and contact details, and the content shown on
          the public Activities, Amenities and About pages.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="about">About page</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsForm />
        </TabsContent>

        <TabsContent value="about" className="mt-6 space-y-8">
          <AboutSettingsForm />
          <ContentManager
            section="aboutValues"
            helpText='These show as cards under "What we care about" on your public About page.'
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <ContentManager
            section="activities"
            helpText="These show as cards on your public Activities page. Items with a photo also appear in the carousel at the top of that page."
          />
        </TabsContent>

        <TabsContent value="amenities" className="mt-6">
          <ContentManager
            section="amenities"
            helpText="These show as cards on your public Amenities page. Items with a photo also appear in the carousel at the top of that page."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
