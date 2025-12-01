import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Platform } from 'react-native';
import { RootStackParamList } from './src/types';
import { UI_COLORS } from './src/config/constants';

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [isReady, setIsReady] = useState(false);

  const linking = useMemo(
    () => ({
      prefixes:
        typeof window !== 'undefined'
          ? [window.location.origin]
          : ['http://localhost:8081', 'https://localhost:8081'],
      config: {
        screens: {
          Login: 'login',
          TableLanding: {
            path: 'table/:tableSlug',
            parse: {
              tableSlug: (tableSlug: string) => decodeURIComponent(tableSlug || ''),
            },
          },
          CustomerMenu: {
            path: 'table/:tableSlug/menu',
            parse: {
              tableSlug: (tableSlug: string) => decodeURIComponent(tableSlug || ''),
            },
          },
          OrderTracking: 'order/:orderId',
        },
      },
    }),
    []
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !isReady || typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const tableIdParam = params.get('tableId') || params.get('table');
    if (tableIdParam) {
      navigationRef.current?.navigate('TableLanding', { tableId: tableIdParam });
    }
  }, [isReady, navigationRef]);

  const paperTheme = useMemo(
    () => ({
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: '#1A1A1A',
        onPrimary: '#FFFFFF',
        secondary: '#3A3A3A',
        onSecondary: '#FFFFFF',
        background: UI_COLORS.background,
        surface: UI_COLORS.surface,
        surfaceVariant: UI_COLORS.surfaceMuted,
        outline: UI_COLORS.border,
        onSurface: UI_COLORS.textPrimary,
        onSurfaceVariant: UI_COLORS.textSecondary,
      },
    }),
    []
  );

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <PaperProvider theme={paperTheme}>
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={() => setIsReady(true)}
              >
              <RootNavigator />
            </NavigationContainer>
          </PaperProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
