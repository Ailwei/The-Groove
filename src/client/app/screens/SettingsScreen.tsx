import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { ArrowLeft, MapPin, Bell, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const [locationAccuracy, setLocationAccuracy] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState<'all' | 'important' | 'off'>('all');

  const handleDeleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        return Alert.alert(
          'Delete Account',
          'Login expired. Please login again.',
          [{ text: 'OK', onPress: onLogout }]
        );
      }

      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK',
            onPress: async () => {
              try {
                await axios.delete(
                  `http://192.168.18.29:3000/api/user/deleteAccount/${userId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('userId');

                Alert.alert(
                  'Account Deleted',
                  'Your account has been deleted successfully.',
                  [{ text: 'OK', onPress: onLogout }]
                );
              } catch (err) {
                console.log(err);
                Alert.alert('Error', 'Failed to delete account. Try again.');
              }
            }
          }
        ]
      );
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
  };
  useEffect(() => {
    const loadAccuracy = async () => {
      const saved = await AsyncStorage.getItem('highAccuracy');
      if (saved !== null) setLocationAccuracy(saved === 'true');
    };
    loadAccuracy();
  }, []);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      const notif = await AsyncStorage.getItem('notificationsEnabled');
      const freq = await AsyncStorage.getItem('notificationFrequency');
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      if (freq) setNotificationFrequency(freq as 'all' | 'important' | 'off');
    };
    loadNotificationSettings();
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin width={16} height={16} color="#6b7280" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text>High Accuracy Mode</Text>
              <Text style={styles.description}>Use GPS for precise location tracking</Text>
            </View>
            <Switch
              value={locationAccuracy}
              onValueChange={async (value) => {
                setLocationAccuracy(value);
                await AsyncStorage.setItem('highAccuracy', value ? 'true' : 'false');
              }}

            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell width={16} height={16} color="#6b7280" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text>Enable Notifications</Text>
              <Text style={styles.description}>Get alerts about nearby grooves</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                setNotificationsEnabled(value);
                await AsyncStorage.setItem('notificationsEnabled', value ? 'true' : 'false');
              }}

            />
          </View>

          {notificationsEnabled && (
            <View style={{ marginTop: 12 }}>
              {(['all', 'important', 'off'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.freqButton,
                    notificationFrequency === freq && styles.freqButtonActive
                  ]}
                  onPress={async () => {
                    setNotificationFrequency(freq);
                    await AsyncStorage.setItem('notificationFrequency', freq);
                  }}
                >
                  <Text style={styles.freqTitle}>
                    {freq === 'all' ? 'All Grooves' : freq === 'important' ? 'Important Only' : 'Minimal'}
                  </Text>
                  <Text style={styles.description}>
                    {freq === 'all'
                      ? 'Get notified for every new groove nearby'
                      : freq === 'important'
                        ? 'Only notify for very busy spots'
                        : 'Only critical notifications'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Trash2 width={16} height={16} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#8b5cf6', marginTop: 8 }]}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: onLogout },
                ]
              );
            }}
          >
            <Text style={styles.deleteButtonText}>Logout</Text>
          </TouchableOpacity>

        </View>

        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={styles.description}>THE GROOOOOVE v1.0.0</Text>
          <Text style={[styles.description, { marginTop: 4 }]}>Find the hottest spots near you</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  scroll: { flex: 1 },
  section: { backgroundColor: '#fff', marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#e5e7eb', marginBottom: 4 },
  sectionTitle: { marginLeft: 8, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  description: { fontSize: 12, color: '#6b7280' },
  freqButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 8 },
  freqButtonActive: { borderColor: '#8b5cf6', backgroundColor: '#f3e8ff' },
  freqTitle: { fontWeight: 'bold', marginBottom: 4 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', padding: 12, borderRadius: 8, margin: 12 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
export default SettingsScreen