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
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { theme } from "@/src/utils/theme";
import { api } from "@/src/utils/api";
import { serif } from "@/src/utils/fonts";
import { requestMicrophonePermission, speakText } from "@/src/services/voice";

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
  const [isRecording, setIsRecording] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList<Msg>>(null);
  const inputRef = useRef<TextInput>(null);
  const voiceInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (voiceModalVisible) {
      setTimeout(() => voiceInputRef.current?.focus(), 500);
    }
  }, [voiceModalVisible]);

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
      const reply = r.reply;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: r.timestamp }]);
      await speakText(reply, "en");
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

  const handleVoice = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert("Permission needed", "Please allow microphone access to use voice.");
      return;
    }
    setVoiceText("");
    setVoiceModalVisible(true);
  };

  const sendVoiceInput = () => {
    const msg = voiceText.trim();
    if (!msg) return;
    setVoiceModalVisible(false);
    setText(msg);
    setTimeout(() => send(msg), 300);
  };

  // SMART: Use 80% of keyboard height (works for all keyboards)
  const composerBottom = keyboardHeight > 0 ? keyboardHeight * 0.8 : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
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
            <View style={[styles.empty, { paddingBottom: keyboardHeight > 0 ? keyboardHeight * 0.8 + 20 : 40 }]}>
              <Text style={[styles.emptyTitle, serif]}>How may I assist you today?</Text>
              <Text style={styles.emptyBody}>
                I have your monthly ledger in front of me. Ask me anything — tax, savings, cash,
                investing. Use the mic button for voice input.
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
              contentContainerStyle={[styles.list, { paddingBottom: keyboardHeight > 0 ? keyboardHeight * 0.8 + 20 : 40 }]}
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

          <View style={[styles.composerWrapper, { bottom: composerBottom }]}>
            <View style={styles.composer}>
              <TextInput
                ref={inputRef}
                testID="ca-input"
                value={text}
                onChangeText={setText}
                placeholder="Ask your CA…"
                placeholderTextColor={theme.color.muted}
                style={styles.composerInput}
                multiline
                returnKeyType="send"
                onSubmitEditing={() => send()}
              />
              <Pressable
                testID="ca-voice"
                onPress={handleVoice}
                style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
                disabled={isRecording}
              >
                <Feather name={isRecording ? "mic-off" : "mic"} size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                testID="ca-send"
                onPress={() => send()}
                style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
                disabled={!text.trim() || sending}
              >
                <Feather name="arrow-up" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🎤 Voice Input</Text>
                  <Pressable onPress={() => setVoiceModalVisible(false)}>
                    <Feather name="x" size={24} color={theme.color.onSurface} />
                  </Pressable>
                </View>

                <TextInput
                  ref={voiceInputRef}
                  style={styles.modalInput}
                  placeholder="Type your command here..."
                  placeholderTextColor={theme.color.muted}
                  value={voiceText}
                  onChangeText={setVoiceText}
                  multiline
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={sendVoiceInput}
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => setVoiceModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalSendBtn]}
                    onPress={sendVoiceInput}
                    disabled={!voiceText.trim()}
                  >
                    <Text style={styles.modalSendText}>Send</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: theme.color.surface,
    zIndex: 10,
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
    backgroundColor: theme.color.surface,
  },
  thinkingText: { fontSize: 12, color: theme.color.muted, fontStyle: "italic" },
  composerWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.divider,
    backgroundColor: theme.color.surfaceSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 0,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
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
  voiceBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.color.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnActive: {
    backgroundColor: theme.color.error,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.color.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.color.surfaceSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.color.onSurface,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 200,
    color: theme.color.onSurface,
    backgroundColor: theme.color.surface,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: theme.spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelBtn: {
    backgroundColor: theme.color.surfaceTertiary,
  },
  modalCancelText: {
    color: theme.color.onSurface,
    fontWeight: "500",
  },
  modalSendBtn: {
    backgroundColor: theme.color.brand,
  },
  modalSendText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
