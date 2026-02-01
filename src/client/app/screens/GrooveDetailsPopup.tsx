import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { Navigation, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GrooveTag } from '..';
import ReportModal from '../componet/reportModal';

interface GrooveDetailsPopupProps {
  groove: GrooveTag;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onSupport?: (id: string) => void;
  onJoinChat?: (groove: GrooveTag) => void;
}

export function GrooveDetailsPopup({ groove, onClose, userLocation,   onJoinChat, }: GrooveDetailsPopupProps) {
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ userId: string } | null>(null);
  const [supported, setSupported] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(false);
const [joining, setJoining] = useState(false);


  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      try {

        const decoded: any = jwtDecode(token);
        setCurrentUser({ userId: decoded.userId });
        if (groove.supporters?.some((s: any) => s.userId === decoded.userId)) {
          setSupported(true);
        }
      } catch (e) {
        console.log("Failed to decode token", e);
      }
    };

    loadUser();
  }, []);
const getVibeColor = (vibe: GrooveTag['vibe']) => {

    switch (vibe) {
      case 'very-busy': return '#ef4444';
      case 'busy': return '#f97316';
      case 'mild': return '#eab308';
      case 'quiet': return '#3b82f6';
    }
  };
  const getVibeLabel = (vibe: GrooveTag['vibe']) => {
    switch (vibe) {
      case 'very-busy': return '🔥 Very Busy';
      case 'busy': return '🟠 Busy';
      case 'mild': return '🟡 Mild';
      case 'quiet': return '🔵 Quiet';
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getDistance = () => {
    if (!userLocation) return "Unknown";

    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371;
    const dLat = toRad(groove.coordinates.lat - userLocation.lat);
    const dLng = toRad(groove.coordinates.lng - userLocation.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.lat)) *
      Math.cos(toRad(groove.coordinates.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return `${distance.toFixed(1)} km`;
  };
  const handleNavigate = () => {
    if (!userLocation) return;

    const startLat = userLocation.lat;
    const startLng = userLocation.lng;
    const destLat = groove.coordinates.lat;
    const destLng = groove.coordinates.lng;

    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=driving`
    );
  };
 const handleJoinChat = async () => {
  if (!currentUser?.userId || !groove?.id || !groove.chatId) return;

  setJoining(true);

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const res = await axios.post(
      "http://192.168.18.29:3000/api/chat/joinChat",
      { grooveId: groove.id, chatId: groove.chatId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.alreadyJoined) {
      Toast.show({
        type: "success",
        text1: "Welcome back 👋",
      });
    }
    onJoinChat?.(groove);

  } catch (err: any) {
    Toast.show({
      type: "error",
      text1: "Failed to join chat",
      text2: err.response?.data?.error || "Something went wrong",
    });
  } finally {
    setJoining(false);
  }
};

  const handleSupport = async () => {

  if (!userLocation) {
    Toast.show({
      type: 'error',
      text1: 'Location required',
      text2: 'Cannot support groove without your current location',
    });
    return;
  }
  if (supported || loadingSupport) {
      Toast.show({ type: 'info', text1: 'Already supported' });
      return;
    }
    setSupported(true);
    setLoadingSupport(true);

  try {
     const token = await AsyncStorage.getItem('token');
     if (!token) return;

    const res = await axios.post(
      'http://192.168.18.29:3000/api/groove/support',
      {
        grooveId: groove.id,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { action, message, totalSupports } = res.data;

    setTimeout(() => {
      Toast.show({
        type: action === "SUPPORTED_NEW" ? "success" : "info",
        text1: message || (action === "SUPPORTED_NEW" ? "Groove supported!" : "You already support this groove"),
        text2: totalSupports ? `Total supports: ${totalSupports}` : undefined,
      });
    }, 0);

  } catch (err: any) {
    setSupported(false);
    const errorMessage = err.response?.data?.error || err.message || 'Something went wrong';
    setTimeout(() => {
      Toast.show({
        type: 'error',
        text1: 'Support failed',
        text2: errorMessage,
      });
    }, 0);
  }
};

  const handleReportSubmit = async (reason: string) => {
  if (!reason) return;

  const token = await AsyncStorage.getItem('token');
  if (!token) {
    Toast.show({ type: 'error', text1: 'You must be logged in to report' });
    return;
  }

  if (!groove?.id) {
    
    Toast.show({ type: 'error', text1: 'Invalid groove' });
    return;
  }

  try {
    const res = await axios.post(
      'http://192.168.18.29:3000/api/groove/report',
      { grooveId: groove.id, reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
console.log("handleJoinChat clicked", groove?.id, currentUser?.userId);

    Toast.show({
      type: 'success',
      text1: res?.data?.message || 'Report submitted successfully',
    });
  } catch (err: any) {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    Toast.show({
      type: 'error',
      text1: 'Failed to submit report',
      text2: message,
    });
  } finally {
    setReportModalVisible(false);
  }
};


  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.popup}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X width={24} height={24} />
        </TouchableOpacity>

        <View style={{ gap: 16 }}>
          <View>
            <View style={styles.vibeRow}>
              <View style={[styles.vibeCircle, { backgroundColor: getVibeColor(groove.vibe) }]} />
              <Text style={styles.vibeLabel}>{getVibeLabel(groove.vibe)}</Text>
            </View>
            <Text style={styles.location}>{groove.location}</Text>
          </View>

          {groove.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>"{groove.message}"</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>Tagged</Text>
              <Text>{getTimeAgo(groove.taggedAt)}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text>{getDistance()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <Navigation width={20} height={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.navigateText}>Navigate</Text>

          </TouchableOpacity>
        </View>
        {currentUser && currentUser.userId && groove && groove.userId && currentUser.userId !== groove.userId && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: '#5cf69aff', flex: 1, marginRight: 8 }]}
            onPress={handleJoinChat}
            disabled={joining}
            >
             <Text>Join Chat</Text> 
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navigateButton, { backgroundColor: '#f65cacff', flex: 1, marginRight: 8 }]}
              onPress={handleSupport}
              disabled={supported || loadingSupport}
            >
              <Text style={styles.navigateText}> Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navigateButton, { backgroundColor: '#ef4444', flex: 1, marginLeft: 8 }]}
              onPress={() => setReportModalVisible(true)}
            >
              <Text style={styles.navigateText}> Report</Text>
            </TouchableOpacity>
          </View>
        )}
        <ReportModal
          visible={reportModalVisible}
          onSubmit={handleReportSubmit}
          onClose={() => setReportModalVisible(false)}
        />


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 50,
  },
  popup: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vibeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  vibeLabel: { fontWeight: 'bold' },
  location: { color: '#6b7280' },
  messageBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
  },
  messageText: { fontStyle: 'italic' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  infoLabel: { color: '#6b7280', fontSize: 12 },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  navigateText: { color: '#fff', fontWeight: 'bold' },
});
export default GrooveDetailsPopup