import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import NotificationRegistrar from './componet/NotificationRegistrar';
import { SettingsProvider } from './contecxt/settingContext';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreens } from './screens/OnboardingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SignupScreen } from './screens/SignUp';
import { SplashScreen } from './screens/SplashScreen';
import { TagGrooveScreen } from './screens/TagGrooveScreen';
import * as Notifications from 'expo-notifications';




Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowSound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export type Screen = 'splash' | 'signup' | 'login' | 'onboarding' | 'home' | 'tag' | 'profile' | 'settings' | 'forgotpassword' | 'resetpassword';

export interface GrooveTag {
  id: string;
  coordinates: { lat: number; lng: number };
  vibe: 'very-busy' | 'busy' | 'mild' | 'quiet';
  message?: string;
  taggedAt: Date;
  location: string;
  startTime: Date;
  endTime: Date;
  supportCount?: number;
}


export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [grooveTags, setGrooveTags] = useState<GrooveTag[]>([]);
  const [selectedGroove, setSelectedGroove] = useState<GrooveTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_complete');
        const storedUserId = await AsyncStorage.getItem('userId');

        if (completed === 'true') setHasCompletedOnboarding(true);
        if (storedUserId) setUserId(storedUserId);
      } catch (e) {
        console.log('Error reading app status', e);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

useEffect(() => {
  if (!userId) return;

  const fetchGrooves = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('http://192.168.18.29:3000/api/grooves', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedGrooves: GrooveTag[] = res.data.grooves.map((g: any) => ({
        id: g.id,
        coordinates: g.coordinates,
        vibe: g.vibe,
        message: g.message,
        taggedAt: new Date(g.createdAt._seconds * 1000),
        location: g.location || 'Unknown',
        startTime: new Date(g.startAt._seconds * 1000),
        endTime: new Date(g.expiresAt._seconds * 1000),
        supportCount: g.supporters?.length || 0,
      }));

      setGrooveTags(formattedGrooves);
    } catch (err) {
      console.error('Error fetching grooves:', err);
    }
  };

  fetchGrooves();
  const interval = setInterval(fetchGrooves, 3000);
  return () => clearInterval(interval);
}, [userId]);


  const handleSplashComplete = () => {
    if (loading) return;

    if (!userId) {
      setCurrentScreen('signup');
    } else {
      setCurrentScreen('login');
    }
  };
  const handleSignupSuccess = async (id: string) => {
    await AsyncStorage.getItem('userId');
    setUserId(id);
    setCurrentScreen('login');
  };

  const handleLoginSuccess = async (id: string) => {
    await AsyncStorage.getItem('userId');
    setUserId(id);

    if (!hasCompletedOnboarding) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

  const handleAddGroove = (groove: Omit<GrooveTag, 'id' | 'taggedAt'>) => {
    const newGroove: GrooveTag = { ...groove, id: Date.now().toString(), taggedAt: new Date() };
    setGrooveTags([...grooveTags, newGroove]);
    setCurrentScreen('home');
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <SettingsProvider>
        <NotificationRegistrar />
    <View style={styles.container}>
      {currentScreen === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {currentScreen === 'signup' && (
        <SignupScreen
          onSignupSuccess={handleSignupSuccess}
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      )}
      {currentScreen === 'login' && (
        <LoginScreen
        onNavigateToForgot={() => setCurrentScreen('forgotpassword')}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignup={() => setCurrentScreen('signup')}
        />
      )}
   {currentScreen === 'forgotpassword' && (
  <ForgotPasswordScreen
    onNavigateToReset={(email) => {
      setResetEmail(email);
      setCurrentScreen('resetpassword');
    }}
    onBackToLogin={() => setCurrentScreen('login')}
  />
)}

  {currentScreen === 'resetpassword' && resetEmail && (
  <ResetPasswordScreen
    email={resetEmail}
    onBackToLogin={() => setCurrentScreen('login')}
  />
)}


      {currentScreen === 'onboarding' && <OnboardingScreens onComplete={handleOnboardingComplete} />}
      {currentScreen === 'home' && (
        <HomeScreen
          grooveTags={grooveTags}
          onNavigateToTag={() => setCurrentScreen('tag')}
          onNavigateToProfile={() => setCurrentScreen('profile')}
          onNavigateToSettings={() => setCurrentScreen('settings')}
          selectedGroove={selectedGroove}
          onSelectGroove={setSelectedGroove}
        />
      )}
      {currentScreen === 'tag' && <TagGrooveScreen onBack={() => setCurrentScreen('home')} onSubmit={handleAddGroove} />}
      {currentScreen === 'profile' && <ProfileScreen onBack={() => setCurrentScreen('home')} onNavigateToSettings={() => setCurrentScreen('settings')} />}
      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setCurrentScreen('home')}
          onLogout={async () => {
            await AsyncStorage.removeItem('userId');
            setUserId(null);
            setCurrentScreen('login');
          }}
        />
      )}
      <Toast />
    </View>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
});
