"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera, useGLTF, useProgress, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Html } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useRouter } from "next/navigation";

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* -------------------- ПЕРСОНАЖ -------------------- */

type CharacterProps = {
  modelPath: string;
  position: [number, number, number];
  scale?: number;
  name: string;
  description: string;
  onClick?: () => void;
};

export function Character({
  modelPath,
  position,
  scale = 1,
  name,
  description,
  onClick,
}: CharacterProps) {
  const { scene } = useGLTF(modelPath);
  const [hovered, setHovered] = useState(false);

  // Внутренняя группа для анимации (чтобы не ломать position)
  const animatedRef = useRef<THREE.Group>(null);

  // Плавность движения
  const smooth = useRef({ x: 0, y: 0 });

  useFrame(({ mouse, clock }) => {
    if (!animatedRef.current) return;

    const t = clock.getElapsedTime();

    const maxRotation = 0.1;

    const targetY = mouse.x * maxRotation;
    const targetX = -mouse.y * maxRotation;

    // плавная инерция
    smooth.current.y += (targetY - smooth.current.y) * 0.05;
    smooth.current.x += (targetX - smooth.current.x) * 0.05;

    animatedRef.current.rotation.y = smooth.current.y;
    animatedRef.current.rotation.x = smooth.current.x;

    // лёгкое дыхание через scale (без изменения position!)
    const breathe = 1 + Math.sin(t * 0.8) * 0.01;

    animatedRef.current.scale.set(
      scale,
      scale * breathe,
      scale
    );
  });

  return (
    <group position={position}>
      <group ref={animatedRef}>
        <primitive
          object={scene}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = onClick ? "pointer" : "default";
          }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "default";
          }}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClick?.();
          }}
        />
      </group>

      {hovered && (
        <Html
          position={[0, 0.2, 0]}
          center
          distanceFactor={12}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.75)",
              color: "white",
              padding: "14px 18px",
              borderRadius: "14px",
              width: "240px",
              textAlign: "center",
              boxShadow:
                "0 0 25px rgba(255,180,120,0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <h3 style={{ margin: 0, color: "#ffcf9a" }}>
              {name}
            </h3>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              {description}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

/* -------------------- СВЕТ -------------------- */

function Lights() {
  const leftTarget = useRef<THREE.Object3D>(null!)
  const rightTarget = useRef<THREE.Object3D>(null!)
  const leftBackTarget = useRef<THREE.Object3D>(null!)
  const rightBackTarget = useRef<THREE.Object3D>(null!)

  const leftSpot = useRef<THREE.SpotLight>(null!)
  const rightSpot = useRef<THREE.SpotLight>(null!)
  const leftBackSpot = useRef<THREE.SpotLight>(null!)
  const rightBackSpot = useRef<THREE.SpotLight>(null!)

  useEffect(() => {
    if (leftSpot.current) leftSpot.current.target = leftTarget.current
    if (rightSpot.current) rightSpot.current.target = rightTarget.current
    if (leftBackSpot.current) leftBackSpot.current.target = leftBackTarget.current
    if (rightBackSpot.current) rightBackSpot.current.target = rightBackTarget.current
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const frontPulse = 8.9 + Math.sin(t * 1.1) * 0.8;
    const backPulse = 5.6 + Math.sin(t * 0.8 + 1.4) * 0.55;

    if (leftSpot.current) leftSpot.current.intensity = frontPulse;
    if (rightSpot.current) rightSpot.current.intensity = frontPulse * 0.97;
    if (leftBackSpot.current) leftBackSpot.current.intensity = backPulse;
    if (rightBackSpot.current) rightBackSpot.current.intensity = backPulse * 1.03;
  });

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[0, 5, 5]}
        intensity={1.2}
        color="#fff1d6"
      />

      {/* Левый передний */}
      <spotLight
        ref={leftSpot}
        position={[-4, 5, 3]}
        angle={0.35}
        color="#ffc14d"
        intensity={8.9}
        penumbra={1}
        castShadow
      />
      <object3D ref={leftTarget} position={[-1.6, -1.2, 0]} />

      {/* Правый передний */}
      <spotLight
        ref={rightSpot}
        position={[4, 5, 3]}
        angle={0.35}
        color="#ffc14d"
        intensity={8.7}
        penumbra={1}
        castShadow
      />
      <object3D ref={rightTarget} position={[1.6, -1.2, 0]} />

      {/* Левый задний */}
      <spotLight
        ref={leftBackSpot}
        position={[-3, 5, -2]}
        angle={0.4}
        penumbra={0.9}
        intensity={5.6}
        color="#ffb870"
      />
      <object3D ref={leftBackTarget} position={[-1.6, -1.2, 0]} />

      {/* Правый задний */}
      <spotLight
        ref={rightBackSpot}
        position={[3, 5, -2]}
        angle={0.4}
        penumbra={0.9}
        intensity={5.8}
        color="#ffb870"
      />
      <object3D ref={rightBackTarget} position={[1.6, -1.2, 0]} />
    </>
  )
}

