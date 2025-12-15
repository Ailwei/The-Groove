import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  highAccuracy: boolean;
  setHighAccuracy: (value: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;

  notificationFrequency: 'all' | 'groove' | 'important' | 'owner';
  setNotificationFrequency: (value: 'all' | 'groove' | 'important' | 'owner') => void;

  reloadSettings: () => Promise<void>;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  highAccuracy: true,
  setHighAccuracy: () => {},
  notificationsEnabled: true,
  setNotificationsEnabled: () => {},
  notificationFrequency: 'all',
  setNotificationFrequency: () => {},
  reloadSettings: async () => {},
  resetSettings: () => {},
});

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [highAccuracy, setHighAccuracyState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [notificationFrequency, setNotificationFrequencyState] =
    useState<'all' | 'groove' | 'important' | 'owner'>('all');

  const getUserId = async (): Promise<string | null> => {
    return AsyncStorage.getItem('userId');
  };

  const storageKey = (key: string, userId: string) => `${key}:${userId}`;

  const loadSettings = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const savedHighAcc = await AsyncStorage.getItem(storageKey('highAccuracy', userId));
    if (savedHighAcc !== null) setHighAccuracyState(savedHighAcc === 'true');


    const savedNotif = await AsyncStorage.getItem(storageKey('notificationsEnabled', userId));
    if (savedNotif !== null) setNotificationsEnabledState(savedNotif === 'true');

    const savedFreq = await AsyncStorage.getItem(storageKey('notificationFrequency', userId));
    if (savedFreq !== null)
      setNotificationFrequencyState(savedFreq as 'all' | 'groove' | 'important' | 'owner');
  };
  

  const setHighAccuracy = async (value: boolean) => {
    setHighAccuracyState(value);
    const userId = await getUserId();
    if (!userId) return;
    await AsyncStorage.setItem(storageKey('highAccuracy', userId), value ? 'true' : 'false');
  };

  const setNotificationsEnabled = async (value: boolean) => {
    setNotificationsEnabledState(value);
    const userId = await getUserId();
    if (!userId) return;
    await AsyncStorage.setItem(storageKey('notificationsEnabled', userId), value ? 'true' : 'false');
  };

  const setNotificationFrequency = async (value: 'all' | 'groove' | 'important' | 'owner') => {
    setNotificationFrequencyState(value);
    const userId = await getUserId();
    if (!userId) return;
    await AsyncStorage.setItem(storageKey('notificationFrequency', userId), value);
  };

  const resetSettings = () => {
    setHighAccuracyState(true);
    setNotificationsEnabledState(true);
    setNotificationFrequencyState('all');
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        highAccuracy,
        setHighAccuracy,
        notificationsEnabled,
        setNotificationsEnabled,
        notificationFrequency,
        setNotificationFrequency,
        reloadSettings: loadSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
