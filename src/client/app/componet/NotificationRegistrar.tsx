import { useEffect } from "react";
import registerForPushNotificationsAsync from "../utilsF/pushNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import messaging from "@react-native-firebase/messaging";

export default function NotificationRegistrar() {

  useEffect(() => {
    const setupPushToken = async () => {
      try {
        const expoToken = await registerForPushNotificationsAsync();
        if (!expoToken) return;

        const userId = await AsyncStorage.getItem("userId");
        const authToken = await AsyncStorage.getItem("token");

        if (!userId || !authToken) return;

        await axios.patch(
          `http://192.168.18.29:3000/api/user/updateDeviceToken/${userId}`,
          { deviceToken: expoToken },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

      } catch (err) {
        console.log("Error registering push notifications:", err);
      }
    };

    setupPushToken();

    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      try {
        console.log("FCM token refreshed:", newToken);

        const userId = await AsyncStorage.getItem("userId");
        const authToken = await AsyncStorage.getItem("token");

        if (!userId || !authToken) return;

        await axios.patch(
          `http://192.168.18.29:3000/api/user/updateDeviceToken/${userId}`,
          { deviceToken: newToken },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

      } catch (err) {
        console.log("Error refreshing token:", err);
      }
    });

    return () => unsubscribe();

  }, []);

  return null;
}
