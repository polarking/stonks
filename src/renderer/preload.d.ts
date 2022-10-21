import { StockInfo } from 'common/types';
import { Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(channel: Channels, args: string[]): void;
        on(
          channel: Channels,
          func: (args: string[]) => void
        ): (() => void) | undefined;
        once(channel: Channels, func: (args: StockInfo[]) => void): void;
      };
    };
  }
}

export {};
