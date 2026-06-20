import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { QRLoopProvider } from '@/hooks/use-qr-loop';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <QRLoopProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </QRLoopProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
