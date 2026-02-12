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
  autoRotateDayNight: boolean;
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
  settings: WorldSettings;
  updateSettings: (settings: Partial<WorldSettings>) => void;
  setCurrentView: (view: 'perspective' | 'top' | 'front') => void;
  addBlock: (position: Vector3Tuple, type?: string, replace?: boolean) => void;
  removeBlock: (position: Vector3Tuple) => void;
  setBaseEmpty: (position: Vector3Tuple) => void;
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

// Semplice sintetizzatore audio per feedback sonoro senza asset esterni
const playSound = (type: 'place' | 'break') => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  if (type === 'place') {
    // Suono "Pop" acuto
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.1);
  } else {
    // Suono "Crunch" più grave
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.15);
  }
};

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      blocks: {},
      history: { past: [], future: [] },
      selectedBlockId: 'grass_block',
      minecraftVersion: '1.20.4',
      availableVersions: MINECRAFT_VERSIONS,
      palette: MINECRAFT_BLOCKS,
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
      settings: {
        shadows: true,
        showGrid: true,
        fov: 50,
        mouseSensitivity: 1.0,
        timePreset: 'day',
        autoRotateDayNight: false,
      },
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setCurrentView: (view) => set({ currentView: view }),
      selectedColor: '#5b8c38',
      hiddenBlockIds: [],
      toggleBlockVisibility: (blockType) => set((state) => {
        const isHidden = state.hiddenBlockIds.includes(blockType);
        return {
          hiddenBlockIds: isHidden
            ? state.hiddenBlockIds.filter(id => id !== blockType)
            : [...state.hiddenBlockIds, blockType]
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

          playSound('place');

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
          playSound('break');
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

          playSound('break');

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
          set({
            palette: newPalette.length > 0 ? newPalette : MINECRAFT_BLOCKS,
            isLoadingPalette: false,
          });
        } catch (error) {
          console.error('Failed to load blocks for version', version, error);
          // fallback ai blocchi statici
          set({ palette: MINECRAFT_BLOCKS, isLoadingPalette: false });
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
        // Non persistiamo isDraggingUI perché è uno stato temporaneo
        selectedColor: state.selectedColor,
        hiddenBlockIds: state.hiddenBlockIds,
        settings: state.settings,
        // Escludiamo 'history' dal localStorage per evitare che diventi troppo grande
        // e causi problemi di quota o rallentamenti
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
