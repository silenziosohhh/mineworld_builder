import React, { useState, useMemo, useEffect } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { MINECRAFT_VERSIONS } from '../../engine/voxelEngine';
import { ChevronLeft, ChevronRight, Box, Layers, Trash2, Loader2, Save, Eye, Hammer, Search, Eraser } from 'lucide-react';
import { motion } from 'framer-motion';

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
    setTool
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

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      
      {/* Top Bar: Version Selector & Stats */}
      <div className="bg-black/70 text-white p-2 flex justify-between items-center pointer-events-auto backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-300">Java Version:</span>
            <select 
              value={minecraftVersion}
              onChange={(e) => setMinecraftVersion(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              disabled={isLoadingPalette}
            >
              {MINECRAFT_VERSIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {isLoadingPalette && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          </div>
          <div className="text-sm text-gray-400">
            Blocks placed: <span className="text-white font-mono">{blocks.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 rounded p-1 border border-slate-600 mr-4">
            <button
              onClick={() => setTool('view')}
              className={`p-1.5 rounded transition-colors ${tool === 'view' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="View Mode (1)"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('build')}
              className={`p-1.5 rounded transition-colors ${tool === 'build' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Build Mode (2)"
            >
              <Hammer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('erase')}
              className={`p-1.5 rounded transition-colors ${tool === 'erase' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Eraser Mode (4)"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          <button 
            onClick={() => {
              if (confirm('Clear all blocks?')) resetWorld();
            }}
            className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Block Palette */}
        <motion.div 
          initial={{ width: 256 }}
          animate={{ width: isSidebarOpen ? 256 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pointer-events-auto flex flex-col bg-slate-900/90 backdrop-blur-md border-r border-slate-700 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-700 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white whitespace-nowrap">Block Palette</h2>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-white text-sm rounded pl-8 pr-2 py-1 border border-slate-600 focus:outline-none focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>
          <div 
            className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar"
            onScroll={handleScroll}
          >
            {isLoadingPalette ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
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
                    className="w-8 h-8 rounded border border-white/20 shadow-sm object-cover pixelated"
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded border border-white/20 shadow-sm" 
                    style={{ backgroundColor: block.color }}
                  />
                )}
                <span className="text-sm font-medium truncate">{block.name}</span>
              </button>
            ))
            )}
            {!isLoadingPalette && visibleBlocks.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No blocks found
              </div>
            )}
          </div>
        </motion.div>

        {/* Toggle Button (Shows selected block color) */}
        <div className="pointer-events-auto flex flex-col justify-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-slate-800 text-white p-1 rounded-r-md shadow-xl border-y border-r border-slate-600 hover:bg-slate-700 transition-colors flex items-center gap-1 pr-2"
            title={isSidebarOpen ? "Close Palette" : "Open Palette"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {!isSidebarOpen && selectedBlockData && (
               selectedBlockData.texture && !failedTextures[selectedBlockData.id] ? (
                <img 
                  src={selectedBlockData.texture} 
                  alt={selectedBlockData.name} 
                  onError={() => handleImageError(selectedBlockData.id)}
                  className="w-6 h-6 rounded border border-white/30 object-cover pixelated"
                />
               ) : (
                <div 
                  className="w-6 h-6 rounded border border-white/30" 
                  style={{ backgroundColor: selectedBlockData.color }}
                />
               )
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right Sidebar: Block Counter */}
        <div className="w-64 pointer-events-auto bg-slate-900/80 backdrop-blur-md border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center gap-2">
            <Layers className="w-5 h-5 text-green-400" />
            <h2 className="font-bold text-white">Material List</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {Object.keys(blockCounts).length === 0 ? (
              <p className="text-gray-500 text-center text-sm mt-10">No blocks placed yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(blockCounts).map(([type, count]) => {
                  const blockInfo = palette.find(b => b.id === type);
                  if (!blockInfo) return null;
                  return (
                    <li key={type} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {blockInfo.texture && !failedTextures[blockInfo.id] ? (
                          <img 
                            src={blockInfo.texture} 
                            alt={blockInfo.name} 
                            onError={() => handleImageError(blockInfo.id)}
                            className="w-4 h-4 rounded-sm flex-shrink-0 object-cover pixelated"
                          />
                        ) : (
                          <div 
                            className="w-4 h-4 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: blockInfo.color }}
                          />
                        )}
                        <span className="text-sm text-gray-200 truncate">{blockInfo.name}</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-blue-400">x{count}</span>
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
