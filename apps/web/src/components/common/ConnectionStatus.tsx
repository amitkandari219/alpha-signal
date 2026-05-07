/**
 * Connection Status Indicator
 *
 * Shows LIVE/DELAYED/CONNECTING badge based on WebSocket connection status
 */

import { useWebSocketStore } from '../../store/useWebSocketStore';

export function ConnectionStatus() {
  const { status } = useWebSocketStore();

  if (status === 'CONNECTED') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success-500/10 border border-success-500/20">
        <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
        <span className="text-xs font-medium text-success-400">LIVE</span>
      </div>
    );
  }

  if (status === 'CONNECTING') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning-500/10 border border-warning-500/20">
        <div className="w-2 h-2 rounded-full bg-warning-500 animate-pulse" />
        <span className="text-xs font-medium text-warning-400">CONNECTING</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-700/50 border border-neutral-600">
      <div className="w-2 h-2 rounded-full bg-neutral-400" />
      <span className="text-xs font-medium text-neutral-400">DELAYED</span>
    </div>
  );
}
