/// <reference types="vite/client" />

// Item image declarations for TypeScript
declare module '*.png' {
  const src: string;
  export default src;
}

// Performance optimizations
interface Performance {
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): void;
  getEntriesByType(type: string): PerformanceEntry[];
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

// Web Workers for heavy computations
declare class Worker {
  constructor(scriptURL: string | URL, options?: WorkerOptions);
  postMessage(message: any, transfer?: Transferable[]): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  terminate(): void;
}

// Service Worker for caching
declare interface ServiceWorkerRegistration {
  updateViaCache: 'all' | 'imports' | 'none';
  scope: string;
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  navigationPreload: NavigationPreloadManager;
  pushManager: PushManager;
  sync: SyncManager;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
  getNotifications(filter?: GetNotificationOptions): Promise<Notification[]>;
}
