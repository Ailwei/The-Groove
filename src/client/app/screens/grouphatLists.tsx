import React, { useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

interface ChatGroup {
  grooveId: string;
  chatId: string;
  members: string[];
  grooveLocation: string;
  createdAt?: string;
  createdBy?: string;
  unreadCount: number;
}

type GroupChatListProps = {
  onBack?: () => void;
  onOpenChat: (group: ChatGroup) => void;
};

const GroupChatList = ({ onBack, onOpenChat }: GroupChatListProps) => {
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(
        `${BASE_URL}/api/chat/groups`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setChatGroups(res.data.chats || []);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err.response?.data?.error || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (chat: ChatGroup) => {
    setChatGroups((prev) =>
      prev.map((g) =>
        g.chatId === chat.chatId ? { ...g, unreadCount: 0 } : g
      )
    );

    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await axios.post(
          `${BASE_URL}/api/chat/markAsRead`,
          { grooveId: chat.grooveId, chatId: chat.chatId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.log("Failed to mark chat as read", err);
    }

    onOpenChat(chat);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Groups</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        )}

        {!loading && chatGroups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.noGroupsText}>
              Not a member of any group yet
            </Text>
          </View>
        )}

        {!loading &&
          chatGroups.map((chat) => (
            <TouchableOpacity
              key={chat.chatId}
              style={styles.chatItem}
              onPress={() => handleOpenChat(chat)}
            >
              <View style={styles.chatRow}>
                <View>
                  <Text style={styles.chatName}>{chat.grooveLocation}</Text>
                  <Text style={styles.membersCount}>
                    {chat.members.length} member
                    {chat.members.length > 1 ? "s" : ""}
                  </Text>
                </View>

                {chat.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

 header: {
  flexDirection: "row",
  alignItems: "center",
  padding: 16,                    
  borderBottomWidth: 1,           
  borderBottomColor: "#e5e7eb", 
  backgroundColor: "#fff",         
},
  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },

  list: {
    flex: 1,
  },

  chatItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  chatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },

  membersCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  badge: {
    backgroundColor: "#2563eb",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },

  noGroupsText: {
    fontSize: 14,
    color: "#555",
  },
});

export default GroupChatList;
