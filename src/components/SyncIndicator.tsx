import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "@/src/utils/theme";
import { getSyncCount, autoSync, syncWithBackend } from "@/src/services/sync";

export function SyncIndicator() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const checkPending = async () => {
    const count = await getSyncCount();
    setPendingCount(count);
  };

  const runSync = async () => {
    if (syncing || pendingCount === 0) return;
    setSyncing(true);
    try {
      const result = await syncWithBackend();
      console.log(`[Sync] Manual sync: ${result.synced} synced, ${result.failed} failed`);
      setLastSync(new Date());
      await checkPending();
    } catch (e) {
      console.error('[Sync] Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkPending();
    // Auto-sync on mount
    const timer = setTimeout(() => {
      autoSync().then(() => {
        checkPending();
        setLastSync(new Date());
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (pendingCount === 0 && !syncing) {
    return (
      <Pressable onPress={checkPending} style={styles.container}>
        <Feather name="check-circle" size={12} color={theme.color.success} />
        <Text style={styles.text}>Synced</Text>
        {lastSync && (
          <Text style={styles.time}>
            {lastSync.toLocaleTimeString()}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={runSync} disabled={syncing} style={styles.container}>
      {syncing ? (
        <>
          <ActivityIndicator size="small" color={theme.color.brand} />
          <Text style={styles.text}>Syncing...</Text>
        </>
      ) : (
        <>
          <Feather name="upload-cloud" size={12} color={theme.color.warning} />
          <Text style={[styles.text, { color: theme.color.warning }]}>
            {pendingCount} pending
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 10,
    color: theme.color.muted,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 9,
    color: theme.color.muted,
    opacity: 0.6,
  },
});
