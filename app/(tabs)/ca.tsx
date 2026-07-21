import { useCallback, useEffect, useRef, useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { theme } from "@/src/utils/theme";
import { api } from "@/src/utils/api";
import { serif } from "@/src/utils/fonts";
import { requestMicrophonePermission, speakText } from "@/src/services/voice";

type Msg = { role: "user" | "assistant"; content: string; timestamp?: string; id?: string };

const PROMPTS = [
  "Can I afford ₹50,000 for a holiday this quarter?",
  "How do I hit my full 80C limit before March?",
  "What's my ideal emergency fund?",
  "Should I keep more cash in hand or in the bank?",
];

// Welcome message
const WELCOME_MSG: Msg = {
  role: "assistant",
  content: "Hello! I'm your Personal CA. I have your monthly ledger in front of me. Ask me anything — tax, savings, cash, investing.",
  id: "welcome-msg",
};

const Bubble = memo(({ item }: { item: Msg }) => (
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
));

let messageCounter = 0;
const generateId = () => `msg-${Date.now()}-${messageCounter++}`;

export default function CAScreen() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MSG]);
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
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
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

  const send = useCallback(async (content?: string) => {
    const msg = (content ?? text).trim();
    if (!msg || sending) return;
    setText("");
    const userMsg: Msg = { role: "user", content: msg, id: generateId() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const r = await api.aiChat(msg);
      const reply = r.reply;
      const aiMsg: Msg = { role: "assistant", content: reply, timestamp: r.timestamp, id: generateId() };
      setMessages((prev) => [...prev, aiMsg]);
      await speakText(reply, "en");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    } catch (e: any) {
      const errMsg: Msg = {
        role: "assistant",
        content: `I couldn't reach the ledger just now. ${e?.message ?? ""}`,
        id: generateId(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [text, sending]);

  const handleVoice = useCallback(async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert("Permission needed", "Please allow microphone access to use voice.");
      return;
    }
    setVoiceText("");
    setVoiceModalVisible(true);
  }, []);

  const sendVoiceInput = useCallback(() => {
    const msg = voiceText.trim();
    if (!msg) return;
    setVoiceModalVisible(false);
    setText(msg);
    setTimeout(() => send(msg), 300);
  }, [voiceText, send]);

  const renderItem = useCallback(({ item }: { item: Msg }) => {
    return <Bubble item={item} />;
  }, []);

  const keyExtractor = useCallback((item: Msg) => item.id || generateId(), []);

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

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, { paddingBottom: keyboardHeight > 0 ? keyboardHeight * 0.8 + 20 : 40 }]}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            initialNumToRender={8}
            updateCellsBatchingPeriod={30}
            ListFooterComponent={
              messages.length === 1 ? (
                <View style={styles.promptsWrapper}>
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
              ) : null
            }
          />

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
  list: { padding: theme.spacing.xl, gap: theme.spacing.md },
  promptsWrapper: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
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
