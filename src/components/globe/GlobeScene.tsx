"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BUCHAREST, landDotPositions, latLonToVec3, rotationToFace } from "./geo";

export type GlobeProgress = { current: number };

const dotVertex = /* glsl */ `
  uniform float uSize;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = dot(n, normalize(-mv.xyz));
    gl_PointSize = uSize * (3.0 / -mv.z) * clamp(-mv.z / 3.0, 0.55, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vFacing;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.35, d) * smoothstep(-0.1, 0.5, vFacing);
    gl_FragColor = vec4(uColor, alpha);
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
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0) * 0.8;
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`;

function cssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

function Globe({ progress }: { progress: GlobeProgress }) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const idle = useRef(0);

  const dots = useMemo(() => landDotPositions(), []);
  const target = useMemo(() => rotationToFace(BUCHAREST), []);
  const marker = useMemo(() => latLonToVec3(BUCHAREST, 1.004), []);
  // Lay the pulse ring flat on the surface by pointing its +Z along the normal.
  const markerFacing = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(...marker).normalize(),
      ),
    [marker],
  );
  const colors = useMemo(
    () => ({
      dot: cssColor("--globe-dot", "#f4f1ec"),
      atmosphere: cssColor("--globe-atmosphere", "#8fb3ff"),
      marker: cssColor("--globe-marker", "#b89b6a"),
    }),
    [],
  );

  useFrame(({ camera, clock }, delta) => {
    const p = THREE.MathUtils.smootherstep(progress.current, 0, 1);
    // Idle spin slows to a stop as the scroll story takes over.
    idle.current += delta * 0.08 * (1 - p);

    if (spin.current && tilt.current) {
      spin.current.rotation.y = THREE.MathUtils.lerp(idle.current, target.y, p);
      tilt.current.rotation.x = THREE.MathUtils.lerp(0.25, target.x, p);
    }
    camera.position.z = THREE.MathUtils.lerp(4.6, 2.3, p);

    if (pulse.current) {
      const t = (clock.elapsedTime % 2) / 2;
      pulse.current.scale.setScalar(1 + t * 4);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * p;
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[0.995, 64, 64]} />
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
            uniforms={{ uColor: { value: colors.dot }, uSize: { value: 4.5 } }}
          />
        </points>

        <group position={marker} quaternion={markerFacing}>
          <mesh>
            <sphereGeometry args={[0.008, 16, 16]} />
            <meshBasicMaterial color={colors.marker} />
          </mesh>
          <mesh ref={pulse}>
            <ringGeometry args={[0.008, 0.011, 48]} />
            <meshBasicMaterial color={colors.marker} transparent side={THREE.DoubleSide} />
          </mesh>
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
          uniforms={{ uColor: { value: colors.atmosphere } }}
        />
      </mesh>
    </group>
  );
}

/** Dotted-earth globe that turns to Bucharest and zooms in as `progress` goes 0 → 1. */
export default function GlobeScene({ progress }: { progress: GlobeProgress }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Globe progress={progress} />
    </Canvas>
  );
}
