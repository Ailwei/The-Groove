import React from 'react';
import { ArrowLeft, MapPin, Settings } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GrooveTag } from '..';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface ProfileScreenProps {
  grooveTags: GrooveTag[];
  onBack: () => void;
  onNavigateToSettings: () => void;
}

interface ProfileData {
  username: string;
  memberSince: string;
  email: string;
  totalTags: number;
  thisWeek: number;
  hotSpots: number;
}

export function ProfileScreen({ grooveTags, onBack, onNavigateToSettings }: ProfileScreenProps) {
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const userTags = grooveTags.slice(0, 2);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("http://192.168.18.29:3000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setProfile({
          username: data.username,
          memberSince: new Date(data.memberSince).toLocaleDateString(),
          email: data.email,
          totalTags: data.totalTags,
          thisWeek: data.thisWeek,
          hotSpots: data.hotSpots,
        });
      } catch (err) {
        console.log("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
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
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack}>
            <ArrowLeft width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity onPress={onNavigateToSettings}>
          <Settings width={24} height={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.username?.slice(0, 2).toUpperCase() || '--'}</Text>
        </View>
        <View>
          <Text style={styles.username}>{profile?.username || 'Loading...'}</Text>
          <Text style={styles.memberSince}>
            Member since {profile?.memberSince || "Loading..."}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Tags</Text>
          <Text>{profile?.totalTags ?? '...'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text>{profile?.thisWeek ?? '...'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hot Spots</Text>
          <Text>{profile?.hotSpots ?? '...'}</Text>
        </View>
      </View>

      <ScrollView style={styles.tagsContainer}>
        <Text style={styles.sectionTitle}>Your Recent Grooves</Text>
        {userTags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin width={48} height={48} color="#999" />
            <Text>No grooves tagged yet</Text>
            <Text style={styles.emptyText}>Start tagging spots to see them here</Text>
          </View>
        ) : (
          userTags.map((tag) => (
            <View key={tag.id} style={styles.tagCard}>
              <View style={styles.tagHeader}>
                <View style={styles.tagHeaderLeft}>
                  <View style={[styles.vibeDot, { backgroundColor: getVibeColor(tag.vibe) }]} />
                  <Text>{getVibeLabel(tag.vibe)}</Text>
                </View>
                <Text style={styles.tagTime}>{getTimeAgo(tag.taggedAt)}</Text>
              </View>
              <Text style={styles.tagLocation}>{tag.location}</Text>
              {tag.message && <Text style={styles.tagMessage}>"{tag.message}"</Text>}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  profileInfo: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', alignItems: 'center', gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  username: { fontSize: 18, fontWeight: 'bold' },
  memberSince: { color: '#6b7280' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  statBox: { alignItems: 'center' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  tagsContainer: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyText: { color: '#6b7280', fontSize: 12 },
  tagCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tagHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tagHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vibeDot: { width: 8, height: 8, borderRadius: 4 },
  tagTime: { fontSize: 12, color: '#6b7280' },
  tagLocation: { color: '#6b7280', marginBottom: 4 },
  tagMessage: { fontStyle: 'italic', color: '#4b5563', backgroundColor: '#e5e7eb', padding: 4, borderRadius: 4 },
});

export default ProfileScreen;
