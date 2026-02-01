import React, { useState, useEffect, useRef } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft } from "lucide-react-native";
import Toast from "react-native-toast-message";
import axios from "axios";
import { getColorForUserInGroup } from "../utilsF/chatColors";

interface Message {
  id: string;
  userId: string;
  senderName?: string;
  text: string;
  createdAt: Date;
}

interface ChatRoomProps {
  initialMessages?: Message[];
  grooveId: string;
  chatId: string;
  onBack?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  initialMessages = [],
  grooveId,
  chatId,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);


  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      setCurrentId(userId);
    };
    loadUser();
  }, [grooveId]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          `http://192.168.18.29:3000/api/chat/fetchChats?grooveId=${grooveId}&chatId=${chatId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const messagesFromAPI = res.data.messages.map((msg: any) => ({
          id: msg.id,
          userId: msg.senderId,
          senderName: msg.senderName,
          chatId,
          text: msg.text,
          createdAt: new Date(msg.createdAt),
        }));

        setMessages(messagesFromAPI);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      } catch (err) {
        console.log("Fetch messages failed:", err);
      }
      finally {
        setLoading(false)
      }
    };

    fetchMessages();
  }, [grooveId, chatId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({ type: 'error', text1: 'You must be logged in' });
        return;
      }

      const res = await axios.post(
        'http://192.168.18.29:3000/api/chat/sendMessage',
        {
          grooveId,
          text: newMessage,
          chatId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const messageObj: Message = {
        id: res.data.messageId || Date.now().toString(),
        userId: currentId,
        text: newMessage,
        createdAt: new Date(res.data.createdAt || Date.now()),
      };

      setMessages((prev) => [...prev, messageObj]);
      setNewMessage("");

      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to send message';
      Toast.show({ type: 'error', text1: 'Send Failed', text2: message });
    }
  };
  const handleChatLeave = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Toast.show({ type: "error", text1: "Not authenticated" });
      return;
    }

    await axios.post(
      "http://192.168.18.29:3000/api/chat/leaveChat",
      { grooveId, chatId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Toast.show({
      type: "success",
      text1: "You left the group",
    });

    onBack?.();

  } catch (error: any) {
    Toast.show({
      type: "error",
      text1: "Failed to leave group",
      text2: error.response?.data?.error || "Something went wrong",
    });
  }
};
  if (!currentId) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Room</Text>
        <View>
        </View>
        <View>
       <TouchableOpacity onPress={handleChatLeave}>
  <Text style={styles.title}>Leave Group</Text>
</TouchableOpacity>

        </View>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        contentContainerStyle={{ paddingVertical: 16,
          flexGrow: 1,
         }}
      >
       {loading ? (
  <View style={styles.emptyState}>
    <ActivityIndicator size="large" color="#8b5cf6" />
    <Text style={{ marginTop: 8, color: "#6b7280" }}>
      Loading messages...
    </Text>
  </View>
) : messages.length === 0 ? (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>No messages yet</Text>
    <Text style={styles.emptySubtitle}>
      Start the conversation
    </Text>
  </View>
) : (
  messages.map((msg) => {
    const isMyMessage = msg.userId === currentId;

  return (
      <View
        key={msg.id}
        style={[
          styles.message,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text
          style={[
            styles.user,
            {
              color: isMyMessage
                ? "#1453b7"
                : getColorForUserInGroup(msg.userId, grooveId),
            },
          ]}
        >
          {isMyMessage ? "Me" : msg.senderName || msg.userId}
        </Text>

        <View style={styles.messageRow}>
          <Text style={styles.text}>{msg.text}</Text>
          <Text style={styles.time}>
            {msg.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  })
)}

      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: insets.bottom || 8 }]}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
title: { fontSize: 18, fontWeight: 'bold', color: "red", marginLeft: 90 },

  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  message: {
    marginBottom: 12,
    maxWidth: "100%",
    alignSelf: "stretch",
    padding: 10,
    borderRadius: 12,
  },
myMessage: {
  backgroundColor: "#73796e",
  alignSelf: "stretch",
  maxWidth: "100%",    
},
otherMessage: {
  backgroundColor: "#101110",
  alignSelf: "stretch",
  maxWidth: "100%",
},

  user: { fontWeight: "bold", marginBottom: 4, color: "#1453b7" },
  text: {
  color: "#dbd0d0",
  flexShrink: 1,
  flex: 1,    
},
time: {
  fontSize: 10,
  color: "green",
  marginLeft: 8,
  alignSelf: "flex-end",
},
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 24,
  },
  messageRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-end",
},
emptyState: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
},
emptyTitle: {
  fontSize: 18,
  fontWeight: "600",
  color: "#374151",
  marginBottom: 6,
},
emptySubtitle: {
  fontSize: 14,
  color: "#6b7280",
  textAlign: "center",
},


});
