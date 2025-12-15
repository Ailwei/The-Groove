import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, { SlideInRight, SlideOutLeft, Layout, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface OnboardingScreensProps {
  onComplete: () => void;
}

export function OnboardingScreens({ onComplete }: OnboardingScreensProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const screens = [
    {
      icon: <FontAwesome5 name="fire" size={80} color="white" />,
      title: 'Welcome to THE GROOOOOVE',
      description: 'Find the hottest groove near you.',
      gradient: ['#F97316', '#EF4444'],
    },
    {
      icon: <Feather name="map-pin" size={80} color="white" />,
      title: 'How it Works',
      description: 'Users tag their groove spot. Colors show how busy it is.',
      gradient: ['#A78BFA', '#EC4899'],
    },
    {
      icon: <MaterialIcons name="notifications" size={80} color="white" />,
      title: 'Stay Updated',
      description: 'Get notified when a groove near you is heating up.',
      gradient: ['#3B82F6', '#8B5CF6'],
    },
  ];

  const handleNext = () => {
    if (currentStep < screens.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => onComplete();

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        key={currentStep}
        entering={SlideInRight.springify()}
        exiting={SlideOutLeft.springify()}
        layout={Layout.springify()}
        style={[styles.card, { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }]}
      >
        <LinearGradient
          colors={screens[currentStep].gradient as [string, string]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.gradientBackground}
        >
          <Animated.View style={styles.iconContainer} layout={Layout.springify()}>
            {screens[currentStep].icon}
          </Animated.View>
          <Text style={styles.title}>{screens[currentStep].title}</Text>
          <Text style={styles.description}>{screens[currentStep].description}</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.dotsContainer}>
        {screens.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: index === currentStep ? withSpring(24) : 10,
                backgroundColor: index === currentStep ? '#fff' : 'rgba(255,255,255,0.5)',
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>
          {currentStep === screens.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>

      {currentStep < screens.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  card: { width: width * 0.85, borderRadius: 24, marginVertical: 20, overflow: 'hidden' },
  gradientBackground: { padding: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  iconContainer: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 18, color: '#fff', textAlign: 'center', lineHeight: 24 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 24 },
  dot: { height: 10, borderRadius: 5, marginHorizontal: 6 },
  nextButton: {
    width: '65%',
    padding: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 5,
  },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skipButton: {
    width: '65%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: { color: '#2563EB', fontSize: 18, fontWeight: '700' },
});

export default OnboardingScreens;
