import * as Sharing from 'expo-sharing';
import { MotiPressable } from 'moti/interactions';
import { useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { NeoShadow } from '@/components/neo-shadow';
import { useQRLoop } from '@/hooks/use-qr-loop';

const OFFSET = 4;

// ─── SHARE QR animated button ────────────────────────────────────────────────
// MotiPressable's `animate` prop is called inside useDerivedValue on the UI
// thread — it MUST be a worklet (react-native-worklets enforces this strictly).
// Closed-over JS values can't be read from worklets, so `disabled` is stored
// in a SharedValue that the UI thread can access safely.
function ShareButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  // Mirror the JS-side `disabled` prop into a shared value the worklet can read.
  const isDisabled = useSharedValue(disabled ?? false);
  isDisabled.value = disabled ?? false; // keep in sync on every render

  return (
    // Outer shell: static shadow sits here, content slides over it on press
    <View style={{ paddingRight: OFFSET, paddingBottom: OFFSET }}>
      {/* Static black shadow — does NOT move */}
      <View
        style={{
          position: 'absolute',
          top: OFFSET,
          left: OFFSET,
          bottom: 0,
          right: 0,
          backgroundColor: '#000',
        }}
      />
      {/* MotiPressable: 'worklet' is required — animate runs on the UI thread */}
      <MotiPressable
        onPress={disabled ? undefined : onPress}
        animate={({ pressed }) => {
          'worklet';
          const offset = isDisabled.value ? 0 : pressed ? OFFSET : 0;
          return {
            transform: [{ translateX: offset }, { translateY: offset }],
          };
        }}
        transition={{ type: 'timing', duration: 80 }}
        style={{
          backgroundColor: disabled ? '#d4b800' : '#ffe03d',
          borderWidth: 4,
          borderColor: '#000',
          alignItems: 'center',
          paddingVertical: 20,
          opacity: disabled ? 0.7 : 1,
        }}>
        <Text
          style={{
            fontWeight: '900',
            fontSize: 20,
            textTransform: 'uppercase',
            letterSpacing: 5,
            color: '#000',
          }}>
          SHARE QR
        </Text>
      </MotiPressable>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { qrImages, currentIndex, advanceToNextQR, isLoading } = useQRLoop();
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    const uri = qrImages[currentIndex];
    if (!uri || isSharing) return;

    // Check the platform can share files before attempting
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return;

    setIsSharing(true);
    try {
      // shareAsync resolves only after the sheet is fully dismissed —
      // either the user completed the share or explicitly cancelled it.
      await Sharing.shareAsync(uri, {
        mimeType: 'image/*',
        dialogTitle: 'Share your QR code',
      });

      // Sheet has closed: advance the loop to the next QR.
      await advanceToNextQR();
    } catch {
      // The OS threw (e.g. permission denied, file not found). Advance anyway
      // so the loop doesn't get stuck on a broken entry.
      await advanceToNextQR();
    } finally {
      setIsSharing(false);
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f7f7f2]">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const activeUri = qrImages.length > 0 ? qrImages[currentIndex] : null;

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (!activeUri) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f7f7f2] px-6">
        <NeoShadow>
          <View className="border-4 border-black bg-[#ffe03d] px-8 py-8">
            <Text className="text-center text-3xl font-black uppercase leading-tight text-black">
              NO QR{'\n'}CODES YET
            </Text>
            <View className="mt-4 border-t-2 border-black/20 pt-3">
              <Text className="text-center text-xs font-black uppercase tracking-widest text-black/60">
                Go to Settings to add some!
              </Text>
            </View>
          </View>
        </NeoShadow>
      </View>
    );
  }

  // ─── Active QR ─────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#f7f7f2] px-5 pb-8 pt-10">
      {/* Screen title */}
      <Text className="mb-1 text-xs font-black uppercase tracking-[6px] text-black/40">
        CURRENTLY SHOWING
      </Text>
      <Text className="mb-6 text-4xl font-black uppercase leading-none tracking-tight text-black">
        ACTIVE QR{'\n'}CODE
      </Text>

      {/* QR image card — prominent neo-brutalist card with lime background */}
      <NeoShadow>
        <View className="border-4 border-black bg-[#b8ff3d] p-4">
          <Image
            source={{ uri: activeUri }}
            className="aspect-square w-full"
            resizeMode="contain"
          />
        </View>
      </NeoShadow>

      {/* Counter badge */}
      <View className="my-5 flex-row justify-center">
        <View className="border-2 border-black bg-white px-4 py-1">
          <Text className="text-xs font-black uppercase tracking-widest text-black">
            {currentIndex + 1} OF {qrImages.length}
          </Text>
        </View>
      </View>

      {/* Share QR — MotiPressable with physical press-down animation */}
      <ShareButton onPress={handleShare} disabled={isSharing} />
    </View>
  );
}
