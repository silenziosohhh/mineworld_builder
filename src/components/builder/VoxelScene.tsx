import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Bvh } from '@react-three/drei';
import * as THREE from 'three';
import { VoxelGrid } from './VoxelGrid';
import { BuilderUI } from './BuilderUI';
import { useWorldStore } from '../../store/worldStore';

export const VoxelScene: React.FC = () => {
  const setTool = useWorldStore((state) => state.setTool);
  const tool = useWorldStore((state) => state.tool);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setTool('view');
      if (e.key === '2') setTool('build');
      if (e.key === '4') setTool('erase');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  return (
    <div 
      className="w-full h-full bg-slate-900 relative"
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
        <OrbitControls 
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
      </Canvas>
      
      <BuilderUI />
    </div>
  );
};