import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldStore } from '../../store/worldStore';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Box, Layers, Loader2, Save, Hand, Hammer, Search, Eraser, ArrowLeft, Settings, X, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

// Componente estratto per evitare ridefinizioni ad ogni render
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
      <div className={`absolute ${pos} pointer-events-none z-50`}>
        <div className="transition-all duration-150 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100">
          <div className="px-2.5 py-1 rounded-md bg-slate-950/95 text-white text-[11px] font-medium border border-white/10 shadow-lg whitespace-nowrap">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};

interface BuilderUIProps {
  baseSettings: { enabled: boolean; blockId: string; size: number };
  setBaseSettings: React.Dispatch<React.SetStateAction<{ enabled: boolean; blockId: string; size: number }>>;
}

export const BuilderUI: React.FC<BuilderUIProps> = ({ baseSettings, setBaseSettings }) => {
  const { 
    selectedBlockId, 
    setSelectedBlock, 
    blocks: blocksMap, 
    minecraftVersion,
    setMinecraftVersion,
    availableVersions,
    loadVersions,
    palette,
    isLoadingPalette,
    tool,
    setTool,
    toolbarDock,
    toolbarCollapsed,
    setToolbarDock,
    toggleToolbarCollapsed,
    isSidebarOpen,
    setSidebarOpen,
    isMaterialListOpen,
    setMaterialListOpen,
    isDraggingUI,
    setDraggingUI,
    settings,
    updateSettings,
    hiddenBlockIds,
    toggleBlockVisibility
  } = useWorldStore();
  
  const navigate = useNavigate();
  // Convertiamo la mappa dei blocchi in un array per poter usare .length e .forEach
  const blocks = useMemo(() => Object.values(blocksMap), [blocksMap]);

  // Carica le versioni all'avvio
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const [failedTextures, setFailedTextures] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const selectedBlockData = palette.find(b => b.id === selectedBlockId) || palette[0];

  // Calculate block counts
  const blockCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    blocks.forEach(block => {
      if (block.type === '_base_empty') return;
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
      ? 'absolute top-4 left-1/2 -translate-x-1/2'
      : toolbarDock === 'bottom'
        ? 'absolute bottom-4 left-1/2 -translate-x-1/2'
        : toolbarDock === 'left'
          ? 'absolute top-1/2 left-4 -translate-y-1/2'
          : 'absolute top-1/2 right-4 -translate-y-1/2';

  const collapseIcon =
    !toolbarCollapsed ? (
      <X className="w-3.5 h-3.5" />
    ) : toolbarDock === 'top' ? (
      <ChevronDown className="w-4 h-4" />
    ) : toolbarDock === 'bottom' ? (
      <ChevronUp className="w-4 h-4" />
    ) : toolbarDock === 'left' ? (
      <ChevronRight className="w-4 h-4" />
    ) : (
      <ChevronLeft className="w-4 h-4" />
    );

  const tooltipAlign: 'top' | 'bottom' | 'left' | 'right' =
    toolbarDock === 'top'
      ? 'top'
      : toolbarDock === 'bottom'
        ? 'bottom'
        : toolbarDock === 'left'
          ? 'right'
          : 'left';

  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarContainerRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const dragCandidateRef = useRef<'top' | 'bottom' | 'left' | 'right'>(toolbarDock);
  // Usiamo lo stato globale invece di quello locale
  const [dragPosition, setDragPosition] = useState<{ left: number; top: number } | null>(null);
  const [dragCandidate, setDragCandidate] = useState<'top' | 'bottom' | 'left' | 'right'>(toolbarDock);

  useEffect(() => {
    dragCandidateRef.current = dragCandidate;
  }, [dragCandidate]);

  useEffect(() => {
    if (!isDraggingUI) return;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const pickDock = (x: number, y: number): 'top' | 'bottom' | 'left' | 'right' => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Calcoliamo i bordi dell'area di lavoro (workspace)
      // La toolbar vive nel div centrale ("Spacer"), quindi i bordi di docking
      // dovrebbero essere relativi a questo spazio.
      const topBarHeight = 60; // Altezza approssimativa della navbar editor
      const sidebarWidth = isSidebarOpen ? 256 : 0;
      const materialListWidth = isMaterialListOpen ? 256 : 0;

      // Calcola la distanza del mouse dai 4 bordi dell'area centrale
      const dTop = Math.abs(y - topBarHeight);
      const dBottom = Math.abs(h - y);
      const dLeft = Math.abs(x - sidebarWidth);
      const dRight = Math.abs(w - materialListWidth - x);
      
      const min = Math.min(dTop, dBottom, dLeft, dRight);
      if (min === dTop) return 'top';
      if (min === dBottom) return 'bottom';
      if (min === dLeft) return 'left';
      return 'right';
    };

    const onMove = (e: PointerEvent) => {
      const offset = dragOffsetRef.current;
      if (!offset || !toolbarContainerRef.current) return;

      const newLeft = e.clientX - offset.x;
      const newTop = e.clientY - offset.y;

      // OTTIMIZZAZIONE: Aggiorna direttamente il DOM per evitare re-render continui
      toolbarContainerRef.current.style.left = `${newLeft}px`;
      toolbarContainerRef.current.style.top = `${newTop}px`;

      const newCandidate = pickDock(e.clientX, e.clientY);
      
      // Aggiorna lo stato React SOLO se cambia la zona di docking (per feedback visivo)
      if (newCandidate !== dragCandidateRef.current) {
        setDragPosition({ left: newLeft, top: newTop }); // Sync per evitare snap-back al re-render
        setDragCandidate(newCandidate);
      }
    };

    const onUp = () => {
      setToolbarDock(dragCandidateRef.current);
      setDraggingUI(false);
      setDragPosition(null);
      dragOffsetRef.current = null;
      
      // Rimuovi stili inline per lasciare che le classi CSS gestiscano il posizionamento
      if (toolbarContainerRef.current) {
        toolbarContainerRef.current.style.left = '';
        toolbarContainerRef.current.style.top = '';
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });

    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingUI, setToolbarDock, isSidebarOpen, isMaterialListOpen, setDraggingUI]);

  const startToolbarDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = toolbarContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragPosition({ left: rect.left, top: rect.top });
    setDragCandidate(toolbarDock);
    setDraggingUI(true);
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
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-1.5 mr-2 text-gray-300 transition-colors rounded hover:bg-slate-700 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-300">Java Version:</span>
            <select 
              value={minecraftVersion}
              onChange={(e) => setMinecraftVersion(e.target.value)}
              className="px-2 py-1 text-sm border rounded bg-slate-800 border-slate-600 focus:outline-none focus:border-blue-500"
              disabled={isLoadingPalette}
            >
              {availableVersions.length === 0 ? (
                <option value={minecraftVersion}>Loading...</option>
              ) : (
                availableVersions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))
              )}
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
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-gray-300 transition-colors rounded hover:bg-slate-700 hover:text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

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

        {/* Spacer */}
        <div className="relative flex-1">
          <AnimatePresence>
            {isDraggingUI && (
              <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className={`${dockZoneClass('top')} left-1/2 -translate-x-1/2 top-4 w-[260px] h-[54px]`} />
                <div className={`${dockZoneClass('bottom')} left-1/2 -translate-x-1/2 bottom-4 w-[260px] h-[54px]`} />
                <div className={`${dockZoneClass('left')} left-4 top-1/2 -translate-y-1/2 w-[54px] h-[220px]`} />
                <div className={`${dockZoneClass('right')} right-4 top-1/2 -translate-y-1/2 w-[54px] h-[220px]`} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            ref={toolbarContainerRef}
            className={`${isDraggingUI ? 'fixed' : toolbarWrapperClass} pointer-events-auto z-40`}
            style={isDraggingUI && dragPosition ? { left: dragPosition.left, top: dragPosition.top } : undefined}
            layout
            transition={isDraggingUI ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34, bounce: 0.25 }}
          >
            <div ref={toolbarRef} className={`relative flex ${isVerticalDock ? 'flex-col' : 'flex-row'} items-center gap-2`}>

              <div 
                className={`flex ${isVerticalDock ? 'flex-col' : 'flex-row'} items-center gap-1 bg-slate-900/70 rounded-lg p-1 border border-slate-600 backdrop-blur-md shadow-lg`}
                onPointerDown={startToolbarDrag}
              >
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
                      <SimpleTooltip text={isSidebarOpen ? "Close Palette" : "Open Palette"} align={tooltipAlign}>
                        <motion.button
                      onClick={() => setSidebarOpen(!isSidebarOpen)}
                          onPointerDown={(e) => e.stopPropagation()}
                          className={`relative p-2 rounded transition-colors ${isSidebarOpen ? 'bg-slate-700 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800/70'}`}
                          type="button"
                          variants={toolButtonVariants}
                        >
                          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {!isSidebarOpen && selectedBlockData && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-sm border border-white/50 shadow-sm overflow-hidden">
                              {selectedBlockData.texture && !failedTextures[selectedBlockData.id] ? (
                                <img src={selectedBlockData.texture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" style={{ backgroundColor: selectedBlockData.color }} />
                              )}
                            </div>
                          )}
                        </motion.button>
                      </SimpleTooltip>

                      <SimpleTooltip text="Pan Mode (V)" align={tooltipAlign}>
                        <motion.button
                          onClick={() => setTool('view')}
                          onPointerDown={(e) => e.stopPropagation()}
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
                          onPointerDown={(e) => e.stopPropagation()}
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
                          onPointerDown={(e) => e.stopPropagation()}
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

                      <SimpleTooltip text={isMaterialListOpen ? "Close Materials" : "Open Materials"} align={tooltipAlign}>
                        <motion.button
                      onClick={() => setMaterialListOpen(!isMaterialListOpen)}
                          onPointerDown={(e) => e.stopPropagation()}
                          className={`relative p-2 rounded transition-colors ${isMaterialListOpen ? 'bg-slate-700 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800/70'}`}
                          type="button"
                          variants={toolButtonVariants}
                        >
                          {isMaterialListOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </motion.button>
                      </SimpleTooltip>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={toggleToolbarCollapsed}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1.5 text-white/80 hover:text-white transition-colors rounded hover:bg-slate-700"
                  title={toolbarCollapsed ? 'Apri toolbar' : 'Chiudi toolbar'}
                  type="button"
                >
                  {collapseIcon}
                </button>
              </div>

            </div>
          </motion.div>
        </div>

        {/* Right Sidebar: Block Counter */}
        <motion.div 
          initial={{ width: 256 }}
          animate={{ width: isMaterialListOpen ? 256 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col overflow-hidden border-l pointer-events-auto bg-slate-900/80 backdrop-blur-md border-slate-700"
        >
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
                  const isHidden = hiddenBlockIds.includes(type);
                  
                  return (
                    <li key={type} className={`flex items-center justify-between p-2 border rounded border-slate-700 transition-colors ${isHidden ? 'bg-slate-800/30 opacity-60' : 'bg-slate-800/50'}`}>
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
                        <span className={`text-sm truncate ${isHidden ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                          {blockInfo.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleBlockVisibility(type)}
                          className={`p-1 rounded transition-colors ${isHidden ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-white hover:bg-slate-700'}`}
                          title={isHidden ? "Show blocks" : "Hide blocks"}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <span className="font-mono text-sm font-bold text-blue-400 min-w-[24px] text-right">x{count}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 border rounded-lg shadow-2xl bg-slate-900 border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Shadows Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Shadows</label>
                  <button
                    onClick={() => updateSettings({ shadows: !settings.shadows })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.shadows ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${settings.shadows ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Time Preset */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Time</label>
                  <select
                    value={settings.timePreset}
                    onChange={(e) => updateSettings({ timePreset: e.target.value as 'day' | 'night' })}
                    className="px-2 py-1 text-sm text-white border rounded bg-slate-800 border-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    disabled={settings.autoRotateDayNight}
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                {/* Auto Cycle Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Auto Day/Night</label>
                  <button
                    onClick={() => updateSettings({ autoRotateDayNight: !settings.autoRotateDayNight })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.autoRotateDayNight ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${settings.autoRotateDayNight ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Grid Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Show Grid</label>
                  <button
                    onClick={() => updateSettings({ showGrid: !settings.showGrid })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.showGrid ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${settings.showGrid ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* FOV Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Field of View</span>
                    <span>{settings.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="110"
                    value={settings.fov}
                    onChange={(e) => updateSettings({ fov: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Sensitivity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Mouse Sensitivity</span>
                    <span>{settings.mouseSensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={settings.mouseSensitivity}
                    onChange={(e) => updateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Base Layer Settings */}
                <div className="pt-4 mt-4 border-t border-slate-700">
                  <h3 className="mb-3 text-sm font-bold text-gray-300">Base Layer</h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-400">Enable Base</label>
                    <button
                      onClick={() => setBaseSettings(s => ({ ...s, enabled: !s.enabled }))}
                      className={`w-11 h-6 rounded-full transition-colors relative ${baseSettings.enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${baseSettings.enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {baseSettings.enabled && (
                    <>
                      <div className="mb-3 space-y-2">
                        <label className="text-xs text-gray-400">Base Block</label>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setBaseSettings(s => ({ ...s, blockId: selectedBlockId }))}
                             className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-500"
                           >
                             Set to Selected ({palette.find(b => b.id === selectedBlockId)?.name || selectedBlockId})
                           </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Size</span>
                          <span>{baseSettings.size}x{baseSettings.size}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="2"
                          value={baseSettings.size}
                          onChange={(e) => setBaseSettings(s => ({ ...s, size: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
