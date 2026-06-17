import type { ImageSourcePropType } from 'react-native';

/**
 * Optional representative images for the home summary cards.
 * Add PNGs to this folder (e.g. expiring-soon.png, expired.png, in-collection.png) and use:
 *   expiring_soon: require('./expiring-soon.png'),
 *   expired: require('./expired.png'),
 *   in_collection: require('./in-collection.png'),
 * Then pass image={summaryCardImages.expiring_soon} etc. to SummaryCard.
 * Until then, cards use icon + iconBackgroundColor for a visible visual.
 */
export const summaryCardImages: Record<'expiring_soon' | 'expired' | 'in_collection', ImageSourcePropType | null> = {
  expiring_soon: require('./expiring-soon.png'),
  expired: require('./expired.png'),
  in_collection: require('./in-collection.png'),
};

export const emptyStateImages = {
  noProductsYet: require('./no-products-yet.png') as ImageSourcePropType,
};
