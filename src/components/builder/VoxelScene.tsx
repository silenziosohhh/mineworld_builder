import React, { Suspense, useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Bvh, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { VoxelGrid } from './VoxelGrid';
import { BuilderUI } from './BuilderUI';
import { useWorldStore } from '../../store/worldStore';

type MovementState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
};

const shouldIgnoreHotkey = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
};

const KeyboardNavigation: React.FC<{ controlsRef: React.RefObject<OrbitControlsImpl | null> }> = ({ controlsRef }) => {
  const movementRef = useRef<MovementState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreHotkey(e)) return;
      const m = movementRef.current;
      switch (e.code) {
        case 'KeyW':
          m.forward = true;
          break;
        case 'KeyS':
          m.backward = true;
          break;
        case 'KeyA':
          m.left = true;
          break;
        case 'KeyD':
          m.right = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          m.boost = true;
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const m = movementRef.current;
      switch (e.code) {
        case 'KeyW':
          m.forward = false;
          break;
        case 'KeyS':
          m.backward = false;
          break;
        case 'KeyA':
          m.left = false;
          break;
        case 'KeyD':
          m.right = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          m.boost = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Ottimizzazione: Creiamo i vettori una sola volta per non allocare memoria ogni frame (Garbage Collection)
  const vectors = useMemo(() => ({
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    move: new THREE.Vector3(),
    upAxis: new THREE.Vector3(0, 1, 0)
  }), []);

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const m = movementRef.current;
    const isMoving =
      m.forward || m.backward || m.left || m.right || m.up || m.down;
    if (!isMoving) return;

    const baseSpeed = 12;
    const speed = (m.boost ? baseSpeed * 2.25 : baseSpeed) * delta;

    // Reset e riutilizzo vettori
    vectors.forward.set(0, 0, 0);
    camera.getWorldDirection(vectors.forward);
    vectors.forward.y = 0;
    if (vectors.forward.lengthSq() > 0) vectors.forward.normalize();

    vectors.right.crossVectors(vectors.forward, vectors.upAxis)
      .normalize();

    vectors.move.set(0, 0, 0);
    if (m.forward) vectors.move.add(vectors.forward);
    if (m.backward) vectors.move.sub(vectors.forward);
    if (m.right) vectors.move.add(vectors.right);
    if (m.left) vectors.move.sub(vectors.right);
    if (m.up) vectors.move.y += 1;
    if (m.down) vectors.move.y -= 1;

    if (vectors.move.lengthSq() === 0) return;
    vectors.move.normalize().multiplyScalar(speed);

    camera.position.add(vectors.move);
    controls.target.add(vectors.move);
    controls.update();
  });

  return null;
};

// Componente helper per aggiornare la camera quando cambiano le impostazioni
const CameraUpdater: React.FC<{ fov: number }> = ({ fov }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);
  return null;
};

// Gestisce il ciclo giorno/notte e l'illuminazione
const EnvironmentManager: React.FC = () => {
  const settings = useWorldStore((state) => state.settings);
  
  // Usiamo refs per manipolare direttamente gli oggetti Three.js
  // Questo evita re-render di React a 60fps che ucciderebbero le performance
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);
  const skyRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (settings.autoRotateDayNight) {
      const t = clock.getElapsedTime() * 0.2; // Velocità rotazione
      const radius = 100;
      const x = Math.sin(t) * radius;
      const y = Math.cos(t) * radius;
      const sunPos: [number, number, number] = [x, y, 0];
      
      // Aggiornamento diretto (Zero React Overhead)
      if (dirLightRef.current) {
        dirLightRef.current.position.set(x, y, 0);
        dirLightRef.current.intensity = Math.max(0, y / 40);
      }
      if (ambLightRef.current) {
        ambLightRef.current.intensity = Math.max(0.1, y / 200 + 0.2);
      }
      // Aggiorna la posizione del sole nello shader del cielo
      if (skyRef.current && skyRef.current.material && skyRef.current.material.uniforms) {
        skyRef.current.material.uniforms.sunPosition.value.set(x, y, 0);
      }
    }
  });

  // Gestione preset statici (Day/Night) quando l'auto-rotazione è spenta
  useEffect(() => {
    if (!settings.autoRotateDayNight) {
      const isDay = settings.timePreset === 'day';
      const pos: [number, number, number] = isDay ? [50, 100, 50] : [50, -20, 50];
      
      if (dirLightRef.current) {
        dirLightRef.current.position.set(...pos);
        dirLightRef.current.intensity = isDay ? 1.5 : 0;
      }
      if (ambLightRef.current) {
        ambLightRef.current.intensity = isDay ? 0.4 : 0.1;
      }
      if (skyRef.current?.material?.uniforms) {
        skyRef.current.material.uniforms.sunPosition.value.set(...pos);
      }
    }
  }, [settings.timePreset, settings.autoRotateDayNight]);

  return (
    <>
      <Sky ref={skyRef} sunPosition={[50, 100, 50]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight ref={ambLightRef} intensity={0.4} />
      <directionalLight 
        ref={dirLightRef}
        position={[50, 100, 50]} 
        intensity={1.5} 
        castShadow={settings.shadows}
        shadow-mapSize={[2048, 2048]} 
      />
    </>
  );
};

export const VoxelScene: React.FC = () => {
  const setTool = useWorldStore((state) => state.setTool);
  const tool = useWorldStore((state) => state.tool);
  const isMaterialListOpen = useWorldStore((state) => state.isMaterialListOpen);
  const isDraggingUI = useWorldStore((state) => state.isDraggingUI);
  const settings = useWorldStore((state) => state.settings);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  
  const [baseSettings, setBaseSettings] = useState({
    enabled: false,
    blockId: 'grass_block',
    size: 32
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreHotkey(e)) return;

      const key = e.key.toLowerCase();
      if (key === '1' || key === 'v') setTool('view');
      if (key === '2' || key === 'b') setTool('build');
      if (key === '3' || key === '4' || key === 'e') setTool('erase');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  // Calcola margine dinamico: se la lista materiali è aperta, sposta il gizmo più a sinistra
  const gizmoMargin: [number, number] = isMaterialListOpen ? [300, 80] : [80, 80];

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-slate-900 z-0"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas shadows={settings.shadows} camera={{ position: [10, 10, 10], fov: settings.fov, far: 10000 }}>
        <CameraUpdater fov={settings.fov} />
        <EnvironmentManager />
        <Suspense fallback={null}>
          <Bvh firstHitOnly>
            <VoxelGrid baseSettings={baseSettings} />
          </Bvh>
        </Suspense>
        <KeyboardNavigation controlsRef={controlsRef} />
        <OrbitControls 
          ref={controlsRef}
          enabled={!isDraggingUI}
          makeDefault 
          minDistance={2}
          maxDistance={100}
          enableDamping={false}
          rotateSpeed={settings.mouseSensitivity}
          mouseButtons={{
            LEFT: tool === 'view' ? THREE.MOUSE.ROTATE : -1 as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
          }}
        />
        <GizmoHelper alignment="top-right" margin={gizmoMargin} renderPriority={1}>
          <GizmoViewport 
            axisColors={['#ff3653', '#0adb50', '#2c8fdf']} 
            labelColor="black"
          />
        </GizmoHelper>
      </Canvas>
      
      <BuilderUI baseSettings={baseSettings} setBaseSettings={setBaseSettings} />
    </div>
  );
};
