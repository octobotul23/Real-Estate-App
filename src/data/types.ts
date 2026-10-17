import type { Localized } from "@/i18n/config";

export type ProjectStatus = "delivered" | "construction" | "launching";

export type Project = {
  slug: string;
  name: string;
  status: ProjectStatus;
  neighbourhood: Localized;
  address: string | null;
  lat: number;
  lon: number;
  deliveryYear: number | null;
  units: number | null;
  buildings: string | null;
  unitTypes: Localized<string[]>;
  amenities: Localized<string[]>;
  sustainability: string[];
  architect: string | null;
  summary: Localized;
  /** Paths under /public or absolute URLs; first one is the cover. */
  images: string[];
  website: string | null;
};
