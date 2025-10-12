import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavBarProps {
  colors: any;
  currentView: 'installments' | 'managers' | 'investors' | 'loans' | 'admins';
  onViewChange: (view: 'installments' | 'managers' | 'investors' | 'loans' | 'admins') => void;
  user?: any;
}

export default function BottomNavBar({ colors, currentView, onViewChange, user }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  // Listen for screen dimension changes (navigation bar hide/show)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // Calculate dynamic bottom position - no gap
  const bottomPosition = 0;
  
  // Check if current user is the specific admin who can add admins
  const canAddAdmin = user?.type === 'admin' && user?.email === 'installmentadmin@app.com';

  const tabs = [
    {
      id: 'installments' as const,
      label: 'Installments',
      icon: 'receipt-outline',
      activeIcon: 'receipt',
    },
    // Only show Admins tab for specific admin
    ...(canAddAdmin ? [{
      id: 'admins' as const,
      label: 'Admins',
      icon: 'shield-outline',
      activeIcon: 'shield',
    }] : []),
    {
      id: 'managers' as const,
      label: 'Managers',
      icon: 'people-outline',
      activeIcon: 'people',
    },
    {
      id: 'investors' as const,
      label: 'Investors',
      icon: 'trending-up-outline',
      activeIcon: 'trending-up',
    },
    {
      id: 'loans' as const,
      label: 'Loans',
      icon: 'wallet-outline',
      activeIcon: 'wallet',
    },
  ];

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.cardBackground,
        bottom: bottomPosition,
        paddingBottom: insets.bottom
      }
    ]}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onViewChange(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isActive && { backgroundColor: colors.primary }
              ]}>
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? '#FFFFFF' : colors.lightText}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.lightText }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginHorizontal: 1,
    minHeight: 50,
  },
  iconContainer: {
    width: 40,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    minWidth: 40,
    minHeight: 24,
    overflow: 'hidden',
   },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
