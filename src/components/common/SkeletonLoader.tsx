import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
  },
});

// Skeleton Card component
export const SkeletonCard = () => (
  <View style={skeletonCardStyles.container}>
    <SkeletonLoader width={80} height={80} borderRadius={12} />
    <View style={skeletonCardStyles.content}>
      <SkeletonLoader width="70%" height={16} style={skeletonCardStyles.title} />
      <SkeletonLoader width="50%" height={14} style={skeletonCardStyles.subtitle} />
      <SkeletonLoader width="60%" height={14} style={skeletonCardStyles.date} />
    </View>
  </View>
);

const skeletonCardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 6,
  },
  date: {},
});
