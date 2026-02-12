import React, { useMemo, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { Instances, Instance, useTexture, Grid } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { snapToGrid } from '../../engine/voxelEngine';
import * as THREE from 'three';
import type { BlockData, BlockDefinition, Vector3Tuple } from '../../engine/types';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

interface GridBlockProps {
id: string;
position: Vector3Tuple;
color?: string;
}

const GridBlock: React.FC<GridBlockProps> = ({ id, position, color }) => {
const [hovered, setHover] = useState(false);
const addBlock = useWorldStore((state) => state.addBlock);
const removeBlock = useWorldStore((state) => state.removeBlock);
const tool = useWorldStore((state) => state.tool);

const handleClick = (e: ThreeEvent<any>) => {
e.stopPropagation();

    if (tool === 'erase') {
      removeBlock(position);
      return;
    }

if (tool !== 'build') return;

if (e.altKey || e.shiftKey) {
  removeBlock(position);
  return;
}

if (e.face?.normal) {
  const { x, y, z } = e.face.normal;
  const [px, py, pz] = position;
  addBlock([px + x, py + y, pz + z]);
}


};

return (
<Instance
position={position}
onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
onPointerOut={() => setHover(false)}
onClick={handleClick}
color={hovered ? '#43ff32' : (color || 'white')}
/>
);
};

const TexturedBlockLayer: React.FC<{
blockDef: BlockDefinition;
blocks: BlockData[];
}> = ({ blockDef, blocks }) => {
if (!blockDef.texture || blocks.length === 0) return null;

const texture = useTexture(blockDef.texture, (tex) => {
tex.magFilter = THREE.NearestFilter;
tex.minFilter = THREE.NearestFilter;
tex.colorSpace = THREE.SRGBColorSpace;
});

return ( <Instances range={blocks.length} geometry={boxGeometry}> <meshStandardMaterial map={texture} color="white" />
{blocks.map((block) => ( <GridBlock
      key={block.id}
      id={block.id}
      position={block.position}
    />
))} </Instances>
);
};

const ColoredBlockLayer: React.FC<{
blockDef: BlockDefinition;
blocks: BlockData[];
}> = ({ blockDef, blocks }) => {
if (blocks.length === 0) return null;

return ( <Instances range={blocks.length} geometry={boxGeometry}> <meshStandardMaterial color="white" />
{blocks.map((block) => ( <GridBlock
      key={block.id}
      id={block.id}
      position={block.position}
      color={blockDef.color}
    />
))} </Instances>
);
};

class LayerErrorBoundary extends React.Component<
{ children: React.ReactNode; fallback: React.ReactNode },
{ hasError: boolean }

> {
  state = { hasError: false };

static getDerivedStateFromError() {
return { hasError: true };
}

componentDidCatch(error: any) {
console.error('Errore caricamento texture:', error);
}

render() {
return this.state.hasError ? this.props.fallback : this.props.children;
}
}

export const VoxelGrid: React.FC = () => {
const blocksMap = useWorldStore((state) => state.blocks);
const palette = useWorldStore((state) => state.palette);
const addBlock = useWorldStore((state) => state.addBlock);
const removeBlock = useWorldStore((state) => state.removeBlock);
const tool = useWorldStore((state) => state.tool);

const blocksByType = useMemo(() => {
const groups: Record<string, BlockData[]> = {};
Object.values(blocksMap).forEach((block) => {
if (!groups[block.type]) groups[block.type] = [];
groups[block.type].push(block);
});
return groups;
}, [blocksMap]);

const handlePlaneInteraction = (e: ThreeEvent<any>) => {
if (tool !== 'build') return;


e.stopPropagation();
if (e.altKey || e.shiftKey) return;

const [x, , z] = snapToGrid(e.point.x, 0, e.point.z);
addBlock([x, 0.5, z]);


};

return ( <group>
{Object.entries(blocksByType).map(([type, blocks]) => {
const blockDef = palette.find((b) => b.id === type);
if (!blockDef) return null;


    if (blockDef.texture) {
      return (
        <LayerErrorBoundary
          key={type}
          fallback={
            <ColoredBlockLayer
              blockDef={blockDef}
              blocks={blocks}
            />
          }
        >
          <TexturedBlockLayer
            blockDef={blockDef}
            blocks={blocks}
          />
        </LayerErrorBoundary>
      );
    }

    return (
      <ColoredBlockLayer
        key={type}
        blockDef={blockDef}
        blocks={blocks}
      />
    );
  })}

  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, -0.01, 0]}
    onClick={(e) => { if (e.delta <= 5) handlePlaneInteraction(e); }}
    onPointerMove={(e) => { if (e.buttons === 1) handlePlaneInteraction(e); }}
  >
    <planeGeometry args={[10000, 10000]} />
    <meshStandardMaterial
      color="#e5e7eb"
      opacity={0}
      transparent
      depthWrite={false}
    />
  </mesh>

  <Grid
    position={[0, 0, 0]}
    args={[10.5, 10.5]}
    cellSize={1}
    cellThickness={0.6}
    cellColor="#6f6f6f"
    sectionSize={5}
    sectionThickness={1}
    sectionColor="#1c1c1c"
    fadeDistance={500}
    infiniteGrid
    side={THREE.DoubleSide}
  />
</group>

);
};
