import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { ArrowLeft, MapPin, Bell, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Location from "expo-location";
import { useContext } from 'react';
import SettingsContext from '../contecxt/settingContext';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const [location, setLocation] = useState('Fetching location...');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const {
    highAccuracy,
    setHighAccuracy,
    notificationsEnabled,
    setNotificationsEnabled,
    notificationFrequency,
    setNotificationFrequency
  } = useContext(SettingsContext);

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
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Location permission denied' });
          setLocation('Unknown Location');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({});
        const currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(currentCoords);

        const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
          params: { lat: currentCoords.lat, lon: currentCoords.lng, format: "json" },
          headers: { "User-Agent": "TheGrooveApp/1.0" }
        });

        const address = res.data.address;
        let locationName = "Unknown Location";
        if (address) {
          locationName = address.road
            ? `${address.road}, ${address.suburb || address.city || ""}`.trim()
            : address.suburb || address.city || "Unknown Location";
        }

        setLocation(locationName);
      } catch (err) {
        console.error("Failed to fetch location:", err);
        setLocation("Unknown Location");
      }
    })();
  }, []);
const { reloadSettings } = useContext(SettingsContext);

useEffect(() => {
  reloadSettings();
}, []);


  const updateSettings = async (newSettings: {
  highAccuracy?: boolean;
  notificationsEnabled?: boolean;
  notificationFrequency?: 'all' | 'groove' | 'important' | 'owner';
}) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('token');
    if (!userId || !token) return;

    await axios.patch(
      `http://192.168.18.29:3000/api/updateSettings/${userId}`,
      newSettings,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Toast.show({ type: 'success', text1: 'Settings updated' });
  } catch (err) {
    console.log(err);
    Toast.show({ type: 'error', text1: 'Failed to update settings' });
  }
};

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
            <Text style={styles.sectionTitle}>  {location}</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text>High Accuracy Mode</Text>
              <Text style={styles.description}>Use GPS for precise location tracking</Text>
            </View>
            <Switch
              value={highAccuracy}
              onValueChange={async (value) => {
                setHighAccuracy(value);
                await updateSettings({ highAccuracy: value });
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
                await updateSettings({ notificationsEnabled: value });
              }}
            />


          </View>

          {notificationsEnabled && (
            <View style={{ marginTop: 12 }}>
              {(['all', 'groove','important', 'owner'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.freqButton,
                    notificationFrequency === freq && styles.freqButtonActive
                  ]}
                  onPress={async () => {
                    setNotificationFrequency(freq);
                    await updateSettings({ notificationFrequency: freq });
                  }}

                >
                 <Text style={styles.freqTitle}>
  {freq === 'all'
    ? 'All Notifications'
    : freq === 'important'
      ? 'Milestones Only'
      : freq === 'groove'
        ? 'Grooves Nearby'
        : 'Support Only'}
</Text>
<Text style={styles.description}>
  {freq === 'all'
    ? 'Receive all notifications'
    : freq === 'important'
      ? 'Only notify for milestones reached'
      : freq === 'groove'
        ? 'Get notified for every new groove nearby'
        : 'Only notifications when someone supports your groove'}
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