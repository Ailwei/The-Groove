import { useEffect, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import SettingsContext from '../contecxt/settingContext';

export default function NotificationRegistrar() {
  const { notificationsEnabled, notificationFrequency } = useContext(SettingsContext);
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  useEffect(() => {
    let unsubscribeOnMessage: (() => void) | undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;

    const createAndroidChannel = async () => {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    };

    const sendTokenToBackend = async (token: string) => {
      const userId = await AsyncStorage.getItem('userId');
      const authToken = await AsyncStorage.getItem('token');
      if (!userId || !authToken) return;

      try {
        await axios.patch(
          `${BASE_URL}/api/user/updateDeviceToken/${userId}`,
          { deviceToken: token },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (err) {
        console.error('Failed to save token to backend', err);
      }
    };

    const setupNotifications = async () => {
      try {
        const { status: expoStatus } = await Notifications.getPermissionsAsync();
        let status = expoStatus;
        if (status !== 'granted') {
          const result = await Notifications.requestPermissionsAsync();
          status = result.status;
        }
        if (status !== 'granted') return;

        await createAndroidChannel();

        const fcmAuthStatus = await messaging().requestPermission();
        if (
          fcmAuthStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
          fcmAuthStatus !== messaging.AuthorizationStatus.PROVISIONAL
        ) return;

        const token = await messaging().getToken();
        await AsyncStorage.setItem('deviceToken', token);
        await sendTokenToBackend(token);

        unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
          await AsyncStorage.setItem('deviceToken', newToken);
          await sendTokenToBackend(newToken);
        });

        unsubscribeOnMessage = messaging().onMessage(
          async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
            if (!notificationsEnabled) return;

            const { title, body } = remoteMessage.notification ?? {};
            if (!title || !body) return;

            if (notificationFrequency === 'important' && !body.includes('milestone')) return;
            if (notificationFrequency === 'groove' && !body.includes('groove')) return;
            if (notificationFrequency === 'owner' && !body.includes('support')) return;

            await Notifications.scheduleNotificationAsync({
              content: { title, body, data: remoteMessage.data, sound: 'default' },
              trigger: null,
            });
          }
        );
      } catch (err) {
        console.error('Failed to setup notifications', err);
      }
    };

    setupNotifications();

    return () => {
      unsubscribeOnMessage?.();
      unsubscribeTokenRefresh?.();
    };
  }, [notificationsEnabled, notificationFrequency]);

  return null;
}
