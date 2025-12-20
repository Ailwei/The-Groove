import * as Location from 'expo-location';
import { Menu, Plus } from 'lucide-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Menu as PaperMenu, Provider } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GrooveTag } from '..';
import { GrooveDetailsPopup } from './GrooveDetailsPopup';
import { useLocation } from '../contecxt/LocationContext';

interface HomeScreenProps {
  grooveTags: GrooveTag[];
  onNavigateToTag: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  selectedGroove: GrooveTag | null;
  onSelectGroove: (groove: GrooveTag | null) => void;
}

const { width, height } = Dimensions.get('window');

export function GrooveMapScreen({
  grooveTags,
  onNavigateToTag,
  onNavigateToProfile,
  onNavigateToSettings,
  selectedGroove,
  onSelectGroove,
}: HomeScreenProps) {
  const mapRef = useRef<MapView | null>(null);

  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const { location: userLocation, loading: locationLoading } = useLocation();
  const [isMapReady, setIsMapReady] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

 
  
   useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getSortedGrooves = () => {
    const now = new Date();
    return grooveTags.filter(tag => now >= tag.startTime && now <= tag.endTime);
  };
  const sortedGrooves = getSortedGrooves();

  const getVibeColor = (vibe: GrooveTag['vibe']) => {
    switch (vibe) {
      case 'very-busy': return '#ef4444';
      case 'busy': return '#f97316';
      case 'mild': return '#eab308';
      case 'quiet': return '#3b82f6';
    }
  };

  const insets = useSafeAreaInsets();

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
        {locationLoading || !userLocation ? (
          <View style={styles.initialLoader}>
            <Text style={styles.initialLoaderText}>Finding your location…</Text>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              style={styles.mapArea}
              showsUserLocation={true}
              showsMyLocationButton={true}
              initialRegion={{
                latitude: userLocation?.lat ?? 0,
                longitude: userLocation?.lng ?? 0,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onMapReady={() => setIsMapReady(true)}
            >
              {(sortedGrooves).map(tag => (
                <React.Fragment key={tag.id}>
                  <Marker
                    coordinate={{
                      latitude: tag.coordinates.lat,
                      longitude: tag.coordinates.lng,
                    }}
                    title={tag.location || 'Groove'}
                    description={tag.message}
                    pinColor={getVibeColor(tag.vibe)}
                    onPress={() => {
                      requestAnimationFrame(() => {
                        onSelectGroove(tag);
                      });
                    }}

                  />

                  <Marker
                    coordinate={{
                      latitude: tag.coordinates.lat,
                      longitude: tag.coordinates.lng,
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                    tracksViewChanges={tracksViewChanges}
                    zIndex={10}
                    pointerEvents="none"
                  >


                    <View style={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      paddingHorizontal: 2,
                      paddingVertical: 1,
                      borderRadius: 20,
                      minWidth: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                        +{tag.supportCount ?? 0}
                      </Text>


                    </View>
                  </Marker>
                </React.Fragment>
              ))}
            </MapView>



            {(!isMapReady || locationLoading) && (
              <View style={styles.mapLoadingOverlay}>
                <Text style={styles.loadingText}>Loading map…</Text>
              </View>
            )}


            <TouchableOpacity style={[
              styles.tagButton,
              { bottom: 5 + insets.bottom }
            ]} onPress={onNavigateToTag}>
              <Plus size={16} color="#fff" />
              <Text style={styles.tagButtonText}>Tag My Groove</Text>
            </TouchableOpacity>
            {selectedGroove && (
              <GrooveDetailsPopup
                groove={selectedGroove}
                onClose={() => onSelectGroove(null)}
                userLocation={userLocation}
               onSupport={() => {
  if (selectedGroove) {
    onSelectGroove({
      ...selectedGroove,
      supportCount: (selectedGroove.supportCount ?? 0) + 1,
    });
  }
}}

              />
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
  initialLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },

  initialLoaderText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },



  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },

  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },

  legendText: { fontSize: 12, color: '#333' },
});

export default GrooveMapScreen;
