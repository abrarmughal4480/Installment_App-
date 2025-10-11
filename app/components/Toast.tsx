import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 4000,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Enhanced slide in animation from bottom with bounce
    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Subtle bounce effect
      Animated.spring(translateY, {
        toValue: -5,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    // Enhanced dismiss animation with scale and slide
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning' as const,
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: 'information-circle' as const,
          iconColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#6B7280',
          icon: 'information-circle' as const,
          iconColor: '#FFFFFF',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={dismissToast}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon}
            size={20}
            color={config.iconColor}
          />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={16}
            color={config.iconColor}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default Toast;
