import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore } from '../../../store/worldStore';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Check, Box, Calendar, Settings2 } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLACEHOLDERS = [
  "My Awesome Castle",
  "Secret Underwater Base",
  "Floating Sky Island",
  "Dwarven Fortress",
  "Cyberpunk City",
  "Cozy Cottage",
  "Space Station Alpha",
  "Hidden Temple",
  "Treehouse Village",
  "Volcano Lair"
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { availableVersions, loadVersions, createProject } = useWorldStore();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0] + '...');
  const [version, setVersion] = useState('1.20.4');
  const [settings, setSettings] = useState({
    shadows: true,
    showGrid: true,
    timePreset: 'day' as 'day' | 'night'
  });

  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setStep(1);
      setName('');
      setPlaceholder(`${PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]}...`);
    }
  }, [isOpen, loadVersions]);

  const handleCreate = () => {
    if (!name.trim()) return;
    
    createProject(name, version, settings);
    onClose();
    navigate('/builder'); // Assumendo che la rotta del builder sia /builder
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden border shadow-2xl bg-slate-950 border-white/10 rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white">New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex w-full h-1 bg-slate-900">
          <div 
            className="h-full transition-all duration-300 bg-violet-600" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px] flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: NAME */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1 gap-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Name your World</h3>
                    <p className="text-sm text-gray-400">Give your project a unique identity.</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Project Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 text-white transition-all border rounded-xl bg-slate-900 border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: VERSION */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1 gap-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Select Version</h3>
                    <p className="text-sm text-gray-400">Choose the Minecraft version for blocks.</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Minecraft Version</label>
                  <div className="relative">
                    <select 
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-4 py-3 text-white transition-all border appearance-none cursor-pointer rounded-xl bg-slate-900 border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      {availableVersions.length === 0 ? (
                        <option>Loading versions...</option>
                      ) : (
                        availableVersions.map(v => (
                          <option key={v} value={v}>Minecraft Java {v}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute transform -translate-y-1/2 right-4 top-1/2 pointer-events-none text-gray-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    We automatically fetch the latest stable releases. Snapshots are excluded to ensure stability.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SETTINGS */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1 gap-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Initial Settings</h3>
                    <p className="text-sm text-gray-400">Configure your workspace environment.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Toggle Shadows */}
                  <div 
                    className="flex items-center justify-between p-3 transition-colors border cursor-pointer rounded-xl border-white/5 hover:bg-white/5"
                    onClick={() => setSettings(s => ({ ...s, shadows: !s.shadows }))}
                  >
                    <span className="text-sm font-medium text-gray-200">Enable Shadows</span>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.shadows ? 'bg-blue-600' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.shadows ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>

                  {/* Toggle Grid */}
                  <div 
                    className="flex items-center justify-between p-3 transition-colors border cursor-pointer rounded-xl border-white/5 hover:bg-white/5"
                    onClick={() => setSettings(s => ({ ...s, showGrid: !s.showGrid }))}
                  >
                    <span className="text-sm font-medium text-gray-200">Show Grid</span>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.showGrid ? 'bg-blue-600' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showGrid ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>

                  {/* Time Preset */}
                  <div className="flex items-center justify-between p-3 border rounded-xl border-white/5">
                    <span className="text-sm font-medium text-gray-200">Starting Time</span>
                    <div className="flex bg-slate-900 rounded-lg p-1">
                      <button 
                        onClick={() => setSettings(s => ({ ...s, timePreset: 'day' }))}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${settings.timePreset === 'day' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        Day
                      </button>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, timePreset: 'night' }))}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${settings.timePreset === 'night' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        Night
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions */}
          <div className="flex justify-between pt-6 mt-auto border-t border-white/10">
            {step > 1 ? (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                Back
              </button>
            ) : (
              <div /> /* Spacer */
            )}

            <button
              onClick={() => {
                if (step < 3) setStep(s => s + 1);
                else handleCreate();
              }}
              disabled={step === 1 && !name.trim()}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white transition-all rounded-lg ${
                step === 1 && !name.trim() 
                  ? 'bg-slate-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-900/20 active:scale-95'
              }`}
            >
              {step === 3 ? (
                <>Create Project <Check className="w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
