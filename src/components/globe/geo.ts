import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import land110m from "world-atlas/land-110m.json";

export type LatLon = { lat: number; lon: number };

export const BUCHAREST: LatLon = { lat: 44.4268, lon: 26.1025 };

/** Unit-sphere position for a lat/lon, using the three-globe axis convention. */
export function latLonToVec3({ lat, lon }: LatLon, radius = 1): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/** Globe rotation (x then y) that brings `point` to face a camera on +Z. */
export function rotationToFace({ lat, lon }: LatLon): { x: number; y: number } {
  const theta = ((lon + 180) * Math.PI) / 180;
  const azimuth = Math.atan2(-Math.cos(theta), Math.sin(theta));
  return { x: (lat * Math.PI) / 180, y: -azimuth };
}

/** Evenly spaced points (Fibonacci sphere) that fall on land, as a flat xyz array. */
export function landDotPositions(samples = 40000, radius = 1): Float32Array {
  const topo = land110m as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out: number[] = [];

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = ((((i * golden * 180) / Math.PI) % 360) + 360) % 360 - 180;
    if (geoContains(land, [lon, lat])) out.push(...latLonToVec3({ lat, lon }, radius));
  }
  return new Float32Array(out);
}
