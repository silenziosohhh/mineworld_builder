import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { MINECRAFT_VERSIONS } from '../../engine/voxelEngine';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Box, Layers, Trash2, Loader2, Save, Hand, Hammer, Search, Eraser } from 'lucide-react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

export const BuilderUI: React.FC = () => {
  const { 
    selectedBlockId, 
    setSelectedBlock, 
    blocks: blocksMap, 
    resetWorld,
    minecraftVersion,
    setMinecraftVersion,
    palette,
    isLoadingPalette,
    tool,
    setTool,
    toolbarDock,
    toolbarCollapsed,
    setToolbarDock,
    toggleToolbarCollapsed
  } = useWorldStore();
  
  // Convertiamo la mappa dei blocchi in un array per poter usare .length e .forEach
  const blocks = useMemo(() => Object.values(blocksMap), [blocksMap]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [failedTextures, setFailedTextures] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBlockData = palette.find(b => b.id === selectedBlockId) || palette[0];

  // Calculate block counts
  const blockCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    blocks.forEach(block => {
      counts[block.type] = (counts[block.type] || 0) + 1;
    });
    return counts;
  }, [blocks]);

  const filteredPalette = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return palette.filter(block => {
      const name = block.name || '';
      const id = block.id || '';
      return name.toLowerCase().includes(query) || id.toLowerCase().includes(query);
    });
  }, [palette, searchQuery]);

  const visibleBlocks = useMemo(() => {
    return filteredPalette.slice(0, visibleCount);
  }, [filteredPalette, visibleCount]);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, palette]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCount(prev => Math.min(prev + 20, filteredPalette.length));
    }
  };

  const handleImageError = (blockId: string) => {
    setFailedTextures(prev => ({ ...prev, [blockId]: true }));
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      // Qui implementerai la chiamata al tuo backend MongoDB
      const worldData = {
        blocks: blocksMap,
        version: minecraftVersion,
        timestamp: new Date().toISOString()
      };
      
      console.log("Saving world data to DB:", worldData);
      // await api.saveWorld(worldData); // Esempio chiamata API
      
      alert('World Saved Successfully!');
    } catch (error) {
      console.error("Failed to save world", error);
      alert('Failed to save world');
    } finally {
      setIsSaving(false);
    }
  };

  const isVerticalDock = toolbarDock === 'left' || toolbarDock === 'right';

  const toolbarWrapperClass =
    toolbarDock === 'top'
      ? 'absolute top-14 left-1/2 -translate-x-1/2'
      : toolbarDock === 'bottom'
        ? 'absolute bottom-4 left-1/2 -translate-x-1/2'
        : toolbarDock === 'left'
          ? 'absolute top-1/2 left-[280px] -translate-y-1/2'
          : 'absolute top-1/2 right-[280px] -translate-y-1/2';

  const toolbarToggleClass =
    toolbarDock === 'top'
      ? 'absolute left-1/2 -translate-x-1/2 -bottom-4'
      : toolbarDock === 'bottom'
        ? 'absolute left-1/2 -translate-x-1/2 -top-4'
        : toolbarDock === 'left'
          ? 'absolute -right-4 top-1/2 -translate-y-1/2'
          : 'absolute -left-4 top-1/2 -translate-y-1/2';

  const collapseIcon =
    toolbarDock === 'top'
      ? (toolbarCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)
      : toolbarDock === 'bottom'
        ? (toolbarCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)
        : toolbarDock === 'left'
          ? (toolbarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)
          : (toolbarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />);

  const tooltipAlign: 'top' | 'bottom' | 'left' | 'right' =
    toolbarDock === 'top'
      ? 'top'
      : toolbarDock === 'bottom'
        ? 'bottom'
        : toolbarDock === 'left'
          ? 'right'
          : 'left';

  type TooltipProps = React.PropsWithChildren<{ text: string; align?: 'top' | 'bottom' | 'left' | 'right'; }>;
  const SimpleTooltip: React.FC<TooltipProps> = ({ text, align = 'top', children }) => {
    const pos =
      align === 'top'
        ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
        : align === 'bottom'
          ? 'top-full left-1/2 -translate-x-1/2 mt-2'
          : align === 'left'
            ? 'right-full top-1/2 -translate-y-1/2 mr-2'
            : 'left-full top-1/2 -translate-y-1/2 ml-2';
    return (
      <div className="relative group">
        {children}
        <div className={`absolute ${pos} pointer-events-none`}>
          <div className="transition-all duration-150 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100">
            <div className="px-2.5 py-1 rounded-md bg-slate-950/95 text-white text-[11px] font-medium border border-white/10 shadow-lg whitespace-nowrap">
              {text}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const dragCandidateRef = useRef<'top' | 'bottom' | 'left' | 'right'>(toolbarDock);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ left: number; top: number } | null>(null);
  const [dragCandidate, setDragCandidate] = useState<'top' | 'bottom' | 'left' | 'right'>(toolbarDock);

  useEffect(() => {
    dragCandidateRef.current = dragCandidate;
  }, [dragCandidate]);

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const pickDock = (x: number, y: number): 'top' | 'bottom' | 'left' | 'right' => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const edge = 140;
      const sideEdge = 260;

      if (y <= edge) return 'top';
      if (y >= h - edge) return 'bottom';
      if (x <= sideEdge) return 'left';
      if (x >= w - sideEdge) return 'right';

      const dTop = y;
      const dBottom = h - y;
      const dLeft = x;
      const dRight = w - x;
      const min = Math.min(dTop, dBottom, dLeft, dRight);
      if (min === dTop) return 'top';
      if (min === dBottom) return 'bottom';
      if (min === dLeft) return 'left';
      return 'right';
    };

    const onMove = (e: PointerEvent) => {
      const offset = dragOffsetRef.current;
      if (!offset) return;
      setDragPosition({ left: e.clientX - offset.x, top: e.clientY - offset.y });
      setDragCandidate(pickDock(e.clientX, e.clientY));
    };

    const onUp = () => {
      setToolbarDock(dragCandidateRef.current);
      setIsDraggingToolbar(false);
      setDragPosition(null);
      dragOffsetRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });

    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingToolbar, setToolbarDock]);

  const startToolbarDrag = (e: React.PointerEvent) => {
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragPosition({ left: rect.left, top: rect.top });
    setDragCandidate(toolbarDock);
    setIsDraggingToolbar(true);
  };

  const isDockActive = (dock: 'top' | 'bottom' | 'left' | 'right') => dragCandidate === dock;

  const dockZoneBase =
    'fixed z-30 pointer-events-none rounded-xl border backdrop-blur-sm transition-colors duration-150';

  const dockZoneClass = (dock: 'top' | 'bottom' | 'left' | 'right') =>
    `${dockZoneBase} ${
      isDockActive(dock)
        ? 'bg-emerald-400/20 border-emerald-300/60 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
        : 'bg-emerald-400/10 border-emerald-300/30'
    }`;

  const toolsContainerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 500, damping: 40, bounce: 0.18, staggerChildren: 0.04, delayChildren: 0.02 },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 4,
      transition: { type: 'tween' as const, duration: 0.14, ease: 'easeOut' },
    },
  };

  const toolButtonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.86, y: -6 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 700, damping: 40, bounce: 0.16 } },
    exit: { opacity: 0, scale: 0.98, y: 4, transition: { type: 'tween' as const, duration: 0.12, ease: 'easeOut' } },
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
      
      {/* Top Bar: Version Selector & Stats */}
      <div className="flex items-center justify-between p-2 text-white pointer-events-auto bg-black/70 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-300">Java Version:</span>
            <select 
              value={minecraftVersion}
              onChange={(e) => setMinecraftVersion(e.target.value)}
              className="px-2 py-1 text-sm border rounded bg-slate-800 border-slate-600 focus:outline-none focus:border-blue-500"
              disabled={isLoadingPalette}
            >
              {MINECRAFT_VERSIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {isLoadingPalette && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
          </div>
          <div className="text-sm text-gray-400">
            Blocks placed: <span className="font-mono text-white">{blocks.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1 text-sm text-white transition-colors bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          <button 
            onClick={() => {
              if (confirm('Clear all blocks?')) resetWorld();
            }}
            className="flex items-center gap-2 px-3 py-1 text-sm text-white transition-colors rounded bg-red-600/80 hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDraggingToolbar && (
          <motion.div
            className="fixed inset-0 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <div className={`${dockZoneClass('top')} left-1/2 -translate-x-1/2 top-14 w-[260px] h-[54px]`} />
            <div className={`${dockZoneClass('bottom')} left-1/2 -translate-x-1/2 bottom-4 w-[260px] h-[54px]`} />
            <div className={`${dockZoneClass('left')} left-[280px] top-1/2 -translate-y-1/2 w-[54px] h-[220px]`} />
            <div className={`${dockZoneClass('right')} right-[280px] top-1/2 -translate-y-1/2 w-[54px] h-[220px]`} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={`${isDraggingToolbar ? 'fixed' : toolbarWrapperClass} pointer-events-auto z-40`}
        style={isDraggingToolbar && dragPosition ? { left: dragPosition.left, top: dragPosition.top } : undefined}
        layout
        transition={isDraggingToolbar ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34, bounce: 0.25 }}
      >
        <div ref={toolbarRef} className="relative">
          <button
            onClick={toggleToolbarCollapsed}
            className={`${toolbarToggleClass} p-2 rounded-full bg-sky-600/90 text-white shadow-lg ring-1 ring-white/20 border border-white/10 hover:bg-sky-500 hover:ring-white/30 hover:scale-[1.08] transition-all`}
            title={toolbarCollapsed ? 'Apri toolbar' : 'Chiudi toolbar'}
            type="button"
          >
            {collapseIcon}
          </button>

          <div className={`flex ${isVerticalDock ? 'flex-col' : 'flex-row'} items-center gap-1 bg-slate-900/70 rounded-lg p-1 border border-slate-600 backdrop-blur-md shadow-lg`}>
            <button
              onPointerDown={startToolbarDrag}
              className="p-1.5 text-white/80 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
              title="Trascina per dockare"
              type="button"
            >
              <span className="grid grid-cols-2 gap-[2px]">
                <span className="w-1 h-1 rounded-full bg-white/85" />
                <span className="w-1 h-1 rounded-full bg-white/85" />
                <span className="w-1 h-1 rounded-full bg-white/85" />
                <span className="w-1 h-1 rounded-full bg-white/85" />
                <span className="w-1 h-1 rounded-full bg-white/85" />
                <span className="w-1 h-1 rounded-full bg-white/85" />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {!toolbarCollapsed && (
                <motion.div
                  key="tools"
                  className={`flex ${isVerticalDock ? 'flex-col' : 'flex-row'} items-center gap-1`}
                  variants={toolsContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <SimpleTooltip text="Pan Mode (V)" align={tooltipAlign}>
                    <motion.button
                      onClick={() => setTool('view')}
                      className={`relative p-2 rounded transition-colors ${tool === 'view' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800/70'}`}
                      type="button"
                      variants={toolButtonVariants}
                      exit="exit"
                    >
                      <Hand className="w-4 h-4" />
                      <span className="absolute -bottom-1 -right-1 text-[10px] leading-none px-1 py-0.5 rounded bg-black/70 border border-white/10 text-white/90">
                        V
                      </span>
                    </motion.button>
                  </SimpleTooltip>

                  <SimpleTooltip text="Building Mode (B)" align={tooltipAlign}>
                    <motion.button
                      onClick={() => setTool('build')}
                      className={`relative p-2 rounded transition-colors ${tool === 'build' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800/70'}`}
                      type="button"
                      variants={toolButtonVariants}
                      exit="exit"
                    >
                      <Hammer className="w-4 h-4" />
                      <span className="absolute -bottom-1 -right-1 text-[10px] leading-none px-1 py-0.5 rounded bg-black/70 border border-white/10 text-white/90">
                        B
                      </span>
                    </motion.button>
                  </SimpleTooltip>

                  <SimpleTooltip text="Erase Mode (E)" align={tooltipAlign}>
                    <motion.button
                      onClick={() => setTool('erase')}
                      className={`relative p-2 rounded transition-colors ${tool === 'erase' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800/70'}`}
                      type="button"
                      variants={toolButtonVariants}
                      exit="exit"
                    >
                      <Eraser className="w-4 h-4" />
                      <span className="absolute -bottom-1 -right-1 text-[10px] leading-none px-1 py-0.5 rounded bg-black/70 border border-white/10 text-white/90">
                        E
                      </span>
                    </motion.button>
                  </SimpleTooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Block Palette */}
        <motion.div 
          initial={{ width: 256 }}
          animate={{ width: isSidebarOpen ? 256 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col overflow-hidden border-r pointer-events-auto bg-slate-900/90 backdrop-blur-md border-slate-700"
        >
          <div className="flex flex-col gap-3 p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white whitespace-nowrap">Block Palette</h2>
            </div>
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
              <input 
                type="text"
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-1 pl-8 pr-2 text-sm text-white placeholder-gray-500 border rounded bg-slate-800 border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div 
            className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar"
            onScroll={handleScroll}
          >
            {isLoadingPalette ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : (
            visibleBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => setSelectedBlock(block.id)}
                className={`w-full flex items-center gap-3 p-2 rounded transition-all ${
                  selectedBlockId === block.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                {block.texture && !failedTextures[block.id] ? (
                  <img 
                    src={block.texture} 
                    alt={block.name} 
                    onError={() => handleImageError(block.id)}
                    className="object-cover w-8 h-8 border rounded shadow-sm border-white/20 pixelated"
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 border rounded shadow-sm border-white/20" 
                    style={{ backgroundColor: block.color }}
                  />
                )}
                <span className="text-sm font-medium truncate">{block.name}</span>
              </button>
            ))
            )}
            {!isLoadingPalette && visibleBlocks.length === 0 && (
              <div className="p-4 text-sm text-center text-gray-500">
                No blocks found
              </div>
            )}
          </div>
        </motion.div>

        {/* Toggle Button (Shows selected block color) */}
        <div className="flex flex-col justify-center pointer-events-auto">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1 p-1 pr-2 text-white transition-colors border-r shadow-xl bg-slate-800 rounded-r-md border-y border-slate-600 hover:bg-slate-700"
            title={isSidebarOpen ? "Close Palette" : "Open Palette"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {!isSidebarOpen && selectedBlockData && (
               selectedBlockData.texture && !failedTextures[selectedBlockData.id] ? (
                <img 
                  src={selectedBlockData.texture} 
                  alt={selectedBlockData.name} 
                  onError={() => handleImageError(selectedBlockData.id)}
                  className="object-cover w-6 h-6 border rounded border-white/30 pixelated"
                />
               ) : (
                <div 
                  className="w-6 h-6 border rounded border-white/30" 
                  style={{ backgroundColor: selectedBlockData.color }}
                />
               )
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right Sidebar: Block Counter */}
        <div className="flex flex-col w-64 border-l pointer-events-auto bg-slate-900/80 backdrop-blur-md border-slate-700">
          <div className="flex items-center gap-2 p-4 border-b border-slate-700">
            <Layers className="w-5 h-5 text-green-400" />
            <h2 className="font-bold text-white">Material List</h2>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            {Object.keys(blockCounts).length === 0 ? (
              <p className="mt-10 text-sm text-center text-gray-500">No blocks placed yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(blockCounts).map(([type, count]) => {
                  const blockInfo = palette.find(b => b.id === type);
                  if (!blockInfo) return null;
                  return (
                    <li key={type} className="flex items-center justify-between p-2 border rounded bg-slate-800/50 border-slate-700">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {blockInfo.texture && !failedTextures[blockInfo.id] ? (
                          <img 
                            src={blockInfo.texture} 
                            alt={blockInfo.name} 
                            onError={() => handleImageError(blockInfo.id)}
                            className="flex-shrink-0 object-cover w-4 h-4 rounded-sm pixelated"
                          />
                        ) : (
                          <div 
                            className="flex-shrink-0 w-4 h-4 rounded-sm" 
                            style={{ backgroundColor: blockInfo.color }}
                          />
                        )}
                        <span className="text-sm text-gray-200 truncate">{blockInfo.name}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-blue-400">x{count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
