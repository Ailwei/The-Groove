import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import axios from 'axios';

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
  onNavigateToSignup: () => void;
  onNavigateToForgot: () => void;
}

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function LoginScreen({ onLoginSuccess, onNavigateToSignup , onNavigateToForgot}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Email and password are required' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://192.168.18.29:3000/api/users/login', {
        email,
        password,
      });
      const token = res.data.token;
      const userId = res.data.user.id; 

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('userId', userId);

      Toast.show({ type: 'success', text1: 'Logged in successfully!' });

      onLoginSuccess(userId);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Try again.';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToSignup} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
       <TouchableOpacity onPress={onNavigateToForgot} style={{ marginTop: 16 }}>
  <Text style={styles.linkText}>Forgot password?</Text>
</TouchableOpacity>



        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#8b5cf6', textAlign: 'center', fontWeight: '500' },
});

export default LoginScreen;
