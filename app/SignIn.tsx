import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

const SignInScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign In</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Ensure no rating-related state or handlers are present
// Remove any rating state management or submission functions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default SignInScreen;
