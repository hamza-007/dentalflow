'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, RoundedBox } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { BufferGeometry } from 'three';
import { useTranslations } from 'next-intl';
import { placeTooth, type ToothClass, type ToothPlacement } from '@/lib/constants/toothLibrary';
import { shadeToHex } from '@/lib/constants/vitaShadeHex';

const ARCH_GAP = 1.9; // vertical separation when both arches are present

// --- optional STL assets, loaded once per class and reused ---------------------
const geomCache = new Map<string, Promise<BufferGeometry | null>>();
function loadClass(url: string): Promise<BufferGeometry | null> {
  if (!geomCache.has(url)) {
    geomCache.set(
      url,
      new STLLoader()
        .loadAsync(url)
        .then((g) => {
          g.center();
          g.computeVertexNormals();
          g.computeBoundingSphere();
          return g;
        })
        .catch(() => null)
    );
  }
  return geomCache.get(url) as Promise<BufferGeometry | null>;
}
function useClassGeometry(url: string): BufferGeometry | null {
  const [geom, setGeom] = useState<BufferGeometry | null>(null);
  useEffect(() => {
    let active = true;
    loadClass(url).then((g) => {
      if (active) setGeom(g);
    });
    return () => {
      active = false;
    };
  }, [url]);
  return geom;
}

// --- procedural crown per tooth class -----------------------------------------
function Cusp({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <mesh position={[x, 0.5, z]}>
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.02} />
    </mesh>
  );
}