/* -------------------- СЦЕНА -------------------- */

export default function StageScene() {
  const router = useRouter();
  const { active, progress } = useProgress();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [bgReady, setBgReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = `${ASSET_BASE}/theater-stage.png`;
    img.onload = () => setBgReady(true);
    img.onerror = () => setBgReady(true);
  }, []);

  useEffect(() => {
    if (bgReady && !active && progress >= 100) {
      const id = setTimeout(() => setSceneReady(true), 120);
      return () => clearTimeout(id);
    }
  }, [active, bgReady, progress]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (transitionResetRef.current) {
        clearTimeout(transitionResetRef.current);
      }
      document.body.style.cursor = "default";
    };
  }, []);

  const startTransition = (href: string, name: string) => {
    if (isTransitioning) return;
    setTargetName(name);
    setIsTransitioning(true);
    document.body.style.cursor = "default";
    transitionTimeoutRef.current = setTimeout(() => {
      router.push(href);
    }, 1300);
    transitionResetRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setTargetName("");
    }, 3600);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#090606",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${ASSET_BASE}/theater-stage.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: sceneReady ? 1 : 0,
          transition: "opacity 350ms ease",
        }}
      >
        <Canvas orthographic>
          <OrthographicCamera
            makeDefault
            position={[0, 0, 50]}
            zoom={120}
          />

          <Suspense fallback={null}>
            <Lights />
            <ambientLight intensity={0.6} color="#ffe0a3" />
            <BeamParticles position={[-2.15, -0.9, 0]} direction={1} />
            <BeamParticles position={[2.15, -0.9, 0]} direction={-1} />
            <FloatingDust />

            <StageFog />
            <MistLayer />

            <Character
              modelPath={`${ASSET_BASE}/models/anna.glb`}
              position={[-1.2, -1.30, 0]}
              scale={2.4}
              name="Елена"
              description="Лидер сцены и обладательница выдающихся наград."
              onClick={() => startTransition("/hall/elena", "Елена")}
            />

            <Character
              modelPath={`${ASSET_BASE}/models/olga.glb`}
              position={[1.2, -1.30, 0]}
              scale={2.4}
              name="Дарья"
              description="Звезда труппы с яркой серией достижений."
              onClick={() => startTransition("/hall/darya", "Дарья")}
            />
          </Suspense>
          <EffectComposer>
            <Bloom
              intensity={1.35}
              luminanceThreshold={0.16}
              luminanceSmoothing={0.92}
            />
          </EffectComposer>
        </Canvas>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: sceneReady ? "none" : "grid",
          placeItems: "center",
          background: "radial-gradient(circle at center, rgba(30,16,12,0.88) 0%, rgba(8,4,3,0.96) 100%)",
          color: "#f6d39b",
          fontFamily: "Georgia, serif",
          zIndex: 8,
          letterSpacing: "0.04em",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "clamp(20px, 2.6vw, 36px)" }}>Подготовка сцены...</p>
          <p style={{ margin: "10px 0 0", fontSize: "clamp(14px, 1.3vw, 18px)", color: "#eec28a" }}>
            {Math.min(100, Math.round(progress))}%
          </p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 5,
          background:
            "radial-gradient(circle at 50% 44%, rgba(255, 214, 138, 0.06) 0%, rgba(255, 214, 138, 0.02) 28%, rgba(0, 0, 0, 0.24) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "22px",
          transform: "translateX(-50%)",
          padding: "10px 16px",
          borderRadius: "999px",
          border: "1px solid rgba(255, 214, 144, 0.45)",
          background: "rgba(17, 10, 6, 0.62)",
          color: "#ffe2af",
          fontFamily: "Georgia, serif",
          fontSize: "14px",
          letterSpacing: "0.03em",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 6,
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 240ms ease",
        }}
      >
        Нажмите на персонажа, чтобы открыть персональный зал наград
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "radial-gradient(circle at center, rgba(42, 14, 10, 0.55) 0%, rgba(8, 4, 3, 0.92) 100%)",
          opacity: isTransitioning ? 1 : 0,
          transition: "opacity 650ms ease",
          pointerEvents: isTransitioning ? "auto" : "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: "#f6d39b",
            fontFamily: "Georgia, serif",
            fontSize: "clamp(22px, 2.8vw, 38px)",
            letterSpacing: "0.06em",
            textShadow: "0 0 24px rgba(255, 198, 114, 0.45)",
            transform: isTransitioning ? "translateY(0)" : "translateY(16px)",
            opacity: isTransitioning ? 1 : 0,
            transition: "opacity 650ms ease, transform 650ms ease",
          }}
        >
          {targetName ? `${targetName}: переход в зал наград...` : "Переход..."}
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(`${ASSET_BASE}/models/anna.glb`);
useGLTF.preload(`${ASSET_BASE}/models/olga.glb`);
useTexture.preload(`${ASSET_BASE}/stage-fog.png`);

