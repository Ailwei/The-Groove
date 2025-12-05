import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export async function registerForPush(userId: string) {
  if (!Constants.isDevice) {
    console.warn('Must use physical device for push notifications');
    return null;
  }

  try {
    const storedToken = await AsyncStorage.getItem('deviceToken');
    if (storedToken) return storedToken;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log('Device token:', token);

    await AsyncStorage.setItem('deviceToken', token);

   
    await axios.post('http://192.168.18.29:3000/api/save-device-token', {
      userId,
      deviceToken: token,
    });

    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('default', []);
    }

    return token;
  } catch (err) {
    console.error('Error registering push token:', err);
    return null;
  }
}
