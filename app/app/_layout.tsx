import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/use-color-scheme';
import { ToastProvider } from '../contexts/ToastContext';

import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import TokenService from '../services/tokenService';
import { apiService } from '../services/apiService';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [appReady, setAppReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await TokenService.getToken();
        if (token) {
          try {
            const response = await apiService.getProfile();
            if (response.success && response.user) {
              setIsLoggedIn(true);
              setUserType(response.user.type);
            } else {
              await TokenService.removeToken();
              setIsLoggedIn(false);
              setUserType(null);
            }
          } catch (error) {
            await TokenService.removeToken();
            setIsLoggedIn(false);
            setUserType(null);
          }
        } else {
          setIsLoggedIn(false);
          setUserType(null);
        }

      } catch (e) {
        setIsLoggedIn(false);
        setUserType(null);
      } finally {
        setAppReady(true);
      }
    };
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>

          {isLoggedIn ? (
            userType === 'admin' ? <Redirect href="/adminDashboard" /> : <Redirect href="/installments" />
          ) : <Redirect href="/" />}

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Landing Page', headerShown: false }} />
            <Stack.Screen name="installments" options={{ title: 'My Installments', headerShown: false }} />
            <Stack.Screen name="paymentHistory" options={{ title: 'Payment History', headerShown: false }} />
            <Stack.Screen name="adminDashboard" options={{ title: 'Manager Dashboard', headerShown: false }} />
            <Stack.Screen name="createInstallment" options={{ title: 'Create Installment', headerShown: false }} />
            <Stack.Screen name="installmentDetails" options={{ title: 'Installment Details', headerShown: false }} />
          </Stack>

          <StatusBar style="auto" />
          </View>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
