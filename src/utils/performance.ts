// Performance optimization utilities for blazing fast performance

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for frequent events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization with LRU cache
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks = new Set<string>();

  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.add(name);
    }
  }

  measure(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e);
      }
    }
  }

  getMeasurements(): PerformanceEntry[] {
    if (typeof performance !== 'undefined') {
      return performance.getEntriesByType('measure');
    }
    return [];
  }

  clearMarks(): void {
    if (typeof performance !== 'undefined') {
      this.marks.forEach(mark => {
        try {
          performance.clearMarks(mark);
        } catch (e) {
          // Ignore errors
        }
      });
      this.marks.clear();
    }
  }
}

// Virtual scrolling utilities
export function createVirtualScroller<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(0 / itemHeight) - overscan);
  const endIndex = Math.min(items.length, Math.ceil(containerHeight / itemHeight) + overscan);

  return {
    totalHeight,
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  };
}

// Image preloading with priority
export class ImagePreloader {
  private preloadQueue: Array<{ src: string; priority: number }> = [];
  private loading = false;

  add(src: string, priority: number = 0): void {
    this.preloadQueue.push({ src, priority });
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    if (!this.loading) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.loading || this.preloadQueue.length === 0) return;

    this.loading = true;
    
    while (this.preloadQueue.length > 0) {
      const { src } = this.preloadQueue.shift()!;
      
      try {
        await this.preloadImage(src);
      } catch (error) {
        console.warn(`Failed to preload image: ${src}`, error);
      }
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.loading = false;
  }

  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }
}

// Request batching for API calls
export class RequestBatcher<T> {
  private batch: Array<{ request: () => Promise<T>; resolve: (value: T) => void; reject: (error: any) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;

  constructor(batchSize: number = 10, batchDelay: number = 50) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  add(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ request, resolve, reject });
      
      if (this.batch.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.processBatch(), this.batchDelay);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const currentBatch = this.batch.splice(0, this.batchSize);
    
    await Promise.allSettled(
      currentBatch.map(async ({ request, resolve, reject }) => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
    );
  }
}

// Memory management
export class MemoryManager {
  private observers: Array<{ target: Element; callback: () => void }> = [];
  private cache = new LRUCache<string, any>(50);

  observeElement(target: Element, callback: () => void): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '50px' });
      
      observer.observe(target);
      this.observers.push({ target, callback });
    }
  }

  cleanup(): void {
    this.cache.clear();
    this.observers = [];
  }
}

// Global performance instance
export const performanceMonitor = new PerformanceMonitor();
export const imagePreloader = new ImagePreloader();
export const memoryManager = new MemoryManager();
