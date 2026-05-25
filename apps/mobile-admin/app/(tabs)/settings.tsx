import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '@/store/adminStore';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, iconColor = '#6366f1', iconBg = '#eef2ff', label, value, onPress, rightElement, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} disabled={!onPress && !rightElement}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { admin, logout } = useAdminStore();
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyChats, setNotifyChats] = useState(true);
  const [notifyCalls, setNotifyCalls] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Admin Profile */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(admin?.name || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{admin?.name || 'Admin'}</Text>
            <Text style={styles.profileEmail}>{admin?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{admin?.role || 'admin'}</Text>
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <SettingRow
              icon="bag-outline"
              iconColor="#6366f1"
              iconBg="#eef2ff"
              label="New Orders"
              rightElement={
                <Switch
                  value={notifyOrders}
                  onValueChange={setNotifyOrders}
                  trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubbles-outline"
              iconColor="#2563eb"
              iconBg="#dbeafe"
              label="New Chat Messages"
              rightElement={
                <Switch
                  value={notifyChats}
                  onValueChange={setNotifyChats}
                  trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="call-outline"
              iconColor="#16a34a"
              iconBg="#dcfce7"
              label="Incoming Calls"
              rightElement={
                <Switch
                  value={notifyCalls}
                  onValueChange={setNotifyCalls}
                  trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <SettingRow
              icon="storefront-outline"
              label="Store Settings"
              onPress={() => Alert.alert('Info', 'Configure store settings on the web dashboard.')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="card-outline"
              iconColor="#d97706"
              iconBg="#fef3c7"
              label="Payment Settings"
              onPress={() => Alert.alert('Info', 'Configure payments on the web dashboard.')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="help-circle-outline"
              iconColor="#64748b"
              iconBg="#f1f5f9"
              label="Help & Support"
              onPress={() => Alert.alert('Support', 'Contact support@retailhub.com')}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <SettingRow
              icon="information-circle-outline"
              iconColor="#64748b"
              iconBg="#f1f5f9"
              label="Version"
              value="1.0.0"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="shield-checkmark-outline"
              iconColor="#16a34a"
              iconBg="#dcfce7"
              label="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Privacy policy would open here.')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow
              icon="log-out-outline"
              iconColor="#dc2626"
              iconBg="#fee2e2"
              label="Sign Out"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <Text style={styles.footer}>RetailHub Admin v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 20, paddingTop: 8 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  profileEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: {
    marginTop: 6,
    backgroundColor: '#eef2ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, color: '#6366f1', fontWeight: '600', textTransform: 'capitalize' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },
  rowLabelDanger: { color: '#dc2626' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: '#94a3b8' },
  divider: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 14 },
  footer: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 8 },
});
