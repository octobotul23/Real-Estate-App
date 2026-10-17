import type { Project } from "./types";

// Filled from projects.research.json once the research pass lands.
export const projects: Project[] = [];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
