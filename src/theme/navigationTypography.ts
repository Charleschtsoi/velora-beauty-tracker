import { colors } from './colors';
import { fontFamily } from './fonts';
import { typography } from './typography';

export const stackHeaderTitleStyle = {
  ...typography.screenHeader,
  color: colors.textPrimary,
};

export const tabBarLabelStyle = {
  fontFamily: fontFamily.sans,
  fontSize: 11,
  fontWeight: '500' as const,
};

export const stackHeaderStyle = {
  backgroundColor: colors.background,
};
