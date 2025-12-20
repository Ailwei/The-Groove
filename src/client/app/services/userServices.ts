import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function sendLocationToServer(coords: { lat: number; lng: number }) {

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.warn("No auth token found, skipping location update");
      return;
    }

    await axios.patch(
      "http://192.168.18.29:3000/api/user/upldatelocation",
      { location: coords },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error("Failed to send location to backend", err);
  }
}
