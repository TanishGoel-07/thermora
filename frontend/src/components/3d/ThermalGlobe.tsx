import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { Flame, ShieldCheck, Activity, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Inner Globe with enhanced wireframe, thermal particles, and glowing atmosphere
function GlobeMesh({ htsiScore = 75 }: { htsiScore?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const atmosphereRef = useRef<THREE.Mesh>(null!);
  const innerCoreRef = useRef<THREE.Mesh>(null!);

  // Determine dynamic risk colors
  const { colorHex, emissiveHex } = useMemo(() => {
    if (htsiScore >= 80) return { colorHex: "#DC2626", emissiveHex: "#EF4444" };
    if (htsiScore >= 65) return { colorHex: "#F97316", emissiveHex: "#FFB454" };
    if (htsiScore >= 45) return { colorHex: "#F59E0B", emissiveHex: "#FFC875" };
    return { colorHex: "#10B981", emissiveHex: "#34D399" };
  }, [htsiScore]);

  const thermalColor = useMemo(() => new THREE.Color(colorHex), [colorHex]);
  const emissiveColor = useMemo(() => new THREE.Color(emissiveHex), [emissiveHex]);

  // Generate 1,800 latitude/longitude heat points distributed on the sphere
  const { positions, colors, sizes } = useMemo(() => {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const radius = 2.06;

    const baseCol = new THREE.Color(colorHex);
    const hotCol = new THREE.Color("#FFFFFF");
    const darkCol = new THREE.Color("#1E2A3E");

    for (let i = 0; i < count; i++) {
      // Golden spiral distribution
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      // Small jitter for heat particle cloud depth
      const r = radius + (Math.random() - 0.5) * 0.08;
      pos[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Varied heat intensity per particle
      const intensity = Math.random();
      const mixed = intensity > 0.85 ? hotCol : intensity > 0.35 ? baseCol : darkCol;
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;

      sz[i] = intensity > 0.8 ? 0.055 : 0.035;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, [colorHex]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.16;
      particlesRef.current.rotation.x = Math.sin(time * 0.2) * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= delta * 0.06;
    }
    if (innerCoreRef.current) {
      const scale = 1 + Math.sin(time * 1.5) * 0.03;
      innerCoreRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Structural Globe Wireframe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 40, 40]} />
        <meshStandardMaterial
          color="#090D14"
          wireframe
          transparent
          opacity={0.35}
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Surface Heat Point Cloud */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.045}
          transparent
          opacity={0.85}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Atmospheric Glow Shell */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[2.25, 32, 32]} />
        <meshBasicMaterial
          color={thermalColor}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core Glowing Orb */}
      <mesh ref={innerCoreRef}>
        <Sphere args={[1.65, 24, 24]}>
          <meshStandardMaterial
            color={thermalColor}
            emissive={emissiveColor}
            emissiveIntensity={0.25}
            transparent
            opacity={0.08}
            roughness={0.9}
          />
        </Sphere>
      </mesh>
    </group>
  );
}

// 2D Canvas Fallback (reduced motion or WebGL fallback)
function Globe2DFallback({ htsiScore = 75 }: { htsiScore?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = 85;

      const baseColor =
        htsiScore >= 80 ? "239, 68, 68" : htsiScore >= 65 ? "249, 115, 22" : htsiScore >= 45 ? "245, 158, 11" : "16, 185, 129";

      // Glow backdrop
      const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.3);
      grad.addColorStop(0, `rgba(${baseColor}, 0.22)`);
      grad.addColorStop(1, "rgba(6, 8, 12, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Outer Ring
      ctx.strokeStyle = `rgba(${baseColor}, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Latitude rings
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      for (let i = -r + 20; i < r; i += 28) {
        ctx.beginPath();
        const widthAtY = Math.sqrt(Math.max(0, r * r - i * i));
        ctx.ellipse(cx, cy + i, widthAtY, widthAtY * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Heat core orbit point
      ctx.fillStyle = `rgb(${baseColor})`;
      ctx.shadowColor = `rgb(${baseColor})`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle) * (r * 0.6),
        cy + Math.sin(angle) * (r * 0.35),
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      angle += 0.025;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [htsiScore]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      className="mx-auto block"
    />
  );
}

export function ThermalGlobe({
  htsiScore = 75,
  wardName = "Selected Ward",
  className,
}: {
  htsiScore?: number;
  wardName?: string;
  className?: string;
}) {
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  const showFallback = hasWebGLError || prefersReducedMotion;

  return (
    <div
      className={cn(
        "relative w-full h-[300px] sm:h-[340px] rounded-xl2 bg-base-900/90 border border-base-750/80 p-4 flex flex-col justify-between overflow-hidden shadow-panel backdrop-blur-md group",
        className
      )}
    >
      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between pointer-events-none">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-medium">
            <Activity size={12} className="text-ember-400 animate-pulse" />
            <span>3D SATELLITE THERMAL FIELD</span>
          </div>
          <div className="text-sm font-bold text-white tracking-tight mt-0.5">
            {wardName}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-base-800/90 border border-base-700 text-[10px] font-mono text-slate-300 shadow-sm">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="hidden xs:inline">SYNCHRONIZED</span>
        </div>
      </div>

      {/* 3D Canvas / Fallback Area */}
      <div className="absolute inset-0 flex items-center justify-center pt-3">
        {!showFallback ? (
          <Suspense fallback={<Globe2DFallback htsiScore={htsiScore} />}>
            <Canvas
              camera={{ position: [0, 0, 5.2], fov: 45 }}
              onCreated={() => setHasWebGLError(false)}
              onError={() => setHasWebGLError(true)}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={0.65} />
              <pointLight position={[10, 12, 10]} intensity={1.2} />
              <pointLight position={[-10, -10, -10]} intensity={0.4} color="#38BDF8" />
              <GlobeMesh htsiScore={htsiScore} />
              <OrbitControls
                enableZoom={false}
                autoRotate
                autoRotateSpeed={1.2}
                dampingFactor={0.05}
                enableDamping
                maxPolarAngle={Math.PI / 1.45}
                minPolarAngle={Math.PI / 3.2}
              />
            </Canvas>
          </Suspense>
        ) : (
          <Globe2DFallback htsiScore={htsiScore} />
        )}
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-base-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-base-750/70 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <Flame size={13} className="text-ember-400" />
          <span>HTSI:</span>
          <strong className="text-white font-bold data-num">{Math.round(htsiScore)}</strong>
          <span className="text-slate-500">/ 100</span>
        </span>
        <span className="flex items-center gap-1 text-slate-400 text-[10px]">
          <RotateCw size={10} className="text-slate-400" />
          <span>360° interactive</span>
        </span>
      </div>
    </div>
  );
}
