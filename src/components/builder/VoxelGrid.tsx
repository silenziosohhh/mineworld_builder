import React, { useMemo, useState, memo, useEffect } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { Instances, Instance, useTexture, Grid } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { BlockData, BlockDefinition, Vector3Tuple } from '../../engine/types';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// Geometria per le torce (sottile e centrata in basso)
const torchGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
torchGeometry.translate(0, -0.2, 0);

// Geometria per slab/scale (metà altezza)
const slabGeometry = new THREE.BoxGeometry(1, 0.5, 1);
slabGeometry.translate(0, -0.25, 0);

// Y dei layer:
// - base: center = -0.5 (top a 0)
// - costruzione: center = 0.5, 1.5, 2.5...
const EPS_Y = 0.001;

function snapBuildY(y: number): number {
  return Math.round(y - 0.5) + 0.5;
}

function snapBuildPos(pos: Vector3Tuple): Vector3Tuple {
  const [x, y, z] = pos;
  return [Math.round(x), snapBuildY(y), Math.round(z)];
}

function snapBasePos(pos: Vector3Tuple): Vector3Tuple {
  const [x, , z] = pos;
  return [Math.round(x), -0.5, Math.round(z)];
}

interface GridBlockProps {
  position: Vector3Tuple;
  color?: string;
  isBase?: boolean;
  blockId?: string;
}

const GridBlock: React.FC<GridBlockProps> = memo(({ position, color, isBase, blockId }) => {
  const [hovered, setHover] = useState(false);

  const addBlock = useWorldStore((s) => s.addBlock);
  const removeBlock = useWorldStore((s) => s.removeBlock);
  const setBaseEmpty = useWorldStore((s) => s.setBaseEmpty);
  const setSelectedBlock = useWorldStore((s) => s.setSelectedBlock);
  const setTool = useWorldStore((s) => s.setTool);
  const tool = useWorldStore((s) => s.tool);

  const handleClick = (e: ThreeEvent<any>) => {
    e.stopPropagation();
    if (useWorldStore.getState().isDraggingUI) return;

    const self = isBase ? snapBasePos(position) : snapBuildPos(position);

    if (tool === 'erase') {
      if (isBase) {
        setBaseEmpty(self);
      } else {
        removeBlock(self);
      }
      return;
    }

    if (tool !== 'build') return;

    if (e.altKey || e.shiftKey) {
      if (isBase) {
        setBaseEmpty(self);
      } else {
        removeBlock(self);
      }
      return;
    }

    if (e.face?.normal) {
      const n = e.face.normal;
      const target: Vector3Tuple = [self[0] + n.x, self[1] + n.y, self[2] + n.z];
      addBlock(snapBuildPos(target));
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 1) { // Middle click (Pick Block)
      e.stopPropagation();
      if (blockId) {
        setSelectedBlock(blockId);
        setTool('build');
      }
    }
  };

  return (
    <Instance
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!useWorldStore.getState().isDraggingUI) setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      color={hovered ? '#43ff32' : (color || 'white')}
    />
  );
});

const TexturedBlockLayer: React.FC<{
  blockDef: BlockDefinition;
  blocks: BlockData[];
  isBase?: boolean;
  geometry?: THREE.BufferGeometry;
}> = ({ blockDef, blocks, isBase, geometry }) => {
  if (!blockDef.texture || blocks.length === 0) return null;

  const texture = useTexture(blockDef.texture, (tex) => {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  return (
    <Instances range={blocks.length} geometry={geometry || boxGeometry} castShadow receiveShadow>
      <meshStandardMaterial map={texture} color="white" transparent={blockDef.id === 'torch' || blockDef.id === 'glass'} opacity={blockDef.id === 'glass' ? 0.3 : 1} alphaTest={0.1} />
      {blocks.map((b) => (
        <GridBlock key={b.id} position={b.position as Vector3Tuple} isBase={isBase} blockId={blockDef.id} />
      ))}
    </Instances>
  );
};

const ColoredBlockLayer: React.FC<{
  blockDef: BlockDefinition;
  blocks: BlockData[];
  isBase?: boolean;
  geometry?: THREE.BufferGeometry;
}> = ({ blockDef, blocks, isBase, geometry }) => {
  if (blocks.length === 0) return null;

  return (
    <Instances range={blocks.length} geometry={geometry || boxGeometry} castShadow receiveShadow>
      <meshStandardMaterial color="white" />
      {blocks.map((b) => (
        <GridBlock
          key={b.id}
          position={b.position as Vector3Tuple}
          color={blockDef.color}
          isBase={isBase}
          blockId={blockDef.id}
        />
      ))}
    </Instances>
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

  const sideUrl = blockDef.texture;
  const topUrl = sideUrl.replace('_side', '_top');
  const bottomUrl = sideUrl.replace('grass_block_side', 'dirt');

  const textures = useTexture([sideUrl, sideUrl, topUrl, bottomUrl, sideUrl, sideUrl]);

  React.useLayoutEffect(() => {
    textures.forEach((tex) => {
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
      {blocks.map((b) => (
        <GridBlock key={b.id} position={b.position as Vector3Tuple} isBase={isBase} blockId={blockDef.id} />
      ))}
    </Instances>
  );
};

const BaseLayer: React.FC<{
  enabled: boolean;
  blockId: string;
  size: number;
}> = memo(({ enabled, blockId, size }) => {
  const palette = useWorldStore((s) => s.palette);
  const blocksMap = useWorldStore((s) => s.blocks);

  const baseBlocks = useMemo(() => {
    if (!enabled || !blockId || size <= 0) return [];

    // FIX #1: bounds che producono ESATTAMENTE size celle (pari e dispari)
    const start = -Math.floor(size / 2);
    const end = start + size - 1;

    // FIX #2: ignora i marker '_base_empty' quando calcoli l'occupato,
    // altrimenti cambiando size ti “buchi” la base con buchi fantasma.
    const occupied = new Set<string>();
    Object.values(blocksMap).forEach((b) => {
      if (b.type === '_base_empty') return;
      const p = b.position as Vector3Tuple;
      if (Math.abs(p[1] + 0.5) < 0.01) {
        occupied.add(`${Math.round(p[0])},${Math.round(p[2])}`);
      }
    });

    const out: BlockData[] = [];

    for (let x = start; x <= end; x++) {
      for (let z = start; z <= end; z++) {
        if (occupied.has(`${x},${z}`)) continue;
        out.push({
          id: `base-${x}-${z}`,
          type: blockId,
          position: [x + 0.5, -0.5, z + 0.5],
          // position: [x, -0.5, z],
          rotation: [0, 0, 0]
        } as any);
      }
    }

    return out;
  }, [enabled, blockId, size, blocksMap]);

  if (!enabled || baseBlocks.length === 0) return null;

  const blockDef = palette.find((b) => b.id === blockId);
  if (!blockDef) return null;

  if (blockId === 'grass_block' && blockDef.texture) {
    return (
      <LayerErrorBoundary fallback={<ColoredBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />}>
        <GrassBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />
      </LayerErrorBoundary>
    );
  }

  if (blockDef.texture) {
    return (
      <LayerErrorBoundary fallback={<ColoredBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />}>
        <TexturedBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />
      </LayerErrorBoundary>
    );
  }

  return <ColoredBlockLayer blockDef={blockDef} blocks={baseBlocks} isBase />;
});

const BaseLayerGenerator: React.FC<{
  enabled: boolean;
  blockId: string;
  size: number;
}> = ({ enabled, blockId, size }) => {
  const addBlock = useWorldStore((state) => state.addBlock);
  const blocksMap = useWorldStore((state) => state.blocks);
  useEffect(() => {
    if (!enabled || !blockId || size <= 0) return;
    const start = -Math.floor(size / 2);
    const end = start + size - 1;
    for (let x = start; x <= end; x++) {
      for (let z = start; z <= end; z++) {
        const key = `${x},${0.5},${z}`;
        if (!blocksMap[key]) {
          addBlock([x, 0.5, z], blockId, false);
        }
      }
    }
  }, [enabled, blockId, size]); 
  return null;
};

export const VoxelGrid: React.FC<{
  baseSettings?: { enabled: boolean; blockId: string; size: number };
}> = ({ baseSettings }) => {
  const blocksMap = useWorldStore((s) => s.blocks);
  const palette = useWorldStore((s) => s.palette);
  const addBlock = useWorldStore((s) => s.addBlock);
  const tool = useWorldStore((s) => s.tool);
  const settings = useWorldStore((s) => s.settings);
  const hiddenBlockIds = useWorldStore((s) => s.hiddenBlockIds);

  const blocksByType = useMemo(() => {
    const groups: Record<string, BlockData[]> = {};

    Object.values(blocksMap).forEach((block) => {
      if (block.type === '_base_empty') return;
      if (hiddenBlockIds.includes(block.type)) return;

      const p = snapBuildPos(block.position as Vector3Tuple);
      const snapped = { ...block, position: p } as BlockData;

      if (!groups[snapped.type]) groups[snapped.type] = [];
      groups[snapped.type].push(snapped);
    });

    return groups;
  }, [blocksMap, hiddenBlockIds]);

  const handlePlaneInteraction = (e: ThreeEvent<any>) => {
    if (tool !== 'build') return;
    if (useWorldStore.getState().isDraggingUI) return;

    e.stopPropagation();
    if (e.altKey || e.shiftKey) return;

    const x = Math.round(e.point.x);
    const z = Math.round(e.point.z);
    addBlock([x, 0.5, z]);
  };

  return ( <group>

      {Object.entries(blocksByType).map(([type, blocks]) => {
        const blockDef = palette.find((b) => b.id === type);
        if (!blockDef) return null;

        // Seleziona la geometria in base al tipo di blocco
        let customGeometry = boxGeometry;
        if (type === 'torch') customGeometry = torchGeometry;
        else if (type.includes('stairs') || type.includes('slab')) customGeometry = slabGeometry;

        if (type === 'grass_block' && blockDef.texture) {
          return (
            <LayerErrorBoundary
              key={type}
              fallback={<ColoredBlockLayer blockDef={blockDef} blocks={blocks} />}
            >
              <GrassBlockLayer blockDef={blockDef} blocks={blocks} />
            </LayerErrorBoundary>
          );
        }

        if (blockDef.texture) {
          return (
            <LayerErrorBoundary
              key={type}
              fallback={<ColoredBlockLayer blockDef={blockDef} blocks={blocks} geometry={customGeometry} />}
            >
              <TexturedBlockLayer blockDef={blockDef} blocks={blocks} geometry={customGeometry} />
            </LayerErrorBoundary>
          );
        }

        return <ColoredBlockLayer key={type} blockDef={blockDef} blocks={blocks} geometry={customGeometry} />;
      })}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          if (e.delta <= 5) handlePlaneInteraction(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePlaneInteraction(e);
        }}
        receiveShadow
      >
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial opacity={0} transparent depthWrite={false} />
      </mesh>

      {settings.showGrid && (
        <Grid
          position={[0.5, EPS_Y, 0.5]}
          args={[10, 10]}
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
