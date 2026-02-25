import React, { useState } from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, Dimensions } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


interface Message {
  id: string;
  text: string;
  userId: string;
}

interface DeleteMsgProps {
  userId: string;
  grooveId: string;
  chatId: string;
  messageId: string;
  messages: Message[];
  onDeleteSuccess: (messageId: string) => void;
}

const {width, height} = Dimensions.get('window');
export const DeleteMessageButton: React.FC<DeleteMsgProps> = ({
  userId,
  grooveId,
  chatId,
  messageId,
  messages,
  onDeleteSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const handleDelete = async () => {
    const token = await AsyncStorage.getItem("token");

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/chat/deleteMessage`, {
        userId,
        grooveId,
        chatId,
        messageId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onDeleteSuccess(messageId);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.deleteButton, loading && styles.disabledButton]}
        onPress={handleDelete}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
const rightOffset = 2;
const styles = StyleSheet.create({

 deleteButton: {
  position: "relative",
  top: 4,
  right: rightOffset,
  paddingLeft: 301,
  paddingVertical: 2,
  paddingHorizontal: 6,
  borderRadius: 4,
  zIndex: 10,
  alignSelf: "flex-end"
},
  deleteButtonText: {
    color: "#ee0b0b",
    fontWeight: "bold",
    fontSize: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});