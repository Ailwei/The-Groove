import * as Location from 'expo-location';
import React from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
}

export function useUserLocation(
  
  onLocationChange?: (coords: Coordinates) => void,
  intervalMinutes = 5
) {
  const [location, setLocation] = React.useState<Coordinates | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let isMounted = true;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMounted) {
            setError('Location permission denied');
            setLoading(false);
          }
          return;
        }

        if (isMounted) setLoading(false);

        const fetchLocation = async () => {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });

         const coords: Coordinates = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
};


          setLocation(coords);
          onLocationChange?.(coords);
        };

        await fetchLocation();

        intervalId = setInterval(fetchLocation, intervalMinutes * 60 * 1000);
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch location');
          setLoading(false);
        }
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return { location, loading, error };
}
