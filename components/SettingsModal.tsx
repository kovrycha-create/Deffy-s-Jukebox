import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PlayerSettings } from '../types';
import { defaultSettings, EQ_BANDS } from '../utils/settings';
import { CloseIcon, TrashIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onClearArtCache: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetPlayCounts: () => void;
  onOpenAlbumArtGenerator: () => void;
  onOpenMetadataGenerator: () => void;
}

type Tab = 'Playback' | 'Appearance' | 'Audio' | 'Data' | 'About' | 'Developer';

const EQ_PRESETS: Record<string, {name: string, bands: number[]}> = {
    'flat': { name: 'Flat', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    'rock': { name: 'Rock', bands: [5, 3, 1, -2, -4, -3, 0, 4, 6, 7] },
    'pop': { name: 'Pop', bands: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2] },
    'jazz': { name: 'Jazz', bands: [4, 2, 1, 2, -2, -2, 0, 1, 3, 4] },
    'classical': { name: 'Classical', bands: [5, 4, 3, 2, -2, -2, -1, 0, 2, 3] },
    'bass-boost': { name: 'Bass Boost', bands: [8, 6, 4, 2, 0, -2, -3, -4, -4, -5] },
    'treble-boost': { name: 'Treble Boost', bands: [-5, -4, -3, -2, 0, 2, 4, 6, 7, 8] },
    'vocal-boost': { name: 'Vocal Boost', bands: [-2, -3, -1, 3, 5, 5, 3, 0, -1, -2] },
};


const SettingsRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-4 border-b border-[var(--surface-active-color)]">
    <div>
      <p className="font-semibold text-[var(--text-primary)]">{label}</p>
      <p className="text-sm text-[var(--text-muted)]">{description}</p>
    </div>
    <div className="flex-shrink-0 ml-4">{children}</div>
  </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <label className="toggle-switch-container">
    <input type="checkbox" className="toggle-switch-input" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className="toggle-switch-slider"></span>
  </label>
);

