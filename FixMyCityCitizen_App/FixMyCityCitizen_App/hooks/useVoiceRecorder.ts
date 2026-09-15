/**
 * useVoiceRecorder — voice recording + Sarvam AI STT transcription hook.
 * Requires: npx expo install expo-av
 */
import { useState, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';
import { api } from '../services/api';

const MAX_RECORDING_SECONDS = 60;
const MIN_RECORDING_DURATION_MS = 1000;

export interface UseVoiceRecorderOptions {
  onTranscript: (transcript: string, detectedLanguage: string | null) => void;
  languageHint?: string | null;
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  elapsedSeconds: number;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<void>;
  cancelRecording: () => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const { onTranscript, languageHint = null } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }

  const stopAndTranscribe = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    clearTimers();
    setIsRecording(false);

    try { await recording.stopAndUnloadAsync(); } catch { /* best-effort */ }

    let durationMs = 0;
    try {
      const status = await recording.getStatusAsync();
      durationMs = status.durationMillis ?? 0;
    } catch { /* treat as 0 */ }

    if (durationMs < MIN_RECORDING_DURATION_MS) {
      recordingRef.current = null;
      setElapsedSeconds(0);
      Alert.alert('Recording too short, please try again');
      return;
    }

    const uri = recording.getURI();
    recordingRef.current = null;
    setElapsedSeconds(0);

    if (!uri) {
      Alert.alert('Voice transcription unavailable, please type your description');
      return;
    }

    setIsTranscribing(true);
    try {
      const filename = uri.split('/').pop() ?? 'recording.aac';
      const formData = new FormData();
      formData.append('audio', { uri, name: filename, type: 'audio/aac' } as unknown as Blob);
      if (languageHint) formData.append('languageHint', languageHint);

      const data = await api.postForm('/voice/transcribe', formData) as {
        transcript: string;
        detectedLanguage: string | null;
        confidence: number;
      };

      if (!data.transcript) {
        Alert.alert('No speech detected, please try again');
        return;
      }
      onTranscript(data.transcript, data.detectedLanguage);
    } catch {
      Alert.alert('Voice transcription unavailable, please type your description');
    } finally {
      setIsTranscribing(false);
    }
  }, [languageHint, onTranscript]);

  const startRecording = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status === 'granted') {
      setPermissionStatus('granted');
    } else {
      setPermissionStatus('denied');
      Alert.alert(
        'Microphone Permission Required',
        'Microphone access is required for voice input.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android, sampleRate: 16000, numberOfChannels: 1 },
        ios: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios, sampleRate: 16000, numberOfChannels: 1 },
      });
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setElapsedSeconds(0);

      intervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
      autoStopRef.current = setTimeout(() => stopAndTranscribe(), MAX_RECORDING_SECONDS * 1000);
    } catch {
      setIsRecording(false);
      clearTimers();
      Alert.alert('Could not start recording. Please try again.');
    }
  }, [stopAndTranscribe]);

  const cancelRecording = useCallback(() => {
    const recording = recordingRef.current;
    clearTimers();
    setIsRecording(false);
    setElapsedSeconds(0);
    recordingRef.current = null;
    if (recording) recording.stopAndUnloadAsync().catch(() => {});
  }, []);

  return { isRecording, isTranscribing, elapsedSeconds, permissionStatus, startRecording, stopAndTranscribe, cancelRecording };
}
