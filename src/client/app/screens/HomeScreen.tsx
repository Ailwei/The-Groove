import { useState, useEffect ,  useRef} from 'react';
import { Plus, Filter, Menu } from 'lucide-react-native';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GrooveTag } from '..';
import { GrooveDetailsPopup } from './GrooveDetailsPopup';
import Toast from 'react-native-toast-message';
import { Provider, Menu as PaperMenu } from 'react-native-paper';
import { SafeAreaView ,  useSafeAreaInsets} from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface HomeScreenProps {
  grooveTags: GrooveTag[];
  onNavigateToTag: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  selectedGroove: GrooveTag | null;
  onSelectGroove: (groove: GrooveTag | null) => void;
}

type FilterType = 'popular' | 'nearest' | 'new';
const { width, height } = Dimensions.get('window');

export function HomeScreen({
  grooveTags,
  onNavigateToTag,
  onNavigateToProfile,
  onNavigateToSettings,
  selectedGroove,
  onSelectGroove,
}: HomeScreenProps) {
  const mapRef = useRef<MapView | null>(null);

  const [filter, setFilter] = useState<FilterType>('new');
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userFocused, setUserFocused] = useState(false);
const [isMapReady, setIsMapReady] = useState(false);



   useEffect(() => {
  (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn("Location permission denied");
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.45,
        longitudeDelta: 0.45,
      });
    } catch (err) {
      console.warn("Error fetching location", err);
    } finally {
      setIsLocationLoading(false);
    }
  })();
}, []);


const getSortedGrooves = () => {
   const now = new Date();
  const active = grooveTags.filter(tag => 
    now >= tag.startTime && now <= tag.endTime
  )
    switch (filter) {
      case 'popular':
        return active.sort((a, b) => {
          const vibeOrder = { 'very-busy': 0, 'busy': 1, 'mild': 2, 'quiet': 3 };
          return vibeOrder[a.vibe] - vibeOrder[b.vibe];
        });
      case 'nearest':
        return active;
      case 'new':
        return active.sort((a, b) => b.taggedAt.getTime() - a.taggedAt.getTime());
      default:
        return active;
    }
  };
const sortedGrooves = getSortedGrooves();

  useEffect(() => {
    if (!hasShownNotification) {
      const veryBusySpots = grooveTags.filter(tag => tag.vibe === 'very-busy');
      if (veryBusySpots.length > 0) {
        setTimeout(() => {
          Toast.show({
            type: 'info',
            text1: '🔥 A groove near you is heating up!',
            text2: veryBusySpots[0].location,
            position: 'top'
          });
          setHasShownNotification(true);
        }, 1000);
      }
    }
  }, [grooveTags, hasShownNotification]);

  const getVibeColor = (vibe: GrooveTag['vibe']) => {
    switch (vibe) {
      case 'very-busy': return '#ef4444';
      case 'busy': return '#f97316';
      case 'mild': return '#eab308';
      case 'quiet': return '#3b82f6';
    }
  };

  const insets = useSafeAreaInsets();
const FilterAnchor = (
  <TouchableOpacity onPress={() => setFilterMenuVisible(prev => !prev)} style={{ padding: 8 }}>
    <Filter size={24} color="black" />
  </TouchableOpacity>
);

const ProfileAnchor = (
  <TouchableOpacity onPress={() => setProfileMenuVisible(prev => !prev)} style={{ padding: 8, marginLeft: 12 }}>
    <Menu size={24} color="black" />
  </TouchableOpacity>
);

  return (
    <Provider>
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>THE GROOOOOVE</Text>
          <View style={styles.headerButtons}>
            <View style={{ flexDirection: 'row' }}>
  <PaperMenu
    visible={filterMenuVisible}
    onDismiss={() => setFilterMenuVisible(false)}
    anchor={FilterAnchor}
  >
    <PaperMenu.Item onPress={() => { setFilter('popular'); setFilterMenuVisible(false); }} title="Popular" />
    <PaperMenu.Item onPress={() => { setFilter('nearest'); setFilterMenuVisible(false); }} title="Nearest" />
    <PaperMenu.Item onPress={() => { setFilter('new'); setFilterMenuVisible(false); }} title="New" />
  </PaperMenu>
  <PaperMenu
    visible={profileMenuVisible}
    onDismiss={() => setProfileMenuVisible(false)}
     anchor={ProfileAnchor}
  >
    <PaperMenu.Item onPress={onNavigateToProfile} title="Profile" />
    <PaperMenu.Item onPress={onNavigateToSettings} title="Settings" />
  </PaperMenu>
</View>

          </View>
        </View>
        <View style={styles.legend} pointerEvents="none">
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Very Busy</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
            <Text style={styles.legendText}>Busy</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
            <Text style={styles.legendText}>Mild</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Quiet</Text>
          </View>
        </View>
 {userLocation && (
  <>
    <MapView
      ref={mapRef}
      style={styles.mapArea}
      showsUserLocation={true}
      showsMyLocationButton={true}
      initialRegion={{
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onMapReady={() => setIsMapReady(true)}
    >

    {sortedGrooves.map(tag => (
      <Marker
        key={tag.id}
        coordinate={{
          latitude: tag.coordinates.lat,
          longitude: tag.coordinates.lng,
        }}
        title={tag.location || 'Groove'}
        description={tag.message}
        pinColor={getVibeColor(tag.vibe)}
        onPress={() => onSelectGroove(tag)}
      />
    ))}
  </MapView>

  {(!isMapReady || isLocationLoading) && (
  <View style={styles.mapLoadingOverlay}>
    <Text style={styles.loadingText}>Loading map…</Text>
  </View>
)}


        <TouchableOpacity  style={[
        styles.tagButton,
        { bottom: 5 + insets.bottom }
      ]}  onPress={onNavigateToTag}>
          <Plus size={16} color="#fff" />
          <Text style={styles.tagButtonText}>Tag My Groove</Text>
        </TouchableOpacity>
        {selectedGroove && (
          <GrooveDetailsPopup groove={selectedGroove} onClose={() => onSelectGroove(null)}   userLocation={userLocation} />
        )}

        <Toast />
  </>
)}
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.7)',
  zIndex: 100,
},

  title: { fontSize: 20, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', gap: 12 },

  mapArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  tagButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 24,
    zIndex: 50,
  },

  tagButtonText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },

  legend: {
    position: 'absolute',
    top: 120,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 20,
  },
  mapLoadingOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(255,255,255,0.9)",
  zIndex: 200,
},

loadingText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#555",
},


  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },

  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },

  legendText: { fontSize: 12, color: '#333' },
});

export default HomeScreen;
