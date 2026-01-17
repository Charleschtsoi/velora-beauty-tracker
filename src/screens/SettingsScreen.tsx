import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
  testID?: string;
}

function SettingsItem({
  icon,
  iconColor = '#6b7280',
  title,
  subtitle,
  onPress,
  rightComponent,
  showArrow = true,
  testID,
}: SettingsItemProps) {
  const content = (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.itemRight}>{rightComponent}</View>}
      {showArrow && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} testID={testID}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View testID={testID}>{content}</View>;
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [expiringSoonAlert, setExpiringSoonAlert] = useState(true);
  const [expiredAlert, setExpiredAlert] = useState(true);
  const [reminderTime, setReminderTime] = useState('9:00 AM');
  const [darkMode, setDarkMode] = useState(false);

  // Mock user data (in real app, get from auth context)
  const userEmail = 'user@example.com';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual logout
            // Clear auth tokens, reset navigation to Auth screen
            Alert.alert('Logged Out', 'You have been logged out successfully.', [
              {
                text: 'OK',
                onPress: () => {
                  // navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                  // Navigate to Auth screen (if auth was implemented)
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const handleReminderTimePress = () => {
    // TODO: Open time picker
    Alert.alert('Reminder Time', 'Time picker will be implemented here');
  };

  const handleSupportPress = () => {
    Linking.openURL('mailto:support@hermes.app?subject=Hermes App Support');
  };

  const handlePrivacyPress = () => {
    // TODO: Navigate to privacy policy or open URL
    Alert.alert('Privacy Policy', 'Privacy policy will be shown here');
  };

  const handleTermsPress = () => {
    // TODO: Navigate to terms of service or open URL
    Alert.alert('Terms of Service', 'Terms of service will be shown here');
  };

  const appVersion = Constants?.expoConfig?.version || Constants?.manifest?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SettingsSection title="Account">
          <SettingsItem
            icon="person-circle"
            iconColor="#10b981"
            title="Email"
            subtitle={userEmail}
            showArrow={false}
            testID="user-email-item"
          />
          <SettingsItem
            icon="log-out"
            iconColor="#ef4444"
            title="Logout"
            onPress={handleLogout}
            showArrow={false}
            testID="logout-button"
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <SettingsItem
            icon="notifications"
            iconColor="#10b981"
            title="Push Notifications"
            subtitle="Receive alerts for expiring products"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
                testID="notifications-toggle"
              />
            }
            showArrow={false}
          />
          
          {notificationsEnabled && (
            <>
              <SettingsItem
                icon="warning"
                iconColor="#f97316"
                title="Expiring Soon Alerts"
                subtitle="Get notified when products expire in 1-3 days"
                rightComponent={
                  <Switch
                    value={expiringSoonAlert}
                    onValueChange={setExpiringSoonAlert}
                    trackColor={{ false: '#d1d5db', true: '#f97316' }}
                    thumbColor="#ffffff"
                    testID="expiring-soon-toggle"
                  />
                }
                showArrow={false}
              />
              <SettingsItem
                icon="alert-circle"
                iconColor="#ef4444"
                title="Expired Alerts"
                subtitle="Get notified when products expire"
                rightComponent={
                  <Switch
                    value={expiredAlert}
                    onValueChange={setExpiredAlert}
                    trackColor={{ false: '#d1d5db', true: '#ef4444' }}
                    thumbColor="#ffffff"
                    testID="expired-alert-toggle"
                  />
                }
                showArrow={false}
              />
              <SettingsItem
                icon="time"
                iconColor="#6b7280"
                title="Reminder Time"
                subtitle={reminderTime}
                onPress={handleReminderTimePress}
                testID="reminder-time-item"
              />
            </>
          )}
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance">
          <SettingsItem
            icon="moon"
            iconColor="#6b7280"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
                testID="dark-mode-toggle"
              />
            }
            showArrow={false}
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="About">
          <SettingsItem
            icon="information-circle"
            iconColor="#6b7280"
            title="App Version"
            subtitle={`Version ${appVersion}`}
            showArrow={false}
            testID="app-version-item"
          />
          <SettingsItem
            icon="mail"
            iconColor="#10b981"
            title="Support"
            subtitle="Get help and contact us"
            onPress={handleSupportPress}
            testID="support-item"
          />
          <SettingsItem
            icon="document-text"
            iconColor="#6b7280"
            title="Privacy Policy"
            onPress={handlePrivacyPress}
            testID="privacy-policy-item"
          />
          <SettingsItem
            icon="document"
            iconColor="#6b7280"
            title="Terms of Service"
            onPress={handleTermsPress}
            testID="terms-item"
          />
        </SettingsSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Hermes</Text>
          <Text style={styles.footerSubtext}>Beauty Product Expiration Tracker</Text>
          <Text style={styles.footerVersion}>Version {appVersion}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemRight: {
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
