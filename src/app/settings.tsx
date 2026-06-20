import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useQRLoop } from '@/hooks/use-qr-loop';

export default function SettingsScreen() {
  const { qrImages, addImages, clearAll, isLoading } = useQRLoop();

  // ─── Handlers ───────────────────────────────────────────────────────────────
  async function handlePickImages() {
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library to select QR codes.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      // Orderedselection keeps them in the tapped order on iOS 15+
      orderedSelection: true,
    });

    if (result.canceled) return;

    const uris = result.assets.map((asset) => asset.uri);
    await addImages(uris);
  }

  function handleClearAll() {
    if (qrImages.length === 0) return;

    Alert.alert(
      'Clear all QR codes',
      `This will remove all ${qrImages.length} image(s). This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAll(),
        },
      ],
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pb-3 pt-6">
        <Text className="text-2xl font-bold text-gray-800">Settings</Text>
        <Text className="mt-1 text-sm text-gray-500">
          Manage your QR code images.
        </Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 px-5 pb-4">
        <Pressable
          onPress={handlePickImages}
          className="flex-1 items-center rounded-xl bg-indigo-500 py-3 active:opacity-75">
          <Text className="font-semibold text-white">＋ Add Images</Text>
        </Pressable>

        <Pressable
          onPress={handleClearAll}
          disabled={qrImages.length === 0}
          className="flex-1 items-center rounded-xl border border-red-300 py-3 active:opacity-75 disabled:opacity-40">
          <Text className="font-semibold text-red-500">Clear All</Text>
        </Pressable>
      </View>

      {/* Image list */}
      {qrImages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-gray-400">
            No QR codes yet.{'\n'}Tap "Add Images" to pick from your gallery.
          </Text>
        </View>
      ) : (
        <FlatList
          data={qrImages}
          keyExtractor={(_, i) => String(i)}
          contentContainerClassName="px-5 pb-8 gap-3"
          renderItem={({ item, index }) => (
            <View className="flex-row items-center rounded-xl border border-gray-100 bg-gray-50 p-3">
              <Image
                source={{ uri: item }}
                className="mr-3 h-16 w-16 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700">
                  QR Code {index + 1}
                </Text>
                <Text
                  className="mt-0.5 text-xs text-gray-400"
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  {item}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
