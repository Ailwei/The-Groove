import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Animated } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

type ChatIconButtonProps = {
  onPress: () => void;
  showLabel?: boolean;
  unreadCount?: number;
  style: any;
};

const ChatIconButton: React.FC<ChatIconButtonProps> = ({
  onPress,
  style,
  showLabel = true,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);


  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => setCurrentUserId(id));
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unreadCount]);

  const fetchUnread = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !currentUserId) return;

      const res = await axios.get(`${BASE_URL}/api/chat/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const chats = res.data.chats || [];

      const totalUnread = chats.reduce((sum: number, chat: any) => {
        const messagesFromOthers = chat.unreadCountFromOthers ?? 0;

        return sum + (messagesFromOthers || (chat.unreadCount || 0));
      }, 0);

      setUnreadCount(totalUnread);
    } catch (err: any) {
      console.log("Failed to fetch unread counts", err);
      Toast.show({
        type: "error",
        text1: "Could not load chats",
        text2: err.response?.data?.error || err.message,
      });
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  return (
     <TouchableOpacity
      onPress={onPress}
      style={[styles.iconButton, style]}
      activeOpacity={0.85}
    >
      <MessageCircle size={22} color="#fff" />

      {showLabel && <Text style={styles.submitText}>My Chats</Text>}

      {unreadCount > 0 && (
        <Animated.View
          style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export default ChatIconButton;

const styles = StyleSheet.create({
  iconButton: {
    position: "absolute",
    bottom: 28,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#8b5cf6",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
