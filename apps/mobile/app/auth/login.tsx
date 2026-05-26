import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../lib/supabase'
import { getStreamToken } from '../../lib/api'
import { connectChatUser, createStreamVideoClient } from '../../lib/stream'
import { useAdminStore } from '../../store/adminStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setAdmin, setToken, setStreamToken, setStreamChatClient, setStreamVideoClient } =
    useAdminStore()

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) throw new Error(authError.message)
      if (!data.session) throw new Error('No session returned from Supabase.')

      const accessToken = data.session.access_token
      await AsyncStorage.setItem('access_token', accessToken)
      setToken(accessToken)

      // 2. Fetch Stream token from API
      const { token: streamTok, userId } = await getStreamToken()
      setStreamToken(streamTok)
      await AsyncStorage.setItem('stream_token', streamTok)

      // 3. Build admin profile from Supabase user
      const supaUser = data.session.user
      const adminProfile = {
        id: supaUser.id,
        name: supaUser.user_metadata?.name ?? supaUser.email ?? 'Admin',
        email: supaUser.email ?? '',
        avatarUrl: supaUser.user_metadata?.avatar_url,
        role: supaUser.user_metadata?.role ?? 'admin',
      }
      setAdmin(adminProfile)

      // 4. Connect Stream Chat
      const chatClient = await connectChatUser(
        userId,
        adminProfile.name,
        adminProfile.avatarUrl,
        streamTok
      )
      setStreamChatClient(chatClient)

      // 5. Create Stream Video client
      const videoClient = createStreamVideoClient(
        userId,
        adminProfile.name,
        adminProfile.avatarUrl,
        streamTok
      )
      setStreamVideoClient(videoClient)

      router.replace('/(tabs)')
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.appName}>RetailHub Admin</Text>
          <Text style={styles.tagline}>Manage your retail operation</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@retailhub.com"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            secureTextEntry
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>RetailHub v1.0 — Admin access only</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#64748b',
  },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#450a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f1f5f9',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    marginTop: 32,
    fontSize: 12,
    color: '#334155',
  },
})
