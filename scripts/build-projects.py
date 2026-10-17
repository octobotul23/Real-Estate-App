"""Build src/data/projects.json (the site's project list) from the research file.

Applies street-snapped coordinates from coordinate-overrides.json and drops entries
without a location. Usage: python3 -I scripts/build-projects.py
"""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "src" / "data"
# Kept in the research file but not marketed: works suspended by court order since 2022.
HIDDEN = {"one-modrogan"}
FIELDS = ["slug", "name", "status", "neighbourhood", "address", "lat", "lon", "deliveryYear", "units",
          "buildings", "unitTypes", "amenities", "sustainability", "architect", "summary"]

research = json.loads((DATA / "projects.research.json").read_text())
overrides = json.loads((DATA / "coordinate-overrides.json").read_text())
images = json.loads((DATA / "project-images.json").read_text()) if (DATA / "project-images.json").exists() else {}

projects = []
for entry in research:
    if entry["slug"] in HIDDEN:
        continue
    if entry["slug"] in overrides:
        entry["lat"], entry["lon"] = overrides[entry["slug"]]
    if entry["lat"] is None or entry["lon"] is None:
        print(f"skipped (no location): {entry['name']}")
        continue
    project = {k: entry.get(k) for k in FIELDS}
    for k in ("unitTypes", "amenities"):
        project[k] = project[k] or {"en": [], "ro": []}
    project["sustainability"] = project["sustainability"] or []
    project["images"] = images.get(entry["slug"], [])
    project["website"] = None
    projects.append(project)

(DATA / "projects.json").write_text(json.dumps(projects, ensure_ascii=False, indent=1) + "\n")
print(f"{len(projects)} projects written")
