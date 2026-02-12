import React, { useMemo, useState, memo } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { Instances, Instance, useTexture, Grid } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { snapToGrid } from '../../engine/voxelEngine';
import * as THREE from 'three';
import type { BlockData, BlockDefinition, Vector3Tuple } from '../../engine/types';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

interface GridBlockProps {
position: Vector3Tuple;
color?: string;
isBase?: boolean;
}

// Usa memo per evitare re-render inutili di migliaia di blocchi
const GridBlock: React.FC<GridBlockProps> = memo(({ position, color, isBase }) => {
const [hovered, setHover] = useState(false);
const addBlock = useWorldStore((state) => state.addBlock);
const removeBlock = useWorldStore((state) => state.removeBlock);
const setBaseEmpty = useWorldStore((state) => state.setBaseEmpty);
const tool = useWorldStore((state) => state.tool);
// NON sottoscriviamo a isDraggingUI qui per evitare re-render di massa
// Lo leggeremo direttamente dallo store quando serve

const handleClick = (e: ThreeEvent<any>) => {
e.stopPropagation();
if (useWorldStore.getState().isDraggingUI) return;

    if (tool === 'erase') {
      if (isBase) {
        setBaseEmpty(position);
        return;
      }
      removeBlock(position);
      return;
    }

if (tool !== 'build') return;

if (e.altKey || e.shiftKey) {
  if (isBase) {
    setBaseEmpty(position);
    return;
  }
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
onPointerOver={(e) => { e.stopPropagation(); if (!useWorldStore.getState().isDraggingUI) setHover(true); }}
onPointerOut={() => setHover(false)}
onClick={handleClick}
color={hovered ? '#43ff32' : (color || 'white')}
/>
);
});

const TexturedBlockLayer: React.FC<{
blockDef: BlockDefinition;
blocks: BlockData[];
isBase?: boolean;
}> = ({ blockDef, blocks, isBase }) => {
if (!blockDef.texture || blocks.length === 0) return null;

const texture = useTexture(blockDef.texture, (tex) => {
tex.magFilter = THREE.NearestFilter;
tex.minFilter = THREE.NearestFilter;
tex.colorSpace = THREE.SRGBColorSpace;
});

return ( <Instances range={blocks.length} geometry={boxGeometry} castShadow receiveShadow> <meshStandardMaterial map={texture} color="white" />
{blocks.map((block) => ( <GridBlock
      key={block.id}
      position={block.position}
      isBase={isBase}
    />
))} </Instances>
);
};

const ColoredBlockLayer: React.FC<{
blockDef: BlockDefinition;
blocks: BlockData[];
isBase?: boolean;
}> = ({ blockDef, blocks, isBase }) => {
if (blocks.length === 0) return null;

return ( <Instances range={blocks.length} geometry={boxGeometry} castShadow receiveShadow> <meshStandardMaterial color="white" />
{blocks.map((block) => ( <GridBlock
      key={block.id}
      position={block.position}
      color={blockDef.color}
      isBase={isBase}
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

const GrassBlockLayer: React.FC<{
  blockDef: BlockDefinition;
  blocks: BlockData[];
  isBase?: boolean;
}> = ({ blockDef, blocks, isBase }) => {
  if (!blockDef.texture || blocks.length === 0) return null;

  // Assumiamo che la texture definita sia quella laterale (es. grass_block_side.png)
  // e cerchiamo di derivare le altre (top e dirt)
  const sideUrl = blockDef.texture;
  const topUrl = sideUrl.replace('_side', '_top');
  const bottomUrl = sideUrl.replace('grass_block_side', 'dirt');

  const textures = useTexture([
    sideUrl,   // Right
    sideUrl,   // Left
    topUrl,    // Top
    bottomUrl, // Bottom
    sideUrl,   // Front
    sideUrl    // Back
  ]);

  React.useLayoutEffect(() => {
    textures.forEach(tex => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
    });
  }, [textures]);

  return (
    <Instances range={blocks.length} geometry={boxGeometry} castShadow receiveShadow>
      <meshStandardMaterial attach="material-0" map={textures[0]} />
      <meshStandardMaterial attach="material-1" map={textures[1]} />
      <meshStandardMaterial attach="material-2" map={textures[2]} color="#91bd59" />
      <meshStandardMaterial attach="material-3" map={textures[3]} />
      <meshStandardMaterial attach="material-4" map={textures[4]} />
      <meshStandardMaterial attach="material-5" map={textures[5]} />
      {blocks.map((block) => (
        <GridBlock key={block.id} position={block.position} isBase={isBase} />
      ))}
    </Instances>
  );
};

const BaseLayer: React.FC<{
  enabled: boolean;
  blockId: string;
  size: number;
}> = memo(({ enabled, blockId, size }) => {
  const palette = useWorldStore((state) => state.palette);
  const blocksMap = useWorldStore((state) => state.blocks);
  
  const baseBlocks = useMemo(() => {
    if (!enabled || !blockId) return [];

    // Crea un set di posizioni occupate dai blocchi utente
    const occupied = new Set<string>();
    Object.values(blocksMap).forEach((b) => {
      // Controlla SOLO se c'è un blocco (o un "vuoto") esattamente al livello del pavimento (-0.5)
      if (Math.abs(b.position[1] + 0.5) < 0.01) {
        occupied.add(`${b.position[0]},${b.position[2]}`);
      }
    });

    const blocks: BlockData[] = [];
    const half = Math.floor(size / 2);
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        if (occupied.has(`${x},${z}`)) continue; // Salta se c'è già un blocco
        blocks.push({
          id: `base-${x}-${z}`,
          type: blockId,
          position: [x, -0.5, z],
          rotation: [0, 0, 0]
        } as any);
      }
    }
    return blocks;
  }, [enabled, blockId, size, blocksMap]);

  if (!enabled || baseBlocks.length === 0) return null;

  const blockDef = palette.find((b) => b.id === blockId);
  if (!blockDef) return null;

  if (blockId === 'grass_block' && blockDef.texture) {
    return (
      <LayerErrorBoundary
        fallback={<ColoredBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />}
      >
        <GrassBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />
      </LayerErrorBoundary>
    );
  }

  if (blockDef.texture) {
    return (
      <LayerErrorBoundary
        fallback={<ColoredBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />}
      >
        <TexturedBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />
      </LayerErrorBoundary>
    );
  }

  return (
    <ColoredBlockLayer
      blockDef={blockDef}
      blocks={baseBlocks}
      isBase
    />
  );
});

export const VoxelGrid: React.FC<{
  baseSettings?: { enabled: boolean; blockId: string; size: number };
}> = ({ baseSettings }) => {
const blocksMap = useWorldStore((state) => state.blocks);
const palette = useWorldStore((state) => state.palette);
const addBlock = useWorldStore((state) => state.addBlock);
  const tool = useWorldStore((state) => state.tool);
  const settings = useWorldStore((state) => state.settings);
  const hiddenBlockIds = useWorldStore((state) => state.hiddenBlockIds);

  const blocksByType = useMemo(() => {
    const groups: Record<string, BlockData[]> = {};
    Object.values(blocksMap).forEach((block) => {
      if (block.type === '_base_empty') return; // Non renderizzare i blocchi vuoti
      if (hiddenBlockIds.includes(block.type)) return; // Non renderizzare blocchi nascosti
      if (!groups[block.type]) groups[block.type] = [];
      groups[block.type].push(block);
    });
    return groups;
  }, [blocksMap, hiddenBlockIds]);

const handlePlaneInteraction = (e: ThreeEvent<any>) => {
if (tool !== 'build') return;
if (useWorldStore.getState().isDraggingUI) return;


e.stopPropagation();
if (e.altKey || e.shiftKey) return;

const [x, , z] = snapToGrid(e.point.x, 0, e.point.z);
addBlock([x, 0.5, z]);


};

return ( <group>
  {baseSettings && <BaseLayer {...baseSettings} />}
{Object.entries(blocksByType).map(([type, blocks]) => {
const blockDef = palette.find((b) => b.id === type);
if (!blockDef) return null;

    if (type === 'grass_block' && blockDef.texture) {
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
          <GrassBlockLayer blockDef={blockDef} blocks={blocks} />
        </LayerErrorBoundary>
      );
    }

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
    receiveShadow
  >
    <planeGeometry args={[10000, 10000]} />
    <meshStandardMaterial
      color="#e5e7eb"
      opacity={0}
      transparent
      depthWrite={false}
    />
  </mesh>

  {settings.showGrid && (
    <Grid
      position={[0, -0.01, 0]}
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
  )}
</group>

);
};
