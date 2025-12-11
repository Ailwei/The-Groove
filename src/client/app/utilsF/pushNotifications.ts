import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert('Permission denied', 'Cannot get notifications permission.');
      return;
    }

    const token = await messaging().getToken();
    console.log("device token", token)
    console.log('FCM device token:', token);
    await AsyncStorage.setItem('deviceToken', token);

    return token;
  } catch (error) {
    console.log('Error registering for notifications', error);
  }
};
export default registerForPushNotificationsAsync