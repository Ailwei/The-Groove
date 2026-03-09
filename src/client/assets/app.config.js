import 'dotenv/config';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '.env') });

export default {
  expo: {
    name: "TheGroove",
    slug: "TheGroove",
    version: "1.0.0",
    icon: "./assets/icon.png", 
    orientation: "portrait",
    scheme: "thegroove",
    jsEngine: "hermes",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.ailwei.TheGroove",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      output: "static",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          // image: "./assets/splashscreen_logo.png",
          // imageWidth: 200,
          // resizeMode: "contain",
          // backgroundColor: "#ffffff",
          // dark: { backgroundColor: "#000000" },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      router: {},
    },
  },
};
