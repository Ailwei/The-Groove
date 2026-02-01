import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import NotificationRegistrar from './componet/NotificationRegistrar';
import { SettingsProvider } from './contecxt/settingContext';
import { LocationProvider } from './contecxt/LocationContext';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { GrooveMapScreen } from './screens/GrooveMapScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreens } from './screens/OnboardingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import GroupChatList from './screens/grouphatLists';
import { SettingsScreen } from './screens/SettingsScreen';
import { SignupScreen } from './screens/SignUp';
import { SplashScreen } from './screens/SplashScreen';
import { TagGrooveScreen } from './screens/TagGrooveScreen';
import * as Notifications from 'expo-notifications';
import FetchGrooves from './componet/fetchGrooves';
import Toast from 'react-native-toast-message';
import { ChatRoom } from './screens/grooveChat';


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

export type Screen =
  | 'splash'
  | 'signup'
  | 'login'
  | 'onboarding'
  | 'home'
  | 'tag'
  | 'profile'
  | 'settings'
  | 'forgotpassword'
  | 'resetpassword'
  | 'chatRoom'
  | 'chatGroupList'

interface Supporter {
  userId: string;
  username: string;
}
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
  userId: string;
  supporters?: Supporter[];
  chatId?: string | null;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedGroove, setSelectedGroove] = useState<GrooveTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [chatGroove, setChatGroove] = useState<GrooveTag | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

 useEffect(() => {
  if (chatGroove) {
    console.log(chatGroove)
    setCurrentScreen('chatRoom');
  }
}, [chatGroove]);

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

  const handleSplashComplete = () => {
    if (loading) return;
    setCurrentScreen(!userId ? 'signup' : 'login');
  };

  const handleSignupSuccess = async (id: string) => {
    await AsyncStorage.setItem('userId', id);
    setUserId(id);
    setCurrentScreen('login');
  };

  const handleLoginSuccess = async (id: string) => {
    await AsyncStorage.setItem('userId', id);
    setUserId(id);

    setCurrentScreen(!hasCompletedOnboarding ? 'onboarding' : 'home');
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

  const handleAddGroove = (groove: Omit<GrooveTag, 'id' | 'taggedAt'>) => {
    const newGroove: GrooveTag = { ...groove, id: Date.now().toString(), taggedAt: new Date() };
    setCurrentScreen('home');
  };

useEffect(() => {
}, [currentScreen]);
  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <SettingsProvider>
      <LocationProvider>
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
              onLoginSuccess={handleLoginSuccess}
              onNavigateToSignup={() => setCurrentScreen('signup')}
              onNavigateToForgot={() => setCurrentScreen('forgotpassword')}
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
            <ResetPasswordScreen email={resetEmail} onBackToLogin={() => setCurrentScreen('login')} />
          )}

          {currentScreen === 'onboarding' && (
            <OnboardingScreens onComplete={handleOnboardingComplete} />
          )}

      {currentScreen === 'home' && userId ? (
  <FetchGrooves userId={userId}>
    {(grooveTags) => (
      <GrooveMapScreen
        grooveTags={grooveTags}
        onNavigateToTag={() => setCurrentScreen('tag')}
        onNavigateToProfile={() => setCurrentScreen('profile')}
        onNavigateToSettings={() => setCurrentScreen('settings')}
        onOpenGroupChatList={() => setCurrentScreen('chatGroupList')}
        onJoinChat={(groove) => {
          if (!groove) return;
          setChatGroove(groove);
          setSelectedGroove(null);
        }}
        selectedGroove={selectedGroove}
        onSelectGroove={setSelectedGroove}
      />
    )}
  </FetchGrooves>
) : null}



          {currentScreen === 'tag' && (
            <TagGrooveScreen onBack={() => setCurrentScreen('home')} onSubmit={handleAddGroove} />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen onBack={() => setCurrentScreen('home')} onNavigateToSettings={() => setCurrentScreen('settings')} />
          )}

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
          {currentScreen === 'chatGroupList' && userId && (
  <GroupChatList
    onBack={() => setCurrentScreen('home')}
    onOpenChat={(group) => {
      setChatGroove({
        id: group.grooveId,
        chatId: group.chatId,
      } as any);
    }}
  />
)}


  {currentScreen === 'chatRoom' && chatGroove && (
  <ChatRoom initialMessages={[]} grooveId={chatGroove.id} onBack={() => setCurrentScreen('home')} chatId={chatGroove.chatId ?? ''}/>
)}
          <Toast />
        </View>
      </LocationProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
});
