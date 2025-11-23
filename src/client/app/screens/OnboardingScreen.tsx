import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, { SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';
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
      icon: <FontAwesome5 name="fire" size={64} color="white" />,
      title: 'Welcome to THE GROOOOOVE',
      description: 'Find the hottest groove near you.',
      gradient: ['#F97316', '#EF4444'],
    },
    {
      icon: <Feather name="map-pin" size={64} color="white" />,
      title: 'How it Works',
      description: 'Users tag their groove spot. Colors show how busy it is.',
      gradient: ['#A78BFA', '#EC4899'],
    },
    {
      icon: <MaterialIcons name="notifications" size={64} color="white" />,
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

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        <Animated.View
          key={currentStep}
          entering={SlideInRight.springify()}
          exiting={SlideOutLeft.springify()}
          layout={Layout.springify()}
          style={styles.card}
        >
          <LinearGradient
            colors={screens[currentStep].gradient as [string, string]} 
            start={[0, 0]}
            end={[1, 1]}
            style={styles.gradientBackground}
          >
            <View style={styles.iconContainer}>{screens[currentStep].icon}</View>
            <Text style={styles.title}>{screens[currentStep].title}</Text>
            <Text style={styles.description}>{screens[currentStep].description}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.dotsContainer}>
        {screens.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              index === currentStep ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentStep === screens.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>

      {currentStep < screens.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  screenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  card: { width: width * 0.85, borderRadius: 20, overflow: 'hidden', marginVertical: 20 },
  gradientBackground: { padding: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  iconContainer: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 17, color: '#fff', textAlign: 'center' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 24 },
  dot: { height: 10, borderRadius: 5, marginHorizontal: 6 },
  activeDot: { width: 26, backgroundColor: '#fff' },
  inactiveDot: { width: 10, backgroundColor: 'rgba(255,255,255,0.5)' },
  nextButton: { width: '80%', padding: 16, backgroundColor: '#2563EB', borderRadius: 12, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipButton: { width: '80%', padding: 16, borderWidth: 1, borderColor: '#2563EB', borderRadius: 12, alignItems: 'center' },
  skipButtonText: { color: '#2563EB', fontSize: 18, fontWeight: 'bold' },
});

export default OnboardingScreens;