const KeyboardShortcuts: React.FC = () => {
    const shortcuts = [
        { key: 'Space', desc: 'Play / Pause' },
        { key: '←', desc: 'Previous Track' },
        { key: '→', desc: 'Next Track' },
        { key: '↑ / ↓', desc: 'Volume Up / Down' },
        { key: 'M', desc: 'Mute / Unmute' },
        { key: 'S', desc: 'Toggle Shuffle' },
        { key: 'R', desc: 'Cycle Repeat Mode' },
        { key: 'A', desc: 'Toggle Autoplay' },
    ];
    return (
        <div className="mt-4 p-4 bg-[var(--bg-color)] rounded-lg border border-[var(--surface-active-color)]">
            <h3 className="font-bold text-lg text-[var(--text-primary)] mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {shortcuts.map(({key, desc}) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{desc}</span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-active-color)] rounded">{key}</kbd>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onClearArtCache, onExportData, onImportData, onResetPlayCounts, onOpenAlbumArtGenerator, onOpenMetadataGenerator }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Playback');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [devClicks, setDevClicks] = useState(0);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('deffy-jukebox-devmode') === 'true');

  const handleVersionClick = () => {
    const newClicks = devClicks + 1;
    setDevClicks(newClicks);
    if (newClicks >= 5) {
        setDevMode(true);
        localStorage.setItem('deffy-jukebox-devmode', 'true');
    }
  };


  useEffect(() => {
    if (isOpen && modalRef.current && position === null) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = modalRef.current;
      setPosition({
        x: (innerWidth - offsetWidth) / 2,
        y: (innerHeight - offsetHeight) / 2,
      });
    } else if (!isOpen) {
        setPosition(null);
    }
  }, [isOpen, position]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;
    setPosition({ x: newX, y: newY });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    headerRef.current?.classList.remove('grabbing');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return;
    isDraggingRef.current = true;
    const modalRect = modalRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - modalRect.left,
      y: e.clientY - modalRect.top,
    };
    headerRef.current?.classList.add('grabbing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, onClose, handleMouseMove, handleMouseUp]);
  
  const { equalizer } = settings;
  const handleEqBandChange = (index: number, value: number) => {
    const newBands = [...equalizer.bands];
    newBands[index] = value;
    onUpdateSettings({ equalizer: { ...equalizer, bands: newBands, preset: 'custom' }});
  };
  const handlePresetChange = (presetName: string) => {
    if (EQ_PRESETS[presetName]) {
        onUpdateSettings({
            equalizer: { ...equalizer, bands: EQ_PRESETS[presetName].bands, preset: presetName }
        });
    }
  };
  const handleResetEq = () => {
    onUpdateSettings({
        equalizer: { ...defaultSettings.equalizer, enabled: equalizer.enabled }
    });
  };

  if (!isOpen) return null;

  const handleResetSettings = () => {
    onUpdateSettings(defaultSettings);
    setConfirmAction(null);
  }
  
  const handleClearCache = () => {
    onClearArtCache();
    setConfirmAction(null);
  }
  
  const handleResetPlayCounts = () => {
    onResetPlayCounts();
    setConfirmAction(null);
  }
  
  const tabs: Tab[] = ['Playback', 'Appearance', 'Audio', 'Data', 'About'];
  if (devMode) {
    tabs.push('Developer');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Playback':
        return (
          <>
            <SettingsRow label="Crossfade" description="Smoothly transition between songs.">
              <ToggleSwitch checked={settings.crossfadeEnabled} onChange={val => onUpdateSettings({ crossfadeEnabled: val })} />
            </SettingsRow>
            {settings.crossfadeEnabled && (
                <div className="py-4 border-b border-[var(--surface-active-color)]">
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Crossfade Duration: {settings.crossfadeDuration}s</label>
                    <input
                        type="range"
                        min="1"
                        max="12"
                        value={settings.crossfadeDuration}
                        onChange={e => onUpdateSettings({ crossfadeDuration: Number(e.target.value) })}
                        className="w-full h-2 bg-[var(--surface-active-color)] rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            )}
            <SettingsRow label="Autoplay" description="Automatically play the next song in the queue or playlist.">
              <ToggleSwitch checked={settings.isAutoplayEnabled} onChange={val => onUpdateSettings({ isAutoplayEnabled: val })} />
            </SettingsRow>
            <KeyboardShortcuts />
          </>
        );
      case 'Appearance':
        return (
          <>
            <SettingsRow label="Volume Control Style" description="Choose how the volume slider is displayed on the player.">
                <div className="flex items-center gap-2 bg-[var(--surface-active-color)] p-1 rounded-md">
                    <button onClick={() => onUpdateSettings({ volumeControlStyle: 'horizontal' })} className={`px-3 py-1 text-sm rounded ${settings.volumeControlStyle === 'horizontal' ? 'bg-[var(--accent-color)] text-white' : ''}`}>Horizontal</button>
                    <button onClick={() => onUpdateSettings({ volumeControlStyle: 'popup' })} className={`px-3 py-1 text-sm rounded ${settings.volumeControlStyle === 'popup' ? 'bg-[var(--accent-color)] text-white' : ''}`}>Popup</button>
                </div>
            </SettingsRow>
             <SettingsRow label="Reduce Motion" description="Disable animations for a simpler experience.">
              <ToggleSwitch checked={settings.reduceMotion} onChange={val => onUpdateSettings({ reduceMotion: val })} />
            </SettingsRow>
          </>
        );
      case 'Audio':
        return (
          <>
            <SettingsRow label="Enable Audio Visualizer" description="Show the visualizer in the player and Now Playing view.">
              <ToggleSwitch checked={settings.visualizerEnabled} onChange={val => onUpdateSettings({ visualizerEnabled: val })} />
            </SettingsRow>
             <SettingsRow label="Visualizer Style" description="Choose the style for the Now Playing visualizer.">
                <div className="flex items-center gap-2 bg-[var(--surface-active-color)] p-1 rounded-md">
                    <button onClick={() => onUpdateSettings({ defaultVisualizerStyle: 'bars' })} className={`px-3 py-1 text-sm rounded ${settings.defaultVisualizerStyle === 'bars' ? 'bg-[var(--accent-color)] text-white' : ''}`}>Bars</button>
                    <button onClick={() => onUpdateSettings({ defaultVisualizerStyle: 'circle' })} className={`px-3 py-1 text-sm rounded ${settings.defaultVisualizerStyle === 'circle' ? 'bg-[var(--accent-color)] text-white' : ''}`}>Circle</button>
                    <button onClick={() => onUpdateSettings({ defaultVisualizerStyle: 'waveform' })} className={`px-3 py-1 text-sm rounded ${settings.defaultVisualizerStyle === 'waveform' ? 'bg-[var(--accent-color)] text-white' : ''}`}>Wave</button>
                </div>
            </SettingsRow>
            <div className="pt-4 mt-4 border-t border-[var(--surface-active-color)]">
              <div className="flex items-center justify-between pb-4">
                  <div>
                      <p className="font-semibold text-[var(--text-primary)]">Graphic Equalizer</p>
                      <p className="text-sm text-[var(--text-muted)]">Fine-tune your audio experience.</p>
                  </div>
                  <div className="flex items-center gap-4">
                      <button onClick={handleResetEq} className="px-3 py-1 text-sm rounded-md font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-colors">Reset</button>
                      <ToggleSwitch checked={equalizer.enabled} onChange={val => onUpdateSettings({ equalizer: { ...equalizer, enabled: val }})} />
                  </div>
              </div>
              <div className={`p-4 bg-[var(--bg-color)] rounded-lg grid grid-cols-11 gap-x-2 sm:gap-x-4 items-center justify-items-center transition-opacity duration-300 ${!equalizer.enabled && 'opacity-50 pointer-events-none'}`}>
                  <div className="flex flex-col items-center gap-2 h-full justify-between">
                      <span className="text-xs font-mono tabular-nums">{equalizer.preamp.toFixed(1)}</span>
                      <input type="range" className="eq-slider" min="-12" max="12" step="0.5" value={equalizer.preamp} onChange={e => onUpdateSettings({ equalizer: { ...equalizer, preamp: Number(e.target.value) }})} />
                      <span className="text-xs font-bold text-[var(--text-muted)]">Pre</span>
                  </div>
                  {EQ_BANDS.map((freq, i) => (
                      <div key={freq} className="flex flex-col items-center gap-2 h-full justify-between">
                          <span className="text-xs font-mono tabular-nums">{equalizer.bands[i].toFixed(1)}</span>
                          <input type="range" className="eq-slider" min="-12" max="12" step="0.5" value={equalizer.bands[i]} onChange={e => handleEqBandChange(i, Number(e.target.value))} />
                          <span className="text-xs font-bold text-[var(--text-muted)]">{freq >= 1000 ? `${freq/1000}k` : freq}</span>
                      </div>
                  ))}
              </div>
              <div className={`mt-4 transition-opacity duration-300 ${!equalizer.enabled && 'opacity-50 pointer-events-none'}`}>
                  <label htmlFor="eq-preset" className="text-sm font-semibold text-[var(--text-secondary)]">Presets</label>
                  <select id="eq-preset" onChange={e => handlePresetChange(e.target.value)} value={equalizer.preset} className="w-full mt-2 bg-[var(--bg-color)] text-[var(--text-primary)] p-2 border border-[var(--surface-active-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all">
                      <option value="custom" disabled>Custom</option>
                      {Object.entries(EQ_PRESETS).map(([key, { name }]) => <option key={key} value={key}>{name}</option>)}
                  </select>
              </div>
            </div>
          </>
        );
       case 'Data':
        return (
          <>
            <SettingsRow label="Export User Data" description="Save your playlists, favorites, and settings to a file.">
                <button 
                    onClick={onExportData}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--accent-hover-color)] hover:text-black transition-colors"
                >
                    Export
                </button>
            </SettingsRow>
            <SettingsRow label="Import User Data" description="Load playlists, favorites, and settings from a backup file.">
                <input type="file" accept=".json" ref={importFileRef} onChange={onImportData} className="hidden" />
                <button 
                    onClick={() => importFileRef.current?.click()}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--accent-hover-color)] hover:text-black transition-colors"
                >
                    Import
                </button>
            </SettingsRow>
            <SettingsRow label="Reset Play Counts" description="Reset the play count for all songs back to zero.">
                <button 
                    onClick={() => { setConfirmMessage("Are you sure you want to reset all play counts? This action cannot be undone."); setConfirmAction(() => handleResetPlayCounts); }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--heart-hover-color)] hover:text-white transition-colors"
                >
                    Reset Counts
                </button>
            </SettingsRow>
          </>
        );
      case 'Developer':
        return (
            <>
                <SettingsRow label="Album Art Generator" description="Use AI to generate missing album art for songs.">
                    <button 
                        onClick={() => { onOpenAlbumArtGenerator(); onClose(); }}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--accent-hover-color)] hover:text-black transition-colors"
                    >
                        Open
                    </button>
                </SettingsRow>
                <SettingsRow label="Metadata Generator" description="Use AI to fill in missing BPM and style information.">
                    <button 
                        onClick={() => { onOpenMetadataGenerator(); onClose(); }}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--accent-hover-color)] hover:text-black transition-colors"
                    >
                        Open
                    </button>
                </SettingsRow>
                <SettingsRow label="Album Art Cache" description="Clear locally stored AI-generated album art to save space.">
                    <button 
                        onClick={() => { setConfirmMessage("Are you sure you want to delete all cached album art? This cannot be undone."); setConfirmAction(() => handleClearCache); }}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--heart-hover-color)] hover:text-white transition-colors"
                    >
                        Clear Cache
                    </button>
                </SettingsRow>
            </>
        );
      case 'About':
        return (
            <>
                <div className="text-center">
                    <img src="https://deffy.me/media/deffysjukebox.png" alt="Deffy's Jukebox Logo" className="h-12 mx-auto mb-4 object-contain" />
                    <p className="text-lg font-bold text-[var(--text-primary)]">Deffy's Jukebox</p>
                    <p className="text-sm text-[var(--text-muted)] cursor-pointer" onClick={handleVersionClick}>Version 1.2.0</p>
                </div>
                 <div className="mt-8 pt-4 border-t border-[var(--surface-active-color)]">
                     <SettingsRow label="Reset All Settings" description="Restore all settings to their original defaults.">
                        <button 
                            onClick={() => { setConfirmMessage("Are you sure you want to reset all settings to their defaults?"); setConfirmAction(() => handleResetSettings); }}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--heart-hover-color)] hover:text-white transition-colors"
                        >
                            Reset
                        </button>
                    </SettingsRow>
                 </div>
            </>
        );
    }
  };

  return (
    <>
      <div className="modal-backdrop animate-fade-in-sm" onClick={onClose}></div>
      <div 
        ref={modalRef}
        style={position ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none', position: 'fixed' } : { visibility: 'hidden' }}
        className="modal-content w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col animate-fade-in-sm"
      >
        <div 
            ref={headerRef}
            onMouseDown={handleMouseDown}
            className="modal-header flex items-center justify-between p-4 flex-shrink-0 border-b border-[var(--surface-active-color)]"
        >
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="modal-tabs">
            {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`modal-tab-button ${activeTab === tab ? 'active' : ''}`}>
                    {tab}
                </button>
            ))}
        </div>
        <div className="modal-tab-content">{renderContent()}</div>
      </div>
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface-color)] w-full max-w-sm rounded-lg shadow-2xl p-6 animate-fade-in-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrashIcon className="w-6 h-6 text-[var(--heart-color)]" />
              Confirm Action
            </h2>
            <p className="text-[var(--text-secondary)] my-4">{confirmMessage}</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmAction(null)} className="px-5 py-2 rounded-lg font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-colors">
                Cancel
              </button>
              <button onClick={() => confirmAction()} className="px-5 py-2 rounded-lg font-semibold bg-[var(--heart-color)] text-white hover:bg-[var(--heart-hover-color)] transition-colors">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsModal;