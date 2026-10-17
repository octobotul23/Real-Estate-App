import Image from "next/image";
import type { Project } from "@/data/types";

type ProjectImageProps = {
  project: Project;
  index: number;
  sizes: string;
  priority?: boolean;
};

/** A project photo, or a tonal placeholder with the project name until imagery is supplied. */
export function ProjectImage({ project, index, sizes, priority }: ProjectImageProps) {
  const src = project.images[index];
  if (src) {
    return <Image src={src} alt={project.name} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return (
    <div className="absolute inset-0 flex items-end bg-gradient-to-br from-ink-soft to-ink p-6">
      <span className="font-display text-lg text-paper/40">{project.name}</span>
    </div>
  );
}
