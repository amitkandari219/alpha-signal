/**
 * Crosshair Sync Context
 *
 * Synchronizes crosshair position across all chart panels
 * (main price chart, volume, and indicator sub-charts)
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CrosshairState {
  activeIndex: number | null;
  activeTime: string | null;
  activeData: any | null;
}

interface CrosshairSyncContextType {
  crosshairState: CrosshairState;
  setCrosshairState: (state: CrosshairState) => void;
  clearCrosshair: () => void;
}

const CrosshairSyncContext = createContext<CrosshairSyncContextType | undefined>(
  undefined
);

interface CrosshairSyncProviderProps {
  children: ReactNode;
}

export const CrosshairSyncProvider: React.FC<CrosshairSyncProviderProps> = ({
  children,
}) => {
  const [crosshairState, setCrosshairStateInternal] = useState<CrosshairState>({
    activeIndex: null,
    activeTime: null,
    activeData: null,
  });

  const setCrosshairState = (state: CrosshairState) => {
    setCrosshairStateInternal(state);
  };

  const clearCrosshair = () => {
    setCrosshairStateInternal({
      activeIndex: null,
      activeTime: null,
      activeData: null,
    });
  };

  return (
    <CrosshairSyncContext.Provider
      value={{ crosshairState, setCrosshairState, clearCrosshair }}
    >
      {children}
    </CrosshairSyncContext.Provider>
  );
};

export const useCrosshairSync = () => {
  const context = useContext(CrosshairSyncContext);
  if (context === undefined) {
    throw new Error('useCrosshairSync must be used within a CrosshairSyncProvider');
  }
  return context;
};
