import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

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
  /** Advance to the next image, wrapping around when at the end. */
  advance: () => Promise<void>;
  /** True while the initial AsyncStorage load is in progress. */
  isLoading: boolean;
}

/**
 * Manages the QR image loop state and keeps it in sync with AsyncStorage.
 *
 * Usage:
 *   const { qrImages, currentIndex, addImages, clearAll, advance } = useQRLoop();
 */
export function useQRLoop(): UseQRLoopReturn {
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

  const advance = useCallback(async () => {
    setQrImages((images) => {
      if (images.length === 0) return images;
      setCurrentIndex((prev) => {
        const next = (prev + 1) % images.length;
        persistIndex(next);
        return next;
      });
      return images;
    });
  }, [persistIndex]);

  return { qrImages, currentIndex, addImages, clearAll, advance, isLoading };
}
