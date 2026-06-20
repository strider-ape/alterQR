import { ActivityIndicator, Image, Text, View } from 'react-native';

import { useQRLoop } from '@/hooks/use-qr-loop';

export default function HomeScreen() {
  const { qrImages, currentIndex, isLoading } = useQRLoop();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const activeUri = qrImages.length > 0 ? qrImages[currentIndex] : null;

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {activeUri ? (
        <>
          <Image
            source={{ uri: activeUri }}
            className="h-72 w-72 rounded-2xl"
            resizeMode="contain"
          />
          <Text className="mt-4 text-sm text-gray-400">
            {currentIndex + 1} / {qrImages.length}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-2xl font-bold text-gray-700">No QR codes added yet.</Text>
          <Text className="mt-2 text-center text-sm text-gray-400">
            Go to Settings to upload your QR screenshots.
          </Text>
        </>
      )}
    </View>
  );
}