function ProceduralTooth({ toothClass, color }: { toothClass: ToothClass; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.42} metalness={0.02} />;
  const root = (
    <mesh position={[0, -0.85, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.3, 1.1, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.02} />
    </mesh>
  );

  switch (toothClass) {
    case 'incisor':
      return (
        <group>
          <RoundedBox args={[0.85, 1.2, 0.5]} radius={0.1} smoothness={5} position={[0, 0.1, 0]}>
            {mat}
          </RoundedBox>
          {root}
        </group>
      );
    case 'canine':
      return (
        <group>
          <RoundedBox args={[0.8, 1.1, 0.7]} radius={0.14} smoothness={5} position={[0, 0.05, 0]}>
            {mat}
          </RoundedBox>
          <mesh position={[0, 0.75, 0]}>
            <coneGeometry args={[0.32, 0.5, 16]} />
            <meshStandardMaterial color={color} roughness={0.42} metalness={0.02} />
          </mesh>
          {root}
        </group>
      );
    case 'premolar':
      return (
        <group>
          <RoundedBox args={[1.0, 0.95, 0.95]} radius={0.2} smoothness={5}>
            {mat}
          </RoundedBox>
          <Cusp x={-0.26} z={0} color={color} />
          <Cusp x={0.26} z={0} color={color} />
          {root}
        </group>
      );
    default: // molar
      return (
        <group>
          <RoundedBox args={[1.3, 0.9, 1.2]} radius={0.22} smoothness={5}>
            {mat}
          </RoundedBox>
          <Cusp x={-0.32} z={-0.32} color={color} />
          <Cusp x={0.32} z={-0.32} color={color} />
          <Cusp x={-0.32} z={0.32} color={color} />
          <Cusp x={0.32} z={0.32} color={color} />
          {root}
        </group>
      );
  }
}

function Tooth({
  placement,
  color,
  y,
  isImplant,
  isAligner
}: {
  placement: ToothPlacement;
  color: string;
  y: number;
  isImplant: boolean;
  isAligner: boolean;
}) {
  const geom = useClassGeometry(placement.assetUrl);
  const scale = geom?.boundingSphere ? 1.4 / geom.boundingSphere.radius : 1;

  return (
    <group position={[placement.x, y, placement.z]} rotation={[0, placement.yaw, 0]}>
      {geom ? (
        <mesh geometry={geom} scale={scale}>
          <meshStandardMaterial color={color} roughness={0.42} metalness={0.02} />
        </mesh>
      ) : (
        <ProceduralTooth toothClass={placement.toothClass} color={color} />
      )}

      {/* Implant: titanium post under the crown */}
      {isImplant ? (
        <mesh position={[0, -1.1, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 1.1, 12]} />
          <meshStandardMaterial color="#9aa3ab" roughness={0.3} metalness={0.7} />
        </mesh>
      ) : null}

      {/* Aligner: faint translucent shell over the crown */}
      {isAligner ? (
        <RoundedBox args={[1.15, 1.35, 1.15]} radius={0.2} smoothness={4} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#bfe9ff" transparent opacity={0.25} roughness={0.1} />
        </RoundedBox>
      ) : null}
    </group>
  );
}

// Bridge connectors between consecutive teeth on the same arch.
function Connectors({ placements, color }: { placements: { p: ToothPlacement; y: number }[]; color: string }) {
  const segments: ReactElement[] = [];
  for (let i = 0; i < placements.length - 1; i++) {
    const a = placements[i];
    const b = placements[i + 1];
    if (a.p.isUpper !== b.p.isUpper) continue;
    const dx = b.p.x - a.p.x;
    const dz = b.p.z - a.p.z;
    const len = Math.hypot(dx, dz);
    if (len > 2.2) continue; // don't bridge a big gap
    segments.push(
      <mesh
        key={i}
        position={[(a.p.x + b.p.x) / 2, (a.y + b.y) / 2 - 0.1, (a.p.z + b.p.z) / 2]}
        rotation={[0, -Math.atan2(dz, dx), 0]}
      >
        <boxGeometry args={[len, 0.32, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.02} />
      </mesh>
    );
  }
  return <>{segments}</>;
}

// Pink gingiva segment under a denture tooth.
function Gum({ placement, y }: { placement: ToothPlacement; y: number }) {
  return (
    <RoundedBox
      args={[1.15, 0.7, 1.0]}
      radius={0.25}
      smoothness={4}
      position={[placement.x, y - 0.85, placement.z]}
      rotation={[0, placement.yaw, 0]}
    >
      <meshStandardMaterial color="#d98a8a" roughness={0.6} metalness={0} />
    </RoundedBox>
  );
}

/**
 * Watermarked generic preview of the WHOLE prosthesis: every selected tooth laid
 * on the dental arch, plus structure for the prosthesis type. Visualization only,
 * never a fitted/millable restoration (CLAUDE.md §13.2).
 */
export default function ToothPreview3D({
  prosthesisType,
  teeth,
  shade
}: {
  prosthesisType: string;
  teeth: string[];
  shade?: string | null;
}) {
  const t = useTranslations('studio');

  if (teeth.length === 0) {
    return <p className="text-sm text-slate-500">{t('noTooth')}</p>;
  }

  const color = shadeToHex(shade);
  const placements = teeth.map(placeTooth).sort((a, b) => Number(a.isUpper) - Number(b.isUpper) || a.x - b.x);

  const hasUpper = placements.some((p) => p.isUpper);
  const hasLower = placements.some((p) => !p.isUpper);
  const both = hasUpper && hasLower;
  const yFor = (p: ToothPlacement) => (both ? (p.isUpper ? ARCH_GAP / 2 : -ARCH_GAP / 2) : 0);

  const withY = placements.map((p) => ({ p, y: yFor(p) }));

  const isBridge = prosthesisType === 'bridge';
  const isDenture = prosthesisType === 'partial_denture' || prosthesisType === 'full_denture';
  const isImplant = prosthesisType === 'implant';
  const isAligner = prosthesisType === 'aligner';

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 1, 7], fov: 40 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 6]} intensity={1.1} />
        <directionalLight position={[-4, -2, -5]} intensity={0.3} />

        <Bounds fit clip observe margin={1.25}>
          <group>
            {isDenture
              ? withY.map(({ p, y }) => <Gum key={`g-${p.fdi}`} placement={p} y={y} />)
              : null}

            {withY.map(({ p, y }) => (
              <Tooth
                key={p.fdi}
                placement={p}
                color={color}
                y={y}
                isImplant={isImplant}
                isAligner={isAligner}
              />
            ))}

            {isBridge ? <Connectors placements={withY} color={color} /> : null}
          </group>
        </Bounds>

        <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={16} />
      </Canvas>

      {/* Watermark — required; this is not a millable design. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="-rotate-[20deg] select-none text-xl font-bold uppercase tracking-wider text-slate-400/25">
          {t('watermark')}
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-2 right-3 select-none text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {t('watermark')}
      </span>
      <span className="data pointer-events-none absolute left-3 top-2 select-none rounded bg-white/70 px-1.5 py-0.5 text-xs text-slate-600 backdrop-blur">
        {teeth.join(', ')} · {shade ?? '—'}
      </span>
    </div>
  );
}
