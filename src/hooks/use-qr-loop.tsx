import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY_IMAGES = '@alterqr/qr_images';
const STORAGE_KEY_INDEX = '@alterqr/current_index';

export interface UseQRLoopReturn {
  /** Ordered list of local image URIs managed by the user. */
  qrImages: string[];
  /** Index of the currently active image in `qrImages`. */
  currentIndex: number;
  /** Append new URIs to the list and persist to AsyncStorage. */
  addImages: (uris: string[]) => Promise<void>;
  /** Remove all images and reset the index to 0. */
  clearAll: () => Promise<void>;
  /**
   * Increment `currentIndex` by 1, wrapping back to 0 when the end of the
   * list is reached. Persists the new index to AsyncStorage immediately so
   * the position survives app restarts.
   */
  advanceToNextQR: () => Promise<void>;
  /** True while the initial AsyncStorage load is in progress. */
  isLoading: boolean;
}

/**
 * Manages the QR image loop state and keeps it in sync with AsyncStorage.
 *
 * Usage:
 *   const { qrImages, currentIndex, addImages, clearAll, advanceToNextQR } = useQRLoop();
 *
 * Typical share flow:
 *   1. User taps "SHARE QR"  →  Sharing.shareAsync(qrImages[currentIndex])
 *   2. Share sheet dismisses →  advanceToNextQR()
 *   3. The card immediately shows the next QR code (loops back to 0 at the end)
 */
const QRLoopContext = createContext<UseQRLoopReturn | null>(null);

export function QRLoopProvider({ children }: { children: ReactNode }) {
  const [qrImages, setQrImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ─── Hydrate from AsyncStorage on mount ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [rawImages, rawIndex] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_IMAGES),
          AsyncStorage.getItem(STORAGE_KEY_INDEX),
        ]);

        if (cancelled) return;

        const images: string[] = rawImages ? JSON.parse(rawImages) : [];

        const index: number = rawIndex
          ? Math.min(parseInt(rawIndex, 10), Math.max(0, images.length - 1))
          : 0;

        setQrImages(images);
        setCurrentIndex(index);
      } catch (e) {
        console.error('[useQRLoop] Failed to hydrate from AsyncStorage:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // ─── Persist helpers ────────────────────────────────────────────────────────
  const persistImages = useCallback(async (images: string[]) => {
    await AsyncStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(images));
  }, []);

  const persistIndex = useCallback(async (index: number) => {
    await AsyncStorage.setItem(STORAGE_KEY_INDEX, String(index));
  }, []);

  // ─── Public API ─────────────────────────────────────────────────────────────
  const addImages = useCallback(
    async (uris: string[]) => {
      if (uris.length === 0) return;
      setQrImages((prev) => {
        const next = [...prev, ...uris];
        persistImages(next);
        return next;
      });
    },
    [persistImages],
  );

  const clearAll = useCallback(async () => {
    setQrImages([]);
    setCurrentIndex(0);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY_IMAGES),
      AsyncStorage.removeItem(STORAGE_KEY_INDEX),
    ]);
  }, []);

  /**
   * Advance the loop by one step.
   *
   * Uses the functional form of both setters so we always read the
   * *latest* state without capturing stale closure values. The new index
   * is persisted to AsyncStorage before the state update resolves, keeping
   * the stored value in sync with what the UI will render next.
   */
  const advanceToNextQR = useCallback(async () => {
    // Wrap in a Promise so callers can await the full persistence.
    await new Promise<void>((resolve) => {
      setQrImages((images) => {
        if (images.length === 0) {
          resolve();
          return images;
        }

        setCurrentIndex((prev) => {
          const next = (prev + 1) % images.length;
          // Fire-and-forget persistence; resolve after scheduling.
          persistIndex(next).then(resolve);
          return next;
        });

        return images; // images array itself does not change
      });
    });
  }, [persistIndex]);

  const value = { qrImages, currentIndex, addImages, clearAll, advanceToNextQR, isLoading };

  return (
    <QRLoopContext.Provider value={value}>
      {children}
    </QRLoopContext.Provider>
  );
}

export function useQRLoop(): UseQRLoopReturn {
  const context = useContext(QRLoopContext);
  if (!context) {
    throw new Error('useQRLoop must be used within a QRLoopProvider');
  }
  return context;
}
