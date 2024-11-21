import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, push, onValue } from 'firebase/database';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const db = getDatabase();
    const chatId = [currentUser.uid, params.userId].sort().join('-');
    const messagesRef = ref(db, `chats/${chatId}/messages`);

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, message]: [string, any]) => ({
          id,
          ...message,
        }));
        setMessages(messagesList.sort((a, b) => b.timestamp - a.timestamp));
      }
    });
  }, [params.userId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const db = getDatabase();
    const chatId = [currentUser.uid, params.userId].sort().join('-');
    const messagesRef = ref(db, `chats/${chatId}/messages`);

    await push(messagesRef, {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      timestamp: Date.now(),
    });

    setNewMessage('');
  };
  return (
    <View style={StyleSheet.create({ container: { flex: 1 } }).container}>
      <FlatList
        data={messages}
        inverted
        renderItem={({ item }) => (
          <View style={[
            { padding: 10, marginVertical: 5, maxWidth: '80%', borderRadius: 10 },
            item.senderId === getAuth().currentUser?.uid 
              ? { alignSelf: 'flex-end', backgroundColor: '#007AFF', marginLeft: 'auto' }
              : { alignSelf: 'flex-start', backgroundColor: '#E5E5EA', marginRight: 'auto' }
          ]}>
            <Text style={{ color: '#000', fontSize: 16 }}>{item.text}</Text>
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
      
      <View style={StyleSheet.create({ inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#ccc' } }).inputContainer}>
        <TextInput
          style={StyleSheet.create({ input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 } }).input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity 
          style={StyleSheet.create({ sendButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 } }).sendButton}
          onPress={sendMessage}
        >
          <Text style={StyleSheet.create({ sendButtonText: { color: '#fff', fontSize: 16 } }).sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (I can provide the styles if you want)
});