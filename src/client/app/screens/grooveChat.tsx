import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
}

interface ChatRoomProps {
  initialMessages?: Message[];
  grooveId: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ initialMessages = [] , grooveId}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      setCurrentId(id);
    };
    loadUser();
  }, [grooveId]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentId) return;

    const messageObj: Message = {
      id: Date.now().toString(),
      userId: currentId,
      text: newMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => (
          <View key={msg.id} style={styles.message}>
            <Text style={styles.user}>{msg.userId}:</Text>
            <Text>{msg.text}</Text>
            <Text style={styles.time}>{msg.createdAt.toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  messagesContainer: { flex: 1 },
  message: { marginBottom: 12 },
  user: { fontWeight: "bold" },
  time: { fontSize: 10, color: "#888" },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 8 },
  sendButton: { backgroundColor: "#8b5cf6", padding: 12, marginLeft: 8, borderRadius: 8 },
});
