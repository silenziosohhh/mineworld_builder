import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
        case 'Space':
          m.up = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          m.down = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
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
        case 'Space':
          m.up = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          m.down = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
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

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const m = movementRef.current;
    const isMoving =
      m.forward || m.backward || m.left || m.right || m.up || m.down;
    if (!isMoving) return;

    const baseSpeed = 12;
    const speed = (m.boost ? baseSpeed * 2.25 : baseSpeed) * delta;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const move = new THREE.Vector3();
    if (m.forward) move.add(forward);
    if (m.backward) move.sub(forward);
    if (m.right) move.add(right);
    if (m.left) move.sub(right);
    if (m.up) move.y += 1;
    if (m.down) move.y -= 1;

    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(speed);

    camera.position.add(move);
    controls.target.add(move);
    controls.update();
  });

  return null;
};

export const VoxelScene: React.FC = () => {
  const setTool = useWorldStore((state) => state.setTool);
  const tool = useWorldStore((state) => state.tool);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

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

  return (
    <div 
      className="relative w-full h-full bg-slate-900"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas camera={{ position: [10, 10, 10], fov: 50, far: 10000 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <Stars />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <Bvh firstHitOnly>
            <VoxelGrid />
          </Bvh>
        </Suspense>
        <KeyboardNavigation controlsRef={controlsRef} />
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          minDistance={2}
          maxDistance={100}
          enableDamping
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: tool === 'view' ? THREE.MOUSE.ROTATE : -1 as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
          }}
        />
         // GizmoHelper, ci sono ancora un po di problemi con l'orientation
        <GizmoHelper alignment="top-right" margin={[320, 125]}>
          <GizmoViewport 
            axisColors={['#ff3653', '#0adb50', '#2c8fdf']} 
            labelColor="black"
            hideNegativeAxes
          />
        </GizmoHelper>
      </Canvas>
      
      <BuilderUI />
    </div>
  );
};
