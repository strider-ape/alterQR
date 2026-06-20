import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-800">Settings</Text>
      <Text className="mt-2 text-base text-gray-500">
        Upload and manage your QR screenshots here.
      </Text>
    </View>
  );
}
