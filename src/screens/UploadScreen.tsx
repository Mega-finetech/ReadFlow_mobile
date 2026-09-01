import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CheckCircle2, FileText, UploadCloud, XCircle } from 'lucide-react-native';
import { MainTabParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { uploadDocument } from '../api/documents';

type Props = BottomTabScreenProps<MainTabParamList, 'Upload'>;

type Phase = 'idle' | 'picked' | 'uploading' | 'success' | 'error';

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export function UploadScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const simulateProgress = () => {
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 12;
        return next >= 90 ? 90 : next;
      });
    }, 250);
  };

  const pick = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/epub+zip',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? '' });
      setProgress(0);
      setPhase('picked');
    } catch {
      setError('Could not open the file picker.');
    }
  };

  const startUpload = async () => {
    if (!file || phase === 'uploading') return;

    setPhase('uploading');
    setError(null);
    simulateProgress();

    try {
      await uploadDocument({ uri: file.uri, name: file.name, type: file.mimeType });
      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgress(100);
      setPhase('success');
    } catch (err) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const reset = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    setPhase('idle');
  };

  const showSuccessOptions = () => {
    Alert.alert('Document uploaded', `"${file?.name}" is ready.`, [
      { text: 'Done', style: 'cancel', onPress: reset },
      {
        text: 'Go to library',
        onPress: () => {
          reset();
          navigation.navigate('Library');
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[typography.title, { color: colors.onSurface }]}>Upload</Text>
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          Add a PDF, DOCX, TXT, or EPUB
        </Text>
      </View>

      <View style={styles.body}>
        <Pressable
          onPress={phase === 'uploading' ? undefined : pick}
          disabled={phase === 'uploading'}
          style={({ pressed }) => [
            styles.drop,
            {
              backgroundColor: colors.surface,
              borderColor: phase === 'error' ? colors.error : colors.outline,
              borderRadius: radius.xl,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
            <UploadCloud size={28} color={colors.primary} />
          </View>
          <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.lg }]}>
            Choose a document
          </Text>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' }]}>
            We'll extract the text and split it into chapters.
          </Text>
        </Pressable>

        {phase !== 'idle' && file && (
          <View
            style={[
              styles.fileCard,
              { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg },
            ]}
          >
            <View style={styles.fileIcon}>
              <FileText size={20} color={colors.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.onSurface }]}>
                {file.name}
              </Text>
              <View style={{ height: 20 }}>
                {phase === 'uploading' ? (
                  <ProgressBar progress={progress} height={5} style={{ marginTop: 8 }} />
                ) : phase === 'success' ? (
                  <Text style={[typography.caption, { color: colors.accent }]}>Upload complete</Text>
                ) : phase === 'error' ? (
                  <Text style={[typography.caption, { color: colors.error }]}>Upload failed</Text>
                ) : (
                  <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                    {Math.round(progress)}% ready to upload
                  </Text>
                )}
              </View>
            </View>
            {phase === 'success' ? (
              <CheckCircle2 size={22} color={colors.accent} />
            ) : phase === 'error' ? (
              <XCircle size={22} color={colors.error} />
            ) : null}
          </View>
        )}

        {error ? (
          <Text style={[typography.caption, { color: colors.error, marginTop: spacing.md }]}>
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {phase !== 'idle' && phase !== 'uploading' && (
            <Button title="Choose another" variant="ghost" onPress={reset} style={{ marginBottom: spacing.md }} />
          )}

          {(phase === 'picked' || phase === 'error') && file && (
            <Button title="Upload document" onPress={startUpload} />
          )}

          {phase === 'success' && (
            <Button title="Done" onPress={showSuccessOptions} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  drop: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  actions: {
    marginTop: 24,
  },
});
