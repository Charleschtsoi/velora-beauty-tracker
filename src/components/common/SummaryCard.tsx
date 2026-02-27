import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Optional background tint for the icon panel (e.g. statusExpiringSoonBg). Makes the icon area more representative. */
  iconBackgroundColor?: string;
  /** Optional representative image. When set and loaded, shown instead of icon; icon is fallback. */
  image?: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
}

export default function SummaryCard({ title, count, icon, color, iconBackgroundColor, image, onPress, testID }: SummaryCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const showImage = Boolean(image && !imageError);
  const bgColor = iconBackgroundColor ?? colors.primaryTint;

  const CardContent = (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, styles.imageContainer, { backgroundColor: bgColor }]}>
        {showImage ? (
          <Image
            source={image}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name={icon} size={32} color={color} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View testID={testID}>{CardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 4,
    ...shadow.cardRaised,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  imageContainer: {
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
});
