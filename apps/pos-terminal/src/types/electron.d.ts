// Electron API type declarations
export {};

declare global {
  interface Window {
    electronAPI?: {
      getServerUrl: () => Promise<string>;
      getConfig: () => Promise<{
        mode: string | null;
        serverUrl: string | null;
      }>;
      setConfig: (config: { mode?: string; serverUrl?: string }) => Promise<boolean>;
      isElectron: boolean;
      platform: string;
    };
  }
}
