import { AppRegistry } from 'react-native';
import App from './app';
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM background message:', remoteMessage);
});

AppRegistry.registerComponent('main', () => App);
