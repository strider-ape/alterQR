import * as ImagePicker from 'expo-image-picker';
import { MotiPressable } from 'moti/interactions';
import { Alert, FlatList, Image, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NeoShadow } from '@/components/neo-shadow';
import { useQRLoop } from '@/hooks/use-qr-loop';

const OFFSET = 4;

// ─── Reusable Neo-Brutalist button ───────────────────────────────────────────
interface NeoBtnProps {
  onPress: () => void;
  label: string;
  /** Tailwind background color class, e.g. '#ffe03d' */
  bg: string;
  disabled?: boolean;
}

function NeoBtn({ onPress, label, bg, disabled = false }: NeoBtnProps) {
  // Mirror JS-side disabled into a SharedValue readable by the UI-thread worklet.
  const isDisabled = useSharedValue(disabled);
  isDisabled.value = disabled; // keep in sync on every render

  return (
    <View className="flex-1" style={{ paddingRight: OFFSET, paddingBottom: OFFSET }}>
      {/* Static shadow */}
      <View
        style={{
          position: 'absolute',
          top: OFFSET,
          left: OFFSET,
          bottom: 0,
          right: 0,
          backgroundColor: disabled ? '#888' : '#000',
        }}
      />
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
          backgroundColor: disabled ? '#ccc' : bg,
          borderWidth: 4,
          borderColor: disabled ? '#888' : '#000',
          alignItems: 'center',
          paddingVertical: 16,
        }}>
        <Text
          style={{
            fontWeight: '900',
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: disabled ? '#999' : '#000',
          }}>
          {label}
        </Text>
      </MotiPressable>
    </View>
  );
}

// ─── Grid card ───────────────────────────────────────────────────────────────
function QRGridCard({ uri, index }: { uri: string; index: number }) {
  return (
    <View className="flex-1" style={{ paddingRight: OFFSET, paddingBottom: OFFSET }}>
      {/* Shadow */}
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
      {/* Card */}
      <View className="overflow-hidden border-4 border-black bg-white">
        <Image
          source={{ uri }}
          className="aspect-square w-full"
          resizeMode="cover"
        />
        {/* Label strip */}
        <View className="border-t-4 border-black bg-[#b8ff3d] px-2 py-1">
          <Text className="text-xs font-black uppercase tracking-widest text-black">
            QR #{index + 1}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { qrImages, addImages, clearAll } = useQRLoop();
  const insets = useSafeAreaInsets();

  async function handlePickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to select QR codes.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      orderedSelection: true,
    });

    if (result.canceled) return;
    await addImages(result.assets.map((a) => a.uri));
  }

  function handleClearAll() {
    if (qrImages.length === 0) return;
    Alert.alert(
      'CLEAR ALL?',
      `Remove all ${qrImages.length} QR code(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => clearAll() },
      ],
    );
  }

  return (
    <View className="flex-1 bg-[#f7f7f2]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        className="border-b-4 border-black px-5 pb-5"
        style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-xs font-black uppercase tracking-[6px] text-black/40">
          MANAGE
        </Text>
        <Text className="mt-1 text-4xl font-black uppercase leading-none tracking-tight text-black">
          QR CODES
        </Text>
      </View>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <View className="flex-row border-b-4 border-black px-5 pb-6 pt-5">
        <NeoBtn onPress={handlePickImages} label="＋ ADD QR" bg="#ffe03d" />
        <NeoBtn
          onPress={handleClearAll}
          label="CLEAR ALL"
          bg="#ff5ca8"
          disabled={qrImages.length === 0}
        />
      </View>

      {/* ── Image grid ─────────────────────────────────────────────────────── */}
      {qrImages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-black uppercase tracking-widest text-black/30">
            NO QR CODES YET.{'\n'}TAP ADD QR TO GET STARTED.
          </Text>
        </View>
      ) : (
        <>
          {/* Count header */}
          <View className="px-5 pb-2 pt-4">
            <Text className="text-xs font-black uppercase tracking-widest text-black/40">
              {qrImages.length} CODE{qrImages.length !== 1 ? 'S' : ''} SAVED
            </Text>
          </View>

          <FlatList
            data={qrImages}
            numColumns={2}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
            columnWrapperStyle={{ gap: 0 }}
            renderItem={({ item, index }) => (
              <QRGridCard uri={item} index={index} />
            )}
          />
        </>
      )}
    </View>
  );
}
