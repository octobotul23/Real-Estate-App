"""Convert an OSM-derived Bucharest streets GeoJSON into compact local line segments.

Output: {"origin": [lon, lat], "segments": [x1, y1, x2, y2, ...]} in kilometres east/north
of the origin, deduplicated and cropped to the city.

Usage: python3 -I scripts/build-streets.py <streets.geojson> public/data/bucharest-streets.json
"""
import json
import math
import sys

ORIGIN = (26.1025, 44.4268)  # Bucharest, Piața Universității area
BBOX = (25.94, 44.33, 26.27, 44.56)
EARTH_KM = 6371.0


def to_local(lon, lat):
    x = math.radians(lon - ORIGIN[0]) * math.cos(math.radians(ORIGIN[1])) * EARTH_KM
    y = math.radians(lat - ORIGIN[1]) * EARTH_KM
    return round(x, 3), round(y, 3)


def inside(lon, lat):
    return BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]


def main(src, dst):
    seen = set()
    out = []
    for feature in json.load(open(src))["features"]:
        geom = feature["geometry"]
        lines = [geom["coordinates"]] if geom["type"] == "LineString" else geom["coordinates"]
        for line in lines:
            for (a, b) in zip(line, line[1:]):
                if not (inside(*a) and inside(*b)):
                    continue
                p, q = to_local(*a), to_local(*b)
                key = (p, q) if p <= q else (q, p)
                if p == q or key in seen:
                    continue
                seen.add(key)
                out.extend([*p, *q])
    json.dump({"origin": ORIGIN, "segments": out}, open(dst, "w"), separators=(",", ":"))
    print(f"{len(out) // 4} segments")


if __name__ == "__main__":
    main(*sys.argv[1:3])
