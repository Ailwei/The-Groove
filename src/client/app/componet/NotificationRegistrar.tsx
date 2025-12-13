import { useEffect } from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function NotificationRegistrar() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await messaging().getToken();
        console.log('📱 Device FCM Token:', token);

        await AsyncStorage.setItem('deviceToken', token);

        const userId = await AsyncStorage.getItem('userId');
        const authToken = await AsyncStorage.getItem('token');

        if (userId && authToken) {
          try {
            await axios.patch(
              `http://192.168.18.29:3000/api/user/updateDeviceToken/${userId}`,
              { deviceToken: token },
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log('Device token updated on backend');
          } catch (err) {
            console.error('Failed to save token to backend', err);
          }
        }

        const unsubscribeOnMessage = messaging().onMessage(
          async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {

            await Notifications.scheduleNotificationAsync({
              content: {
                title: remoteMessage.notification?.title ?? 'Notification',
                body: remoteMessage.notification?.body ?? '',
                data: remoteMessage.data,
                sound: 'default',
              },
              trigger: null,
            });
          }
        );

        const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
          console.log('FCM Token refreshed:', newToken);
          await AsyncStorage.setItem('deviceToken', newToken);

          if (userId && authToken) {
            try {
              await axios.patch(
                `http://192.168.18.29:3000/api/user/updateDeviceToken/${userId}`,
                { deviceToken: newToken },
                { headers: { Authorization: `Bearer ${authToken}` } }
              );
              console.log('Refreshed token updated on backend');
            } catch (err) {
              console.error('Failed to update refreshed token on backend', err);
            }
          }
        });

        return () => {
          unsubscribeOnMessage();
          unsubscribeTokenRefresh();
        };
      } catch (err) {
        console.error('Notification setup failed:', err);
      }
    };

    setupNotifications();
  }, []);

  return null;
}
