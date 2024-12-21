import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Keyboard,
} from "react-native";
import { getDatabase, ref, push, onValue, set } from "firebase/database";
import { getAuth } from "firebase/auth";
import { FontAwesome } from "@expo/vector-icons";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: number;
}

interface ChatComponentProps {
  bidId: string; // Change to bidId
  isActive: boolean; // Control chat availability
}

const ChatComponent: React.FC<ChatComponentProps> = ({ bidId, isActive }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const messagesRef = ref(db, `chats/${bidId}`); // Use bidId

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const messagesArray = Object.entries(data).map(
        ([id, message]: [string, any]) => ({
          id,
          ...message,
        })
      );
      setMessages(messagesArray);
    });

    return () => unsubscribe();
  }, [bidId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const db = getDatabase();
    const messagesRef = ref(db, `chats/${bidId}`); // Use bidId
    const newMessageRef = push(messagesRef);

    const message: Message = {
      id: newMessageRef.key!,
      text: newMessage,
      senderId: user!.uid,
      createdAt: Date.now(),
    };

    try {
      await set(newMessageRef, message);
      setNewMessage("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!isActive) {
    return (
      <View style={styles.inactiveContainer}>
        <Text style={styles.inactiveText}>
          Chat is not available until the bid is accepted.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === user!.uid
                ? styles.sentMessage
                : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <FontAwesome name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  inactiveContainer: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  inactiveText: {
    color: "#888",
    fontStyle: "italic",
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  sentMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  receivedMessage: {
    backgroundColor: "#4CAF50", // Change to a different color
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontSize: 16, // Increase font size for readability
    lineHeight: 22, // Increase line height for better spacing
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
    fontSize: 16, // Increase font size for readability
  },
  sendButton: {
    padding: 10,
  },
});

export default ChatComponent;
