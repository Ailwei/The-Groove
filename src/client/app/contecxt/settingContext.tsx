import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  highAccuracy: boolean;
  setHighAccuracy: (value: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;

  notificationFrequency: 'all' | 'important' | 'off';
  setNotificationFrequency: (value: 'all' | 'important' | 'off') => void;
}

const SettingsContext = createContext<SettingsContextType>({
  highAccuracy: false,
  setHighAccuracy: () => {},

  notificationsEnabled: false,
  setNotificationsEnabled: () => {},

  notificationFrequency: "all",
  setNotificationFrequency: () => {},
});

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [highAccuracy, setHighAccuracyState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [notificationFrequency, setNotificationFrequencyState] = useState<'all' | 'important' | 'off'>("all");

 
  useEffect(() => {
    (async () => {
      const savedHighAcc = await AsyncStorage.getItem('highAccuracy');
      if (savedHighAcc !== null) setHighAccuracyState(savedHighAcc === 'true');

      const savedNotif = await AsyncStorage.getItem('notificationsEnabled');
      if (savedNotif !== null) setNotificationsEnabledState(savedNotif === 'true');

      const savedFreq = await AsyncStorage.getItem('notificationFrequency');
      if (savedFreq !== null) setNotificationFrequencyState(savedFreq as 'all' | 'important' | 'off');
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

  const setNotificationFrequency = async (value: 'all' | 'important' | 'off') => {
    setNotificationFrequencyState(value);
    await AsyncStorage.setItem('notificationFrequency', value);
  };

  return (
    <SettingsContext.Provider value={{
      highAccuracy,
      setHighAccuracy,
      notificationsEnabled,
      setNotificationsEnabled,
      notificationFrequency,
      setNotificationFrequency,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
