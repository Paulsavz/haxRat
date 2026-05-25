import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAdminStore } from '@/store/adminStore';

function RootLayoutNav() {
  const { admin, isLoading, loadPersistedState, initSocket } = useAdminStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadPersistedState();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!admin && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (admin && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [admin, isLoading, segments]);

  useEffect(() => {
    if (admin) {
      initSocket();
    }
  }, [admin]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </>
  );
}
