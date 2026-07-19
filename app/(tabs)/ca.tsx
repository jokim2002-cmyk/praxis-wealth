import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { theme } from "@/src/utils/theme";
import { api } from "@/src/utils/api";
import { serif } from "@/src/utils/fonts";

type Msg = { role: "user" | "assistant"; content: string; timestamp?: string };

const PROMPTS = [
  "Can I afford ₹50,000 for a holiday this quarter?",
  "How do I hit my full 80C limit before March?",
  "What's my ideal emergency fund?",
  "Should I keep more cash in hand or in the bank?",
];

export default function CAScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  const loadHistory = useCallback(async () => {
    try {
      const h = await api.chatHistory();
      setMessages(h.messages as Msg[]);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const send = async (content?: string) => {
    const msg = (content ?? text).trim();
    if (!msg || sending) return;
    setText("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);
    try {
      const r = await api.aiChat(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: r.reply, timestamp: r.timestamp }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `I couldn't reach the ledger just now. ${e?.message ?? ""}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PRAXIS · PERSONAL CA</Text>
            <Text style={[styles.h1, serif]}>In session.</Text>
          </View>
          <View style={styles.avatar}>
            <Feather name="user" size={16} color={theme.color.brand} />
          </View>
        </View>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, serif]}>How may I assist you today?</Text>
            <Text style={styles.emptyBody}>
              I have your monthly ledger in front of me. Ask me anything — tax, savings, cash,
              investing.
            </Text>
            <View style={styles.promptsCol}>
              {PROMPTS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => send(p)}
                  style={styles.promptBtn}
                  testID={`prompt-${p.slice(0, 10)}`}
                >
                  <Feather name="corner-down-right" size={12} color={theme.color.brand} />
                  <Text style={styles.promptText}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => `m-${i}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.aiBubble,
                ]}
                testID={`msg-${item.role}`}
              >
                {item.role === "assistant" && (
                  <Text style={styles.aiTag}>PRAXIS CA</Text>
                )}
                <Text
                  style={[
                    styles.bubbleText,
                    item.role === "user" && { color: "#FFFFFF" },
                  ]}
                >
                  {item.content}
                </Text>
              </View>
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {sending && (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" color={theme.color.brand} />
            <Text style={styles.thinkingText}>CA is reviewing your ledger…</Text>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            testID="ca-input"
            value={text}
            onChangeText={setText}
            placeholder="Ask your CA…"
            placeholderTextColor={theme.color.muted}
            style={styles.composerInput}
            multiline
          />
          <Pressable
            testID="ca-send"
            onPress={() => send()}
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            disabled={!text.trim() || sending}
          >
            <Feather name="arrow-up" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
  },
  eyebrow: { color: theme.color.brand, letterSpacing: 3, fontSize: 10, fontWeight: "700" },
  h1: { fontSize: 26, color: theme.color.onSurface, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: theme.color.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  empty: { flex: 1, padding: theme.spacing.xl, justifyContent: "center" },
  emptyTitle: {
    fontSize: 24,
    color: theme.color.onSurface,
    marginBottom: theme.spacing.md,
  },
  emptyBody: {
    fontSize: 13,
    color: theme.color.muted,
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  promptsCol: { gap: theme.spacing.sm },
  promptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surfaceSecondary,
  },
  promptText: { flex: 1, fontSize: 13, color: theme.color.onSurface },
  list: { padding: theme.spacing.xl, gap: theme.spacing.md },
  bubble: {
    padding: theme.spacing.lg,
    maxWidth: "88%",
  },
  aiBubble: {
    backgroundColor: theme.color.brandTertiary,
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: theme.color.brand,
    alignSelf: "flex-end",
  },
  aiTag: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.color.brand,
    marginBottom: 6,
  },
  bubbleText: { fontSize: 14, color: theme.color.onBrandTertiary, lineHeight: 21 },
  thinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  thinkingText: { fontSize: 12, color: theme.color.muted, fontStyle: "italic" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.divider,
    backgroundColor: theme.color.surfaceSecondary,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.color.onSurface,
    backgroundColor: theme.color.surface,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.color.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