function BeamParticles({
  position,
  direction = 1,
}: {
  position: [number, number, number];
  direction?: 1 | -1;
}) {
  const ref = useRef<THREE.Points>(null!);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 800;
    const heightMax = 5;

    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // псевдо-рандом
      const r1 = Math.sin(i * 12.9898) * 43758.5453;
      const r2 = Math.sin(i * 78.233) * 12345.6789;
      const r3 = Math.sin(i * 45.164) * 98765.4321;

      const n1 = r1 - Math.floor(r1);
      const n2 = r2 - Math.floor(r2);
      const n3 = r3 - Math.floor(r3);

      // высота
      const height = n1 * heightMax;

      // ширина луча (широкий низ)
      const baseRadius = (heightMax - height) * 1.2;

      // добавляем рассеивание
      const scatter = baseRadius * (0.9 + n2 * 1);

      const angle = n3 * Math.PI * 2;

      const x = Math.cos(angle) * scatter * direction;
      const z = Math.sin(angle) * scatter;

      pos[i * 3] = x;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = z;

      // 🎨 тёплый градиент цвета
      col[i * 3] = 1; // R
      col[i * 3 + 1] = 0.7 + n2 * 0.3; // G
      col[i * 3 + 2] = 0.4 + n3 * 0.3; // B

      // ✨ разный размер
      size[i] = 0.1 + n1 * 13;
    }

    return { positions: pos, colors: col, sizes: size };
  }, [direction]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (ref.current) {
      ref.current.rotation.z = Math.sin(t * 0.15) * 0.03;

      const mat = ref.current.material as THREE.PointsMaterial;
      mat.opacity = 0.75 + Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <points
      ref={ref}
      position={[position[0], position[1], 1]}
      renderOrder={60}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingDust() {
  const ref = useRef<THREE.Points>(null!);

  const { positions, sizes } = useMemo(() => {
    const count = 1000;

    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // псевдо-рандом через sin
      const r1 = Math.sin(i * 12.9898) * 43758.5453;
      const r2 = Math.sin(i * 78.233) * 12345.6789;
      const r3 = Math.sin(i * 45.164) * 98765.4321;

      const n1 = r1 - Math.floor(r1);
      const n2 = r2 - Math.floor(r2);
      const n3 = r3 - Math.floor(r3);

      // хаотичная ширина сцены
      pos[i * 3] = (n1 - 0.5) * 12;

      // ТОЛЬКО верхняя зона
      pos[i * 3 + 1] = 1.5 + n2 * 4;

      // глубина
      pos[i * 3 + 2] = (n3 - 0.5) * 6;

      // разные размеры
      size[i] = 0.02 + n1 * 0.08;
    }

    return { positions: pos, sizes: size };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (ref.current) {
      const material = ref.current.material as THREE.PointsMaterial;

      // мягкое мерцание
      material.opacity = 0.25 + Math.sin(t * 0.7) * 0.1;

      ref.current.rotation.y = t * 0.015;
    }
  });

  return (
    <points ref={ref} renderOrder={40}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.05}
        sizeAttenuation
        color="#ffffff"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function StageFog() {
  const texture = useTexture(`${ASSET_BASE}/stage-fog.png`);
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.position.x = Math.sin(t * 0.22) * 0.18;
      ref.current.position.y = 0.38 + Math.sin(t * 0.28) * 0.04;
      ref.current.rotation.z = Math.sin(t * 0.14) * 0.02;
      const material = ref.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(t * 0.6) * 0.07;
    }
  });

  return (
    <mesh
      ref={ref}
      position={[0, 0.4, -0.15]} // за персонажами
    >
      <planeGeometry args={[14, 6]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        opacity={0.4}
      />
    </mesh>
  );
}

function MistLayer() {
  const texture = useTexture(`${ASSET_BASE}/stage-fog.png`);
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();

      // медленное движение
      ref.current.position.x = Math.sin(t * 0.15) * 0.3;
      ref.current.position.y = -0.36 + Math.sin(t * 0.25) * 0.09;

      // лёгкое дыхание
      const scale = 1 + Math.sin(t * 0.3) * 0.05;
      ref.current.scale.set(scale, scale, 1);

      const material = ref.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.32 + Math.sin(t * 0.48) * 0.06;
    }
  });

  return (
    <mesh
      ref={ref}
      position={[0, -0.8, -0.1]}
    >
      <planeGeometry args={[17, 5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        opacity={0.32}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
