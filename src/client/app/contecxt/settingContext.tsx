import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  highAccuracy: boolean;
  setHighAccuracy: (value: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  highAccuracy: true,
  setHighAccuracy: () => {},
  notificationsEnabled: true,
  setNotificationsEnabled: () => {},
});

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [highAccuracy, setHighAccuracyState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  useEffect(() => {
    (async () => {
      const savedHighAcc = await AsyncStorage.getItem('highAccuracy');
      if (savedHighAcc !== null) setHighAccuracyState(savedHighAcc === 'true');

      const savedNotif = await AsyncStorage.getItem('notificationsEnabled');
      if (savedNotif !== null) setNotificationsEnabledState(savedNotif === 'true');
    })();
  }, []);

  const setHighAccuracy = async (value: boolean) => {
    setHighAccuracyState(value);
    await AsyncStorage.setItem('highAccuracy', value ? 'true' : 'false');
  };

  const setNotificationsEnabled = async (value: boolean) => {
    setNotificationsEnabledState(value);
    await AsyncStorage.setItem('notificationsEnabled', value ? 'true' : 'false');
  };

  return (
    <SettingsContext.Provider value={{
      highAccuracy,
      setHighAccuracy,
      notificationsEnabled,
      setNotificationsEnabled,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
export default SettingsContext