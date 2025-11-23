import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 750 }),
        withTiming(1, { duration: 750 })
      ),
      -1,
      true
    );

    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={['#7C3AED', '#EC4899', '#F97316']}
      style={styles.container}
    >
      <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(500)} style={styles.content}>
        <Animated.Text style={[styles.title, animatedStyle]}>
          THE GROOOOOVE
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(500).duration(500)} style={styles.subtitle}>
          Find the hottest spots near you
        </Animated.Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
export default SplashScreen