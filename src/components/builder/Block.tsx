import React, { useState, memo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Instance } from '@react-three/drei';
import { useWorldStore } from '../../store/worldStore';
import type { Vector3Tuple } from '../../engine/types';

interface BlockProps {
  id: string;
  position: Vector3Tuple;
}

export const Block: React.FC<BlockProps> = memo(({ position }) => {
  const [hover, setHover] = useState(false);
  const addBlock = useWorldStore((state) => state.addBlock);
  const removeBlock = useWorldStore((state) => state.removeBlock);
  const tool = useWorldStore((state) => state.tool);

  const handleInteraction = (e: ThreeEvent<any>) => {
    if (tool !== 'build') return;

    e.stopPropagation();
    
    if (e.altKey || e.shiftKey) {
      // Remove block on Alt + Click or Shift + Click
      removeBlock(position);
    } else {
      // Add block on face normal
      if (!e.face) return;
      const x = Math.round(e.face.normal.x);
      const y = Math.round(e.face.normal.y);
      const z = Math.round(e.face.normal.z);
      const newPos: Vector3Tuple = [
        position[0] + x,
        position[1] + y,
        position[2] + z,
      ];

      // Prevent placing blocks below the ground
      if (newPos[1] < 0) return;

      addBlock(newPos);
    }
  };

  return (
    <Instance
      position={position}
      color={hover ? '#43ff32' : undefined}
      onClick={(e) => {
        if (e.delta <= 5) handleInteraction(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) handleInteraction(e); // 1 = Tasto sinistro premuto
      }}
      onPointerOver={(e) => { 
        e.stopPropagation(); 
        setHover(true);
        if (e.buttons === 1) handleInteraction(e);
      }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
    />
  );
});