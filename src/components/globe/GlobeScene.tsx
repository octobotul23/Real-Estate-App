"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BUCHAREST, landDotPositions, localKm, rotationToFace, tangentFrame } from "./geo";

export type GlobeProgress = { current: number };

export type GlobePin = { slug: string; name: string; lat: number; lon: number };

const EARTH_KM = 6371;
/** Camera height above the surface, in Earth radii, at the end of each stage. */
const ALT_SPACE = 3.6;
const ALT_REGION = 1.2;
const ALT_CITY = 0.005;

const dotVertex = /* glsl */ `
  uniform float uSize;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = dot(n, normalize(-mv.xyz));
    gl_PointSize = min(uSize * (3.0 / -mv.z), 7.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFacing;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.35, d) * smoothstep(-0.1, 0.5, vFacing);
    gl_FragColor = vec4(uColor, alpha * uOpacity);
  }
`;

// Streets fade out radially so the data's rectangular crop never shows.
const streetVertex = /* glsl */ `
  varying float vDist;
  void main() {
    vDist = length(position.xy);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const streetFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vDist;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity * (1.0 - smoothstep(9.0, 15.0, vDist)));
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0) * 0.8;
    gl_FragColor = vec4(uColor, 1.0) * intensity * uOpacity;
  }
`;

function cssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

const { smoothstep, lerp } = THREE.MathUtils;

/** Altitude for scroll progress: region zoom, then a log-scale dive to street level, then a hold. */
function altitudeAt(p: number) {
  if (p < 0.45) return lerp(ALT_SPACE, ALT_REGION, smoothstep(p, 0, 0.45));
  const t = smoothstep(p, 0.45, 0.9);
  return ALT_REGION * Math.pow(ALT_CITY / ALT_REGION, t);
}

function useStreets() {
  const [segments, setSegments] = useState<Float32Array | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/data/bucharest-streets.json")
      .then((r) => r.json())
      .then((d: { segments: number[] }) => {
        if (!live) return;
        // Stored as x1,y1,x2,y2 km pairs; expand to xyz vertices on the tangent plane.
        const out = new Float32Array((d.segments.length / 2) * 3);
        for (let i = 0, j = 0; i < d.segments.length; i += 2, j += 3) {
          out[j] = d.segments[i];
          out[j + 1] = d.segments[i + 1];
        }
        setSegments(out);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return segments;
}

type GlobeProps = {
  progress: GlobeProgress;
  pins: GlobePin[];
  activeSlug: string | null;
  onSelect: (slug: string) => void;
  overlay: React.RefObject<HTMLDivElement | null>;
};

function Globe({ progress, pins, activeSlug, onSelect, overlay }: GlobeProps) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.Group>(null);
  const idle = useRef(0);

  const streets = useStreets();
  const dots = useMemo(() => landDotPositions(), []);
  const target = useMemo(() => rotationToFace(BUCHAREST), []);
  const frame = useMemo(() => tangentFrame(BUCHAREST), []);
  // Centre of the pins' bounding box, in Earth radii east/north of the city centre.
  const focus = useMemo(() => {
    if (!pins.length) return [0, 0];
    const km = pins.map((p) => localKm(p, BUCHAREST));
    const mid = (i: 0 | 1) => (Math.min(...km.map((k) => k[i])) + Math.max(...km.map((k) => k[i]))) / 2;
    return [mid(0) / EARTH_KM, mid(1) / EARTH_KM];
  }, [pins]);
  const colors = useMemo(
    () => ({
      dot: cssColor("--globe-dot", "#f4f1ec"),
      atmosphere: cssColor("--globe-atmosphere", "#8fb3ff"),
      marker: cssColor("--globe-marker", "#b89b6a"),
      street: cssColor("--globe-street", "#f4f1ec"),
    }),
    [],
  );

  const dotUniforms = useMemo(
    () => ({ uColor: { value: colors.dot }, uSize: { value: 4.5 }, uOpacity: { value: 1 } }),
    [colors],
  );
  const atmosphereUniforms = useMemo(
    () => ({ uColor: { value: colors.atmosphere }, uOpacity: { value: 1 } }),
    [colors],
  );
  const streetMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: streetVertex,
        fragmentShader: streetFragment,
        uniforms: { uColor: { value: colors.street }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    [colors],
  );

  useFrame(({ camera, clock }, delta) => {
    const p = progress.current;
    const turn = smoothstep(p, 0, 0.45);
    const alt = altitudeAt(p);

    // Idle spin slows to a stop as the scroll story takes over.
    idle.current += delta * 0.08 * (1 - turn);
    if (spin.current && tilt.current) {
      spin.current.rotation.y = lerp(idle.current, target.y, turn);
      tilt.current.rotation.x = lerp(0.25, target.x, turn);
    }

    const city = 1 - smoothstep(alt, 0.012, 0.03);
    const pan = smoothstep(alt, ALT_CITY, 0.05);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(lerp(focus[0], 0, pan), lerp(focus[1], 0, pan), 1 + alt);
    cam.near = Math.max(alt * 0.05, 1e-5);
    cam.far = alt + 4;
    cam.updateProjectionMatrix();

    dotUniforms.uOpacity.value = smoothstep(alt, 0.02, 0.1);
    atmosphereUniforms.uOpacity.value = smoothstep(alt, 0.3, 0.9);
    streetMaterial.uniforms.uOpacity.value = 0.32 * (1 - smoothstep(alt, 0.02, 0.15));

    overlay.current?.style.setProperty("--pins", String(city));
    overlay.current?.toggleAttribute("data-city", city > 0.5);

    // The beacon keeps a constant on-screen size and bows out before street level.
    if (beacon.current) {
      beacon.current.visible = alt > 0.05;
      beacon.current.scale.setScalar(Math.min(1, alt / ALT_REGION));
    }
    if (pulse.current) {
      const t = (clock.elapsedTime % 2) / 2;
      pulse.current.scale.setScalar(1 + t * 4);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * turn;
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[0.995, 96, 96]} />
          <meshBasicMaterial color="#05070a" />
        </mesh>

        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dots, 3]} />
          </bufferGeometry>
          <shaderMaterial
            transparent
            depthWrite={false}
            vertexShader={dotVertex}
            fragmentShader={dotFragment}
            uniforms={dotUniforms}
          />
        </points>

        {/* Bucharest tangent plane: +X east, +Y north, +Z up. */}
        <group position={frame.position} quaternion={frame.quaternion}>
          <group ref={beacon}>
            <mesh>
              <sphereGeometry args={[0.008, 16, 16]} />
              <meshBasicMaterial color={colors.marker} />
            </mesh>
            <mesh ref={pulse}>
              <ringGeometry args={[0.008, 0.011, 48]} />
              <meshBasicMaterial color={colors.marker} transparent side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Kilometre units from here down. */}
          <group scale={1 / EARTH_KM}>
            {streets && (
              <lineSegments material={streetMaterial}>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[streets, 3]} />
                </bufferGeometry>
              </lineSegments>
            )}

            {pins.map((pin) => {
              const [x, y] = localKm(pin, BUCHAREST);
              return (
                <Html key={pin.slug} position={[x, y, 0]} center zIndexRange={[20, 10]}>
                  <button
                    type="button"
                    onClick={() => onSelect(pin.slug)}
                    data-active={pin.slug === activeSlug || undefined}
                    className="globe-pin"
                  >
                    <span className="globe-pin__dot" />
                    <span className="globe-pin__label">{pin.name}</span>
                  </button>
                </Html>
              );
            })}
          </group>
        </group>
      </group>

      <mesh scale={1.18}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphereUniforms}
        />
      </mesh>
    </group>
  );
}

/**
 * Dotted-earth globe driven by `progress` (0 → 1): turns to Bucharest, dives from orbit
 * to street level, then shows clickable project pins.
 */
export default function GlobeScene(props: Omit<GlobeProps, "overlay">) {
  // Pins are portalled inside this element, so they inherit the --pins fade.
  const overlay = useRef<HTMLDivElement>(null);
  return (
    <div ref={overlay} className="globe-overlay h-full w-full">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 1 + ALT_SPACE], fov: 35 }} gl={{ antialias: true, alpha: true }}>
        <Globe {...props} overlay={overlay} />
      </Canvas>
    </div>
  );
}
