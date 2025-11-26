import React, { useState } from "react";
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
} from "react-native";
import Toast from "react-native-toast-message";
import axios from "axios";

interface ResetPasswordScreenProps {
  email: string;
  onBackToLogin: () => void;
}

export function ResetPasswordScreen({ email, onBackToLogin }: ResetPasswordScreenProps) {
  const [otp, setOTP] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp || !password || !confirmPassword) {
      Toast.show({ type: "error", text1: "All fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://192.168.18.29:3000/api/user/resetPassword", {
        email,
        otp,
        newPassword: password,
      });

      Toast.show({ type: "success", text1: res.data.message });

      setTimeout(() => {
        onBackToLogin();
        
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Something went wrong";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Reset Password</Text>

        <View style={styles.field}>
          <Text style={styles.label}>OTP</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOTP}
            placeholder="Enter OTP"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            secureTextEntry
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onBackToLogin} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1, justifyContent: "center", backgroundColor: "#f1f5f9" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  field: { marginBottom: 16 },
  label: { fontWeight: "bold", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  button: { backgroundColor: "#8b5cf6", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  linkText: { color: "#8b5cf6", textAlign: "center", fontWeight: "500" },
});

export default ResetPasswordScreen;
