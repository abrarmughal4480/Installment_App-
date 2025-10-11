import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Temporarily commented out to fix build issues
// import 'react-native-reanimated';

import { useColorScheme } from '../hooks/use-color-scheme';
import { ToastProvider } from '../contexts/ToastContext';

import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import TokenService from '../services/tokenService';
import { apiService } from '../services/apiService';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [appReady, setAppReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Update screen dimensions when navigation bar visibility changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Calculate available height dynamically
  const availableHeight = screenData.height - insets.top - insets.bottom;

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
              
              // Load role-specific data
              await loadRoleSpecificData(response.user.type);
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
        setDataLoaded(true);
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setIsRedirecting(true);
        }, 100);
      }
    };
    prepare();
  }, []);

  const loadRoleSpecificData = async (userType: string) => {
    try {
      if (userType === 'investor') {
        // Load investor dashboard data
        await apiService.getInvestorDashboard();
      } else if (userType === 'admin' || userType === 'manager') {
        // Load admin/manager dashboard data
        await apiService.getInstallments('', true);
      }
    } catch (error) {
      console.log('Error loading role-specific data:', error);
      // Continue anyway - don't block the app
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appReady && isRedirecting && dataLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appReady, isRedirecting, dataLoaded]);

  if (!appReady || !isRedirecting || !dataLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <View style={{ flex: 1, height: availableHeight }} onLayout={onLayoutRootView}>

          {isLoggedIn ? (
            userType === 'admin' ? <Redirect href="/adminDashboard" /> : 
            userType === 'manager' ? <Redirect href="/adminDashboard" /> :
            userType === 'investor' ? <Redirect href="/investorDashboard" /> :
            <Redirect href="/installments" />
          ) : <Redirect href="/" />}

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Landing Page', headerShown: false }} />
            <Stack.Screen name="installments" options={{ title: 'My Installments', headerShown: false }} />
            <Stack.Screen name="paymentHistory" options={{ title: 'Payment History', headerShown: false }} />
            <Stack.Screen name="adminDashboard" options={{ title: 'Admin Dashboard', headerShown: false }} />
            <Stack.Screen name="investorDashboard" options={{ title: 'Investor Dashboard', headerShown: false }} />
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
