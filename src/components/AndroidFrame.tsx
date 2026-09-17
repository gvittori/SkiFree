/**
 * SkiFree Retro - Android Native Device Frame & Shell
 * Provides an authentic Android mobile experience with device shell on desktop
 * and responsive edge-to-edge native display on mobile devices.
 */

import React, { useState } from 'react';
import { Smartphone, Maximize2 } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const [forceFullWindow, setForceFullWindow] = useState(false);

  return (
    <div
      id="android-device-root"
      className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Desktop Mode Switcher (discreet pill at top-right) */}
      <div className="absolute top-2 right-2 z-40 hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-full px-2.5 py-1 text-[11px] font-mono text-slate-300 shadow-md">
        <button
          id="btn-toggle-frame"
          type="button"
          onClick={() => setForceFullWindow(!forceFullWindow)}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Toggle Android Device Frame / Full Window"
        >
          {forceFullWindow ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phone View</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Full View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container: Full screen on mobile, Smartphone Bezel on desktop unless toggled */}
      <div
        id="android-phone-chassis"
        className={`relative w-full h-full transition-all duration-300 flex flex-col overflow-hidden ${
          forceFullWindow
            ? 'max-w-none max-h-none rounded-none border-none'
            : 'md:max-w-[430px] md:max-h-[880px] md:h-[94vh] md:rounded-[44px] md:border-[10px] md:border-slate-800 md:ring-4 md:ring-slate-900/80 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Android Top Speaker Grill (visible on desktop chassis) */}
        {!forceFullWindow && (
          <div className="hidden md:flex absolute top-2 inset-x-0 justify-center z-40 pointer-events-none">
            <div className="w-16 h-1 bg-slate-800 rounded-full"></div>
          </div>
        )}

        {/* The Game Display Screen */}
        <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-white">
          {children}
        </div>

        {/* Android Gesture Navigation Bar at bottom */}
        <div
          id="android-gesture-bar"
          className="w-full h-4 bg-black/90 flex items-center justify-center z-30 pointer-events-none"
        >
          <div className="w-32 h-1 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
