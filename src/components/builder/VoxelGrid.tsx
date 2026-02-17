import React, { useMemo, useState, memo } from 'react';
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

const lightConfig: Record<string, { color: string; intensity: number; distance: number; offsets: number[] }> = {
  // Level 15 (Max Light)
  sea_lantern: { color: '#e5ffff', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  glowstone: { color: '#ffdd66', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  shroomlight: { color: '#ffb366', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  jack_o_lantern: { color: '#ffaa00', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  beacon: { color: '#aaffff', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  lantern: { color: '#ffd966', intensity: 2.0, distance: 15, offsets: [0.2] },
  fire: { color: '#ffaa00', intensity: 2.0, distance: 15, offsets: [0.2] },
  lava: { color: '#ff6600', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  stationary_lava: { color: '#ff6600', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  campfire: { color: '#ffaa00', intensity: 2.0, distance: 15, offsets: [0.2] },
  froglight: { color: '#e5ffff', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  ochre_froglight: { color: '#ffdd66', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  pearlescent_froglight: { color: '#e5ffff', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },
  verdant_froglight: { color: '#ccffcc', intensity: 2.0, distance: 15, offsets: [0.6, -0.6] },

  // Level 14
  torch: { color: '#ffd966', intensity: 1.8, distance: 14, offsets: [0.2] },
  end_rod: { color: '#ffffff', intensity: 1.8, distance: 14, offsets: [0.2] },

  // Level 10
  soul_lantern: { color: '#33ffff', intensity: 1.2, distance: 10, offsets: [0.2] },
  soul_torch: { color: '#33ffff', intensity: 1.2, distance: 10, offsets: [0.2] },
  soul_campfire: { color: '#33ffff', intensity: 1.2, distance: 10, offsets: [0.2] },
  crying_obsidian: { color: '#d023d9', intensity: 1.2, distance: 10, offsets: [0.6, -0.6] },

  // Level 7
  redstone_torch: { color: '#ff0000', intensity: 0.8, distance: 7, offsets: [0.2] },
  amethyst_cluster: { color: '#d8b1ff', intensity: 0.8, distance: 7, offsets: [0.2] },

  // Level 3
  magma_block: { color: '#ff6600', intensity: 0.4, distance: 3, offsets: [0.6, -0.6] },
};

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
  materialProps?: any;
  castShadow?: boolean;
}> = ({ blockDef, blocks, isBase, geometry, materialProps, castShadow = true }) => {
  if (!blockDef.texture || blocks.length === 0) return null;

  const texture = useTexture(blockDef.texture, (tex) => {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  // Se è una fonte di luce, usiamo la texture come emissiveMap.
  // Questo fa sì che il blocco brilli mantenendo i dettagli della texture (es. il legno della torcia o i disegni della lanterna)
  // invece di diventare un blocco piatto monocolore.
  const finalMaterialProps = useMemo(() => {
    if (materialProps?.emissive) {
      return {
        ...materialProps,
        emissive: 'white', // Bianco per esaltare i colori originali della texture
        emissiveMap: texture,
      };
    }
    return materialProps;
  }, [materialProps, texture]);

  return (
    <Instances range={blocks.length} geometry={geometry || boxGeometry} castShadow={castShadow} receiveShadow>
      <meshStandardMaterial map={texture} color="white" transparent={blockDef.id === 'torch' || blockDef.id === 'glass'} opacity={blockDef.id === 'glass' ? 0.3 : 1} alphaTest={0.1} {...finalMaterialProps} />
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
  materialProps?: any;
  castShadow?: boolean;
}> = ({ blockDef, blocks, isBase, geometry, materialProps, castShadow = true }) => {
  if (blocks.length === 0) return null;

  return (
    <Instances range={blocks.length} geometry={geometry || boxGeometry} castShadow={castShadow} receiveShadow>
      <meshStandardMaterial color="white" {...materialProps} />
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

export const VoxelGrid: React.FC = () => {
  const blocksMap = useWorldStore((s) => s.blocks);
  const palette = useWorldStore((s) => s.palette);
  const addBlock = useWorldStore((s) => s.addBlock);
  const tool = useWorldStore((s) => s.tool);
  const settings = useWorldStore((s) => s.settings);
  const hiddenBlockIds = useWorldStore((s) => s.hiddenBlockIds);

  // Mappa delle posizioni occupate per calcolare l'occlusione della luce
  const occupiedBlocks = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(blocksMap).forEach((b) => {
      if (b.type === '_base_empty') return;
      const [x, y, z] = b.position;
      map.set(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`, b.type);
    });
    return map;
  }, [blocksMap]);

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

  return (
    <group>

      {Object.entries(blocksByType).map(([type, blocks]) => {
        const blockDef = palette.find((b) => b.id === type);
        if (!blockDef) return null;

        // Seleziona la geometria in base al tipo di blocco
        let customGeometry = boxGeometry;
        if (type === 'torch') customGeometry = torchGeometry;
        else if (type.includes('stairs') || type.includes('slab')) customGeometry = slabGeometry;

        const lightInfo = lightConfig[type];
        const isLightSource = !!lightInfo;

        const materialProps = isLightSource ? { 
          emissive: lightInfo.color, 
          emissiveIntensity: 3, // Aumentato per rendere il blocco visivamente molto luminoso (effetto glow)
          toneMapped: false 
        } : undefined;

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

        let layer;
        if (blockDef.texture) {
          layer = (
            <LayerErrorBoundary
              key={type}
              fallback={<ColoredBlockLayer blockDef={blockDef} blocks={blocks} geometry={customGeometry} materialProps={materialProps} castShadow={!isLightSource} />}
            >
              <TexturedBlockLayer blockDef={blockDef} blocks={blocks} geometry={customGeometry} materialProps={materialProps} castShadow={!isLightSource} />
            </LayerErrorBoundary>
          );
        } else {
          layer = <ColoredBlockLayer key={type} blockDef={blockDef} blocks={blocks} geometry={customGeometry} materialProps={materialProps} castShadow={!isLightSource} />;
        }

        if (isLightSource) {
          return (
            <group key={type}>
              {layer}
              {blocks.map((b) => (
                <group key={`lights-${b.id}`}>
                  {lightInfo.offsets.map((offset, i) => {
                    // Calcola la posizione del blocco adiacente nella direzione della luce
                    const dy = offset > 0 ? 1 : -1;
                    const nx = Math.round(b.position[0]);
                    const ny = Math.round(b.position[1]) + dy;
                    const nz = Math.round(b.position[2]);
                    
                    // Controlla se c'è un blocco che ostruisce
                    const neighborId = occupiedBlocks.get(`${nx},${ny},${nz}`);
                    if (neighborId) {
                      // Se il blocco vicino NON è trasparente, non renderizzare la luce
                      const isTransp = neighborId.includes('glass') || 
                                       neighborId.includes('leaves') || 
                                       neighborId.includes('slab') || 
                                       neighborId.includes('stairs') ||
                                       neighborId.includes('fence') ||
                                       neighborId.includes('torch') ||
                                       neighborId === 'water' ||
                                       neighborId === 'ice' ||
                                       neighborId === 'beacon';
                      if (!isTransp) return null;
                    }

                    return (
                      <pointLight
                        key={`light-${i}`}
                        position={[b.position[0], b.position[1] + offset, b.position[2]]}
                        intensity={lightInfo.intensity}
                        distance={lightInfo.distance}
                        decay={1}
                        color={lightInfo.color}
                      />
                    );
                  })}
                </group>
              ))}
            </group>
          );
        }

        return layer;
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
