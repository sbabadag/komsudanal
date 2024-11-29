import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

// Make sure to register your app and get these credentials from Google Cloud Console
const GOOGLE_CLIENT_ID = "817455873090-n59323uc9ffbd5vm92h3es0kbtbbg84g.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "817455873090-4fa79a7qg72nu5tbstivn9li6gg5okhl.apps.googleusercontent.com"; // If you're supporting iOS

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isSignup, setIsSignup] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '817455873090-vj8qgftod0msnuo65l7v0d4pp2fiia3c.apps.googleusercontent.com',
    iosClientId: '817455873090-4fa79a7qg72nu5tbstivn9li6gg5okhl.apps.googleusercontent.com',
    webClientId: '817455873090-7321qin1jnaou6rmu4a6dfktprioirnr.apps.googleusercontent.com',
  });

  useEffect(() => {
    const checkStoredCredentials = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await AsyncStorage.getItem('password');
      if (storedEmail && storedPassword) {
        setCredentials({ email: storedEmail, password: storedPassword });
        handleLogin(storedEmail, storedPassword);
      }
    };

    checkStoredCredentials();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log(authentication);
      router.replace('/(tabs)');
    }
  }, [response]);

  const handleLogin = async (email = credentials.email, password = credentials.password) => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        if (!userCredential.user.emailVerified) {
          // Send verification email
          await sendEmailVerification(userCredential.user, {
            url: 'https://selahattinbabadag.com',
            handleCodeInApp: true,
          });

          Alert.alert('Email Verification', 'A verification email has been sent to your email address. Please verify before logging in.');
          return;
        }
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      let errorMessage = 'Wrong email or password';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
      }
      
      Alert.alert('Login Failed', errorMessage);
      return; // Ensure the function exits here on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);

      // Send email verification
      await sendEmailVerification(userCredential.user);

      Alert.alert(
        'Signup Successful',
        'A verification email has been sent to your email address. Please verify before logging in.'
      );

      // Clear fields after successful signup
      setCredentials({ email: '', password: '' });
      setIsSignup(false);
    } catch (error: any) {
      let errorMessage = 'An error occurred during signup';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use. Please use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      }

      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitleText}>{isSignup ? 'Sign up to get started' : 'Sign in to continue'}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={credentials.email}
                onChangeText={(text) => setCredentials({ ...credentials, email: text })}
                placeholder="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                placeholder="Enter your password"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          {!isSignup && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && { opacity: 0.7 }
            ]} 
            onPress={isSignup ? handleSignup : () => handleLogin()}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? (isSignup ? 'Signing Up...' : 'Signing In...') : (isSignup ? 'Sign Up' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Image 
              source={require('../../assets/images/google-logo.png')}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
              <Text style={styles.signupLink}>{isSignup ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center', // Center vertically
  },
  contentContainer: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400, // Maximum width for larger screens
    alignSelf: 'center', // Center horizontally
  },
  headerContainer: {
    alignItems: 'center', // Center header text
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'left', // Keep labels left-aligned for better readability
  },
  inputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center', // Center input text
  },
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
