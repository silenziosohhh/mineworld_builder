import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BlockData, Vector3Tuple, BlockDefinition } from '../engine/types';
import { generateId, MINECRAFT_BLOCKS, BLOCK_COLOR_MAP, getBlockKey, MINECRAFT_VERSIONS } from '../engine/voxelEngine';
import { fetchMinecraftBlocks, fetchMinecraftVersions } from '../services/minecraftApi';

interface HistoryState {
  past: Record<string, BlockData>[];
  future: Record<string, BlockData>[];
}

export interface WorldSettings {
  shadows: boolean;
  showGrid: boolean;
  fov: number;
  mouseSensitivity: number;
  timePreset: 'day' | 'night';
}

interface WorldState {
  blocks: Record<string, BlockData>;
  history: HistoryState;
  selectedBlockId: string;
  minecraftVersion: string;
  availableVersions: string[];
  palette: BlockDefinition[];
  isLoadingPalette: boolean;
  hiddenBlockTypes: string[]; // Tipi di blocchi nascosti
  tool: 'view' | 'build' | 'erase';
  toolbarDock: 'top' | 'bottom' | 'left' | 'right';
  toolbarCollapsed: boolean;
  currentView: 'perspective' | 'top' | 'front';
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isMaterialListOpen: boolean;
  setMaterialListOpen: (isOpen: boolean) => void;
  isDraggingUI: boolean;
  setDraggingUI: (isDragging: boolean) => void;
  isBatchGenerating: boolean;
  settings: WorldSettings;
  updateSettings: (settings: Partial<WorldSettings>) => void;
  setCurrentView: (view: 'perspective' | 'top' | 'front') => void;
  addBlock: (position: Vector3Tuple, type?: string, replace?: boolean) => void;
  removeBlock: (position: Vector3Tuple) => void;
  setBaseEmpty: (position: Vector3Tuple) => void;
  applyBaseLayer: (blockId: string, size: number) => void;
  baseLayerApplied: boolean;
  baseLayerConfig?: { blockId: string; size: number };
  resetWorld: () => void;
  setSelectedBlock: (id: string) => void;
  setMinecraftVersion: (version: string) => Promise<void>;
  loadVersions: () => Promise<void>;
  toggleHiddenBlockType: (type: string) => void;
  setTool: (tool: 'view' | 'build' | 'erase') => void;
  setToolbarDock: (dock: 'top' | 'bottom' | 'left' | 'right') => void;
  toggleToolbarCollapsed: () => void;
  selectedColor?: string;
  hiddenBlockIds: string[];
  toggleBlockVisibility: (blockType: string) => void;
  setColor?: (color: string) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 10; // Ridotto per risparmiare memoria e prevenire lag

// Blocchi speciali (non cubici) da aggiungere manualmente alla palette
const SPECIAL_BLOCKS: BlockDefinition[] = [
  { id: 'torch', name: 'Torch', color: '#ffd700', texture: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.4/assets/minecraft/textures/block/torch.png' },
  { id: 'oak_stairs', name: 'Oak Stairs', color: '#b38f56', texture: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.4/assets/minecraft/textures/block/oak_planks.png' },
  { id: 'ladder', name: 'Ladder', color: '#8f764b', texture: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.4/assets/minecraft/textures/block/ladder.png' },
  { id: 'glass', name: 'Glass', color: '#aaddff', texture: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.4/assets/minecraft/textures/block/glass.png' },
];

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      blocks: {},
      history: { past: [], future: [] },
      selectedBlockId: 'grass_block',
      minecraftVersion: '1.20.4',
      availableVersions: MINECRAFT_VERSIONS,
      palette: [...SPECIAL_BLOCKS, ...MINECRAFT_BLOCKS.filter(b => !SPECIAL_BLOCKS.some(s => s.id === b.id))],
      isLoadingPalette: false,
      hiddenBlockTypes: [],
      tool: 'build',
      toolbarDock: 'bottom',
      toolbarCollapsed: false,
      currentView: 'perspective',
      isSidebarOpen: true,
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      isMaterialListOpen: true,
      setMaterialListOpen: (isOpen) => set({ isMaterialListOpen: isOpen }),
      isDraggingUI: false,
      setDraggingUI: (isDragging) => set({ isDraggingUI: isDragging }),
      isBatchGenerating: false,
      settings: {
        shadows: true,
        showGrid: true,
        fov: 50,
        mouseSensitivity: 1.0,
        timePreset: 'day',
      },
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setCurrentView: (view) => set({ currentView: view }),
      selectedColor: '#5b8c38',
      hiddenBlockIds: [],
      baseLayerApplied: false,
      baseLayerConfig: undefined,
      toggleBlockVisibility: (blockType) => set((state) => {
        const isHidden = state.hiddenBlockIds.includes(blockType);
        return {
          hiddenBlockIds: isHidden
            ? state.hiddenBlockIds.filter(id => id !== blockType)
            : [...state.hiddenBlockIds, blockType]
        };
      }),
      applyBaseLayer: (blockId, size) =>
        set(() => {
          const add = useWorldStore.getState().addBlock;
          const start = -Math.floor(size / 2);
          const end = start + size - 1;
          // FIX: Silence audio during batch generation to avoid WebAudio errors
          useWorldStore.setState({ isBatchGenerating: true });
          for (let x = start; x <= end; x++) {
            for (let z = start; z <= end; z++) {
              // Place base layer below the grid (Y=-0.5).
              const pos: Vector3Tuple = [x, -0.5, z];
              add(pos, blockId, false);
            }
          }
          useWorldStore.setState({ isBatchGenerating: false });
          return {
            baseLayerApplied: true,
            baseLayerConfig: { blockId, size },
          };
        }),
      setColor: (color) => {
        const block = get().palette.find(b => b.color === color);
        if (block) set({ selectedBlockId: block.id });
      },
      undo: () =>
        set((state) => {
          const { past, future } = state.history;
          if (past.length === 0) return state;

          const previous = past[past.length - 1];
          const newPast = past.slice(0, past.length - 1);

          return {
            blocks: previous,
            history: {
              past: newPast,
              future: [state.blocks, ...future],
            },
          };
        }),
      redo: () =>
        set((state) => {
          const { past, future } = state.history;
          if (future.length === 0) return state;

          const next = future[0];
          const newFuture = future.slice(1);

          return {
            blocks: next,
            history: {
              past: [...past, state.blocks],
              future: newFuture,
            },
          };
        }),
      addBlock: (position, type, replace = false) =>
        set((state) => {
          const key = getBlockKey(position);
          // Se non stiamo rimpiazzando e il blocco esiste già, non fare nulla
          if (!replace && state.blocks[key]) return state;

          const blockId = type || state.selectedBlockId;
          const selectedBlock =
            state.palette.find((b) => b.id === blockId) || state.palette[0];

          return {
            blocks: {
              ...state.blocks,
              [key]: {
                id: generateId(),
                position,
                // Se c'è una texture, usa il bianco per non alterare i colori originali, altrimenti usa il colore della palette
                color: selectedBlock.texture ? '#ffffff' : selectedBlock.color,
                type: selectedBlock.id,
                texture: selectedBlock.texture,
              },
            },
            history: {
              past: [...state.history.past, state.blocks].slice(-MAX_HISTORY),
              future: [],
            },
          };
        }),
      removeBlock: (position) =>
        set((state) => {
          const key = getBlockKey(position);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: removed, ...rest } = state.blocks;
          return {
            blocks: rest,
            history: {
              past: [...state.history.past, state.blocks].slice(-MAX_HISTORY),
              future: [],
            },
          };
        }),
      setBaseEmpty: (position) =>
        set((state) => {
          const key = getBlockKey(position);
          // Se è già vuoto, non fare nulla (evita duplicati nella history)
          if (state.blocks[key]?.type === '_base_empty') return state;

          const id = `base-empty-${position.join('-')}`;
          return {
            blocks: {
              ...state.blocks,
              [key]: {
                id,
                position,
                type: '_base_empty',
                rotation: [0, 0, 0],
                color: '#000000'
              } as BlockData
            },
            history: {
              past: [...state.history.past, state.blocks].slice(-MAX_HISTORY),
              future: [],
            },
          };
        }),
      resetWorld: () => set((state) => ({
        blocks: {},
        history: {
          past: [...state.history.past, state.blocks].slice(-MAX_HISTORY),
          future: [],
        },
      })),
      setSelectedBlock: (id) => set({ selectedBlockId: id }),

      // 🔹 Questo è il punto chiave per il builder 3D
      setMinecraftVersion: async (version) => {
        set({ minecraftVersion: version, isLoadingPalette: true });

        try {
          const newPalette = await fetchMinecraftBlocks(version, BLOCK_COLOR_MAP);
          // Uniamo i blocchi fetchati con quelli speciali, rimuovendo duplicati per ID
          // Mettiamo i blocchi speciali PRIMA per renderli visibili in cima alla lista
          // e filtriamo i duplicati dalla lista fetchata per mantenere le nostre definizioni custom (es. texture torcia)
          const combined = newPalette.length > 0 
            ? [...SPECIAL_BLOCKS, ...newPalette.filter(b => !SPECIAL_BLOCKS.some(s => s.id === b.id))] 
            : [...SPECIAL_BLOCKS, ...MINECRAFT_BLOCKS.filter(b => !SPECIAL_BLOCKS.some(s => s.id === b.id))];
          const uniquePalette = Array.from(new Map(combined.map(b => [b.id, b])).values());

          set({
            palette: uniquePalette,
            isLoadingPalette: false,
          });
        } catch (error) {
          console.error('Failed to load blocks for version', version, error);
          // fallback ai blocchi statici
          set({ palette: [...SPECIAL_BLOCKS, ...MINECRAFT_BLOCKS.filter(b => !SPECIAL_BLOCKS.some(s => s.id === b.id))], isLoadingPalette: false });
        }
      },

      loadVersions: async () => {
        const versions = await fetchMinecraftVersions();
        if (versions.length > 0) {
          set({ availableVersions: versions });
        }
      },

      toggleHiddenBlockType: (type) =>
        set((state) => {
          const isHidden = state.hiddenBlockTypes.includes(type);
          return {
            hiddenBlockTypes: isHidden
              ? state.hiddenBlockTypes.filter((t) => t !== type)
              : [...state.hiddenBlockTypes, type],
          };
        }),

      setTool: (tool) => set({ tool }),
      setToolbarDock: (dock) => set({ toolbarDock: dock }),
      toggleToolbarCollapsed: () => set((state) => ({ toolbarCollapsed: !state.toolbarCollapsed })),
    }),
    {
      name: 'mineworld-storage-v2',
      version: 6,
      partialize: (state) => ({
        blocks: state.blocks,
        selectedBlockId: state.selectedBlockId,
        minecraftVersion: state.minecraftVersion,
        availableVersions: state.availableVersions,
        palette: state.palette,
        hiddenBlockTypes: state.hiddenBlockTypes,
        tool: state.tool,
        toolbarDock: state.toolbarDock,
        toolbarCollapsed: state.toolbarCollapsed,
        currentView: state.currentView,
        isSidebarOpen: state.isSidebarOpen,
        isMaterialListOpen: state.isMaterialListOpen,
        selectedColor: state.selectedColor,
        hiddenBlockIds: state.hiddenBlockIds,
        baseLayerApplied: state.baseLayerApplied,
        baseLayerConfig: state.baseLayerConfig,
        settings: state.settings,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as any;
        // Reset clipboard if migrating from older versions or if undefined
        if (version === undefined || version < 6) {
          return {
            ...state,
            history: { past: [], future: [] },
            hiddenBlockTypes: state.hiddenBlockTypes || [], // Ensure it exists
          };
        }
        return {
          ...state,
          hiddenBlockTypes: state.hiddenBlockTypes || [], // Ensure it exists even for newer versions if missing
        } as WorldState;
      },
    }
  )
);

// Aggiungi listener globale per le scorciatoie da tastiera
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      useWorldStore.getState().undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      useWorldStore.getState().redo();
    }
  });
}
