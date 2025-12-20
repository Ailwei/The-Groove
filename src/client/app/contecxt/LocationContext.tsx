import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getDistanceFromLatLonInM } from '../../shared/geo';
import { sendLocationToServer } from '../services/userServices';
import { Coordinates, useUserLocation } from '../utilsF/geo';

interface LocationContextType {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: true,
  error: null,
});

interface Props {
  children: ReactNode;
}

export const LocationProvider = ({ children }: Props) => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  const userLocation = useUserLocation();
  const lat = userLocation?.location?.lat;
  const lng = userLocation?.location?.lng;

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) setTokenReady(true);
      } catch (err: any) {
        setError(err.message || 'Failed to get token');
      }
    };
    checkToken();
  }, []);

  useEffect(() => {
    if (!lat || !lng) return;

    const coords: Coordinates = { lat, lng };

    if (!location) {
      setLocation(coords);
      setLoading(false);

      if (tokenReady) {
        sendLocationToServer(coords).catch(err => setError(err.message || 'Failed to send location'));
      }

      return;
    }

    const distance = getDistanceFromLatLonInM(
      location.lat,
      location.lng,
      coords.lat,
      coords.lng
    );

    if (distance > 5000) {
      setLocation(coords);
      if (tokenReady) {
        sendLocationToServer(coords).catch(err => setError(err.message || 'Failed to send location'));
      }
    }
  }, [lat, lng, tokenReady, location]);

  return (
    <LocationContext.Provider value={{ location, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
