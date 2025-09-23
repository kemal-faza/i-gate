// @ts-nocheck
"use client";



import {
  Environment,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  Canvas,
  extend,
  type ReactThreeFiber,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  type RigidBodyApi,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { useControls } from "leva";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import {
  type MutableRefObject,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: ReactThreeFiber.Node<
        MeshLineGeometry,
        typeof MeshLineGeometry
      >;
      meshLineMaterial: ReactThreeFiber.Node<
        MeshLineMaterial,
        typeof MeshLineMaterial
      >;
    }
  }
}

type InteractiveBadgeProps = {
  initial: string;
  qrUrl: string;
};

type RopeRef = MutableRefObject<RigidBodyApi | null>;

type BadgeGLTF = GLTF & {
  nodes: {
    card: THREE.Mesh;
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    metal: THREE.Material;
  };
};

const TAG_MODEL_URL =
  "https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb";
const BAND_TEX_URL =
  "/band.png";

if (typeof window !== "undefined") {
  void useGLTF.preload(TAG_MODEL_URL);
  void useTexture.preload(BAND_TEX_URL);
}

function useInitialTexture(initial: string) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;

    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(1, "#1f2937");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = size * 0.02;
    ctx.strokeRect(
      ctx.lineWidth,
      ctx.lineWidth,
      size - ctx.lineWidth * 2,
      size - ctx.lineWidth * 2,
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.65}px system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial.slice(0, 1).toUpperCase() || "A", size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.anisotropy = 8;
    return texture;
  }, [initial]);
}

function useQRTexture(qrUrl: string) {
  const tex = useTexture(qrUrl);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.anisotropy = 8;
  }, [tex]);
  return tex as THREE.Texture;
}

type FrontBackOverlaysProps = {
  geometry: THREE.BufferGeometry;
  frontTex: THREE.Texture | null;
  backTex: THREE.Texture | null;
  frontRotationZ?: number;
  backScale?: number;
};

function FrontBackOverlays({
  geometry,
  frontTex,
  backTex,
  frontRotationZ = Math.PI,
  backScale = 0.72,
}: FrontBackOverlaysProps) {
  const cloned = useMemo(() => geometry.clone(), [geometry]);
  cloned.computeBoundingBox();
  const bounds = cloned.boundingBox;
  const width = (bounds?.max.x ?? 0) - (bounds?.min.x ?? 0);
  const height = (bounds?.max.y ?? 0) - (bounds?.min.y ?? 0);
  const center = useMemo(() => new THREE.Vector3(), []);
  bounds?.getCenter(center);

  const eps = 0.003;
  const backW = width * backScale;
  const backH = height * backScale;

  return (
    <group>
      <mesh
        position={[center.x, center.y, center.z + eps]}
        rotation={[0, 0, frontRotationZ]}
        renderOrder={2}
      >
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          map={frontTex ?? undefined}
          clearcoat={1}
          clearcoatRoughness={0.15}
          roughness={0.3}
          metalness={0.5}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={[center.x, center.y, center.z - eps]}
        rotation={[0, Math.PI, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[backW, backH]} />
        <meshPhysicalMaterial
          map={backTex ?? undefined}
          clearcoat={1}
          clearcoatRoughness={0.15}
          roughness={0.3}
          metalness={0.5}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

type DragState = false | THREE.Vector3;

function Band({
  maxSpeed = 50,
  minSpeed = 10,
  initial,
  qrUrl,
}: {
  maxSpeed?: number;
  minSpeed?: number;
  initial: string;
  qrUrl: string;
}) {
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial> | null>(
    null,
  );
  const fixed = useRef<RigidBodyApi | null>(null);
  const j1 = useRef<RigidBodyApi | null>(null);
  const j2 = useRef<RigidBodyApi | null>(null);
  const j3 = useRef<RigidBodyApi | null>(null);
  const card = useRef<RigidBodyApi | null>(null);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  const segmentProps = useMemo(
    () => ({
      type: "dynamic" as const,
      canSleep: true,
      colliders: false,
      angularDamping: 2,
      linearDamping: 2,
    }),
    [],
  );

  const { nodes, materials } = useGLTF(TAG_MODEL_URL) as BadgeGLTF;
  const texture = useTexture(BAND_TEX_URL) as THREE.Texture;
  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );
  const [dragged, setDragged] = useState<DragState>(false);
  const [hovered, setHovered] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (!hovered) return;
    const style = document.body.style;
    style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      for (const ref of [card, j1, j2, j3, fixed]) {
        ref.current?.wakeUp();
      }
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (!fixed.current) return;

    const smoothingRefs: RopeRef[] = [j1, j2];
    smoothingRefs.forEach((ref) => {
      const api = ref.current;
      if (!api) return;
      const store = api as RigidBodyApi & { lerped?: THREE.Vector3 };
      if (!store.lerped) {
        store.lerped = new THREE.Vector3().copy(api.translation());
      }
      const dist = Math.max(
        0.1,
        Math.min(1, store.lerped.distanceTo(api.translation())),
      );
      store.lerped.lerp(
        api.translation(),
        delta * (minSpeed + dist * (maxSpeed - minSpeed)),
      );
    });

    if (j3.current) curve.points[0].copy(j3.current.translation());
    const j2Body = j2.current as
      | (RigidBodyApi & { lerped?: THREE.Vector3 })
      | null;
    const j1Body = j1.current as
      | (RigidBodyApi & { lerped?: THREE.Vector3 })
      | null;
    if (j2Body?.lerped) curve.points[1].copy(j2Body.lerped);
    if (j1Body?.lerped) curve.points[2].copy(j1Body.lerped);
    curve.points[3].copy(fixed.current.translation());

    if (band.current) {
      (
        band.current.geometry as unknown as {
          setPoints: (pts: THREE.Vector3[]) => void;
        }
      ).setPoints(curve.getPoints(32));
    }

    if (card.current) {
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({
        x: ang.x,
        y: ang.y - rot.y * 0.25,
        z: ang.z,
      });
    }
  });

  const frontTex = useInitialTexture(initial);
  const backTex = useQRTexture(qrUrl);

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(event) => {
              event.target.releasePointerCapture(event.pointerId);
              setDragged(false);
            }}
            onPointerDown={(event) => {
              if (!card.current) return;
              event.target.setPointerCapture(event.pointerId);
              const offset = new THREE.Vector3()
                .copy(event.point)
                .sub(vec.copy(card.current.translation()));
              setDragged(offset);
            }}
          >
            <mesh geometry={nodes.card.geometry} renderOrder={0}>
              <meshPhysicalMaterial
                color="#1f2937"
                clearcoat={1}
                clearcoatRoughness={0.2}
                roughness={0.4}
                metalness={0.3}
              />
            </mesh>

            <FrontBackOverlays
              geometry={nodes.card.geometry}
              frontTex={frontTex}
              backTex={backTex}
            />

            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[width, height]}
          useMap
          map={texture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

export function InteractiveBadge({ initial, qrUrl }: InteractiveBadgeProps) {
  // const { debug } = useControls(
  //   "Badge",
  //   { debug: false },
  //   { collapsed: true, hidden: true },
  // );

  return (
    <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
      <ambientLight intensity={Math.PI} />
      <Suspense fallback={null}>
        <Physics
          debug={false}
          interpolate
          gravity={[0, -40, 0]}
          timeStep={1 / 60}
        >
          <Band initial={initial} qrUrl={qrUrl} />
        </Physics>
        <Environment >
          {/* <color attach="background" args={["black"]} /> */}
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

export default InteractiveBadge;
