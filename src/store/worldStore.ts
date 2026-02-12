import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BlockData, Vector3Tuple, BlockDefinition } from '../engine/types';
import { generateId, MINECRAFT_BLOCKS, BLOCK_COLOR_MAP, getBlockKey } from '../engine/voxelEngine';
import { fetchMinecraftBlocks } from '../services/minecraftApi';

interface HistoryState {
  past: Record<string, BlockData>[];
  future: Record<string, BlockData>[];
}

interface WorldState {
  blocks: Record<string, BlockData>;
  history: HistoryState;
  selectedBlockId: string;
  minecraftVersion: string;
  palette: BlockDefinition[];
  isLoadingPalette: boolean;
  tool: 'view' | 'build' | 'erase';
  addBlock: (position: Vector3Tuple, type?: string, replace?: boolean) => void;
  removeBlock: (position: Vector3Tuple) => void;
  resetWorld: () => void;
  setSelectedBlock: (id: string) => void;
  setMinecraftVersion: (version: string) => Promise<void>;
  setTool: (tool: 'view' | 'build' | 'erase') => void;
  selectedColor?: string;
  setColor?: (color: string) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 20;

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      blocks: {},
      history: { past: [], future: [] },
      selectedBlockId: 'grass_block',
      minecraftVersion: '1.20.4',
      palette: MINECRAFT_BLOCKS,
      isLoadingPalette: false,
      tool: 'build',
      selectedColor: '#5b8c38',
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

      setTool: (tool) => set({ tool }),
    }),
    {
      name: 'mineworld-storage-v2',
      version: 6,
      partialize: (state) => ({
        blocks: state.blocks,
        selectedBlockId: state.selectedBlockId,
        minecraftVersion: state.minecraftVersion,
        palette: state.palette,
        tool: state.tool,
        selectedColor: state.selectedColor,
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
          };
        }
        return state as WorldState;
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
