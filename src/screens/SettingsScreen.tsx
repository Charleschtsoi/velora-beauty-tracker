import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as settingsStorage from '../services/settingsStorage';

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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [expiringSoonAlert, setExpiringSoonAlert] = useState(true);
  const [expiredAlert, setExpiredAlert] = useState(true);
  const [reminderTime, setReminderTime] = useState('9:00 AM');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempTime, setTempTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });

  const userEmail = 'user@example.com';

  useEffect(() => {
    (async () => {
      const [notif, soon, expired] = await Promise.all([
        settingsStorage.getNotificationsEnabled(),
        settingsStorage.getExpiringSoonAlert(),
        settingsStorage.getExpiredAlert(),
      ]);
      setNotificationsEnabled(notif);
      setExpiringSoonAlert(soon);
      setExpiredAlert(expired);
      const { hour, minute } = await settingsStorage.getReminderTime();
      setReminderTime(settingsStorage.formatReminderTime(hour, minute));
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      setTempTime(d);
    })();
  }, []);

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
    setTempTime((prev) => {
      const parsed = settingsStorage.parseReminderTimeDisplay(reminderTime);
      const d = new Date();
      d.setHours(parsed.hour, parsed.minute, 0, 0);
      return d;
    });
    setTimePickerVisible(true);
  };

  const handleTimePickerChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setTimePickerVisible(false);
      if (selectedDate) {
        const hour = selectedDate.getHours();
        const minute = selectedDate.getMinutes();
        settingsStorage.setReminderTime(hour, minute);
        setReminderTime(settingsStorage.formatReminderTime(hour, minute));
      }
    } else if (selectedDate) {
      setTempTime(selectedDate);
    }
  };

  const handleTimePickerConfirm = () => {
    const hour = tempTime.getHours();
    const minute = tempTime.getMinutes();
    settingsStorage.setReminderTime(hour, minute);
    setReminderTime(settingsStorage.formatReminderTime(hour, minute));
    setTimePickerVisible(false);
  };

  const handleSupportPress = () => {
    Linking.openURL('mailto:charleschtsoi@gmail.com?subject=Velora App Support');
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
            title="Reminder notifications"
            subtitle="Get reminder notifications when products are about to expire"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => {
                  setNotificationsEnabled(v);
                  settingsStorage.setNotificationsEnabled(v);
                }}
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
                title="Expiring soon reminders"
                subtitle="Remind me when products expire in 1–3 days"
                rightComponent={
                  <Switch
                    value={expiringSoonAlert}
                    onValueChange={(v) => {
                      setExpiringSoonAlert(v);
                      settingsStorage.setExpiringSoonAlert(v);
                    }}
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
                    onValueChange={(v) => {
                      setExpiredAlert(v);
                      settingsStorage.setExpiredAlert(v);
                    }}
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
          <Text style={styles.footerText}>Velora</Text>
          <Text style={styles.footerSubtext}>Beauty Product Expiration Tracker</Text>
          <Text style={styles.footerVersion}>Version {appVersion}</Text>
        </View>
      </ScrollView>

      {/* Reminder time picker */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={timePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTimePickerVisible(false)}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setTimePickerVisible(false)} style={styles.timePickerButton}>
                  <Text style={styles.timePickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>Reminder time</Text>
                <TouchableOpacity onPress={handleTimePickerConfirm} style={styles.timePickerButton}>
                  <Text style={[styles.timePickerButtonText, styles.timePickerButtonConfirm]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleTimePickerChange}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      ) : (
        timePickerVisible && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={handleTimePickerChange}
          />
        )
      )}
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
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  timePickerButtonConfirm: {
    color: '#10b981',
    fontWeight: '600',
  },
});
