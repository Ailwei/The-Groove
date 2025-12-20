import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import * as Location from "expo-location";
import { ArrowLeft, MapPin, MessageSquare } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GrooveTag } from '..';
import { useLocation } from '../contecxt/LocationContext';

interface TagGrooveScreenProps {
  onBack: () => void;
  onSubmit: (groove: Omit<GrooveTag, 'id' | 'taggedAt'>) => void;
}

const { width, height } = Dimensions.get("window");

export function TagGrooveScreen({ onBack, onSubmit }: TagGrooveScreenProps) {
  const { location: userLocation, loading: locationLoading, error: locationError } = useLocation();
  const [location, setLocation] = useState('Fetching location...');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vibe, setVibe] = useState<GrooveTag['vibe']>('busy');
  const [message, setMessage] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const vibeOptions: { value: GrooveTag['vibe']; label: string; color: string; emoji: string }[] = [
    { value: 'very-busy', label: 'Very Busy', color: '#ef4444', emoji: '🔥' },
    { value: 'busy', label: 'Busy', color: '#f97316', emoji: '🟠' },
    { value: 'mild', label: 'Mild', color: '#eab308', emoji: '🟡' },
    { value: 'quiet', label: 'Quiet', color: '#3b82f6', emoji: '🔵' },
  ];


  useEffect(() => {
    if (userLocation) {
      setCoords(userLocation);

      (async () => {
        try {
          const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
            params: {
              lat: userLocation.lat,
              lon: userLocation.lng,
              format: "json"
            },
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
          console.error("Failed to reverse geocode:", err);
          setLocation("Unknown Location");
        }
      })();
    } else if (locationError) {
      setLocation("Unknown Location");
      Toast.show({ type: 'error', text1: 'Location permission denied' });
    } else if (locationLoading) {
      setLocation('Fetching location...');
    }
  }, [userLocation, locationLoading, locationError]);

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      Toast.show({ type: "error", text1: "User not found" });
      return;
    }
    const now = new Date();

    const fixedStart = new Date(startTime);
    const fixedEnd = new Date(endTime);

    if (fixedEnd.getTime() <= fixedStart.getTime()) {
      fixedEnd.setDate(fixedEnd.getDate() + 1);
    }

    if (fixedEnd.getTime() <= now.getTime()) {
      Toast.show({ type: "error", text1: "End time must be in the future" });
      return;
    }

    if (!coords) {
      Toast.show({
        type: "error",
        text1: "Current location not available...wait for it to load"
      });
      return;
    }

    try {
      const submitCoords = coords;
      onSubmit({
        coordinates: submitCoords,
        vibe,
        message: message.trim() || undefined,
        location,
        startTime: fixedStart,
        endTime: fixedEnd,
        userId
      });
      const response = await axios.post(
        "http://192.168.18.29:3000/api/grooves/tag",
        {
          lat: submitCoords.lat,
          lng: submitCoords.lng,
          vibe,
          message: message.trim() || null,
          location,
          startTime: fixedStart.toISOString(),
          endTime: fixedEnd.toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      if (data?.existingGroove && data.totalSupports === null) {
        Toast.show({
          type: "info",
          text1: "You already own this groove",
          text2: "You cannot support your own groove",
        });
        return;
      }

      if (data?.existingGroove && data.totalSupports !== null) {
        Toast.show({
          type: "success",
          text1: "Support Added",
          text2: "A groove already exists here. You supported it instead.",
        });
        return;
      }

      if (response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Groove tagged successfully",
        });
        return;
      }

      if (data?.error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.error,
        });
        return;
      }

    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Failed to tag groove",
        text2: "Something went wrong.",
      });
    }
  };
  useEffect(() => {
    Toast.show({
      type: 'info',
      text1: '💡 Your tagged spot will appear on the map',
      position: 'top',
      visibilityTime: 5000,
      autoHide: true
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <ArrowLeft width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tag My Groove</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Location Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputWrapper}>
            <MapPin width={16} height={16} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
            />
          </View>
          <Text style={styles.description}>Auto-filled from your current location</Text>
        </View>

        {/* Vibe Selection */}
        <View style={styles.field}>
          <Text style={styles.label}>Select Vibe</Text>
          <View style={styles.vibeGrid}>
            {vibeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.vibeButton,
                  vibe === option.value && { borderColor: '#8b5cf6', backgroundColor: '#f3e8ff' },
                ]}
                onPress={() => setVibe(option.value)}
              >
                <View style={[styles.vibeCircle, { backgroundColor: option.color }]} />
                <View style={{ marginLeft: 8 }}>
                  <Text>{`${option.emoji} ${option.label}`}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Optional Message */}
        <View style={styles.field}>
          <Text style={styles.label}>Optional Message</Text>
          <View style={styles.inputWrapper}>
            <MessageSquare width={16} height={16} color="#6b7280" style={styles.inputIconTop} />
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={message}
              onChangeText={setMessage}
              placeholder="e.g., Shisanyama is pumping rn!"
              multiline
              maxLength={100}
            />
          </View>
          <Text style={[styles.description, { textAlign: 'right' }]}>{message.length}/100</Text>
        </View>

        {/* Start/End Time */}
        <View style={styles.field}>
          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              onChange={(event, selected) => {
                setShowStartPicker(false);
                if (selected) setStartTime(selected);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              minimumDate={new Date()}
              onChange={(event, selected) => {
                setShowEndPicker(false);
                if (selected) setEndTime(selected);
              }}
            />
          )}

          <Text style={styles.label}>Start Time</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
            <Text>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>End Time</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
            <Text>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, { marginBottom: insets.bottom + 5 }]}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Drop The Groove</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  form: { flex: 1, padding: 16 },
  field: { marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 12, color: '#6b7280' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 8, top: '50%', marginTop: -8 },
  inputIconTop: { position: 'absolute', left: 8, top: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingLeft: 32, paddingVertical: 8 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibeButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 8 },
  vibeCircle: { width: 24, height: 24, borderRadius: 12 },
  submitButton: { position: 'absolute', bottom: 5, left: 16, right: 16, backgroundColor: '#8b5cf6', padding: 16, alignItems: 'center', borderRadius: 20 },
  timeButton: { padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fff' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default TagGrooveScreen;
