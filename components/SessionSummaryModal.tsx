import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration, formatVolume, formatWeightLabel } from '../utils/format';
import type { SessionSummary } from '../utils/sessionSummary';

interface SessionSummaryModalProps {
  title: string;
  summary: SessionSummary;
  onDone: () => void;
}

export function SessionSummaryModal({
  title,
  summary,
  onDone,
}: SessionSummaryModalProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={require('../logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Session complete</Text>
          <Text style={styles.sessionName}>{title}</Text>

          <Text style={styles.volume}>{formatVolume(summary.workingVolume)} lbs</Text>
          <Text style={styles.volumeLabel}>total volume</Text>
          <Text style={styles.counts}>
            {summary.workingRepCount} reps · {summary.workingSetCount} sets
          </Text>
          {summary.warmupVolume > 0 ? (
            <Text style={styles.footnote}>
              + {formatVolume(summary.warmupVolume)} lbs warmup
            </Text>
          ) : null}

          <View style={styles.divider} />

          {summary.durationMs !== null ? (
            <Text style={styles.detailRow}>
              ⏱ {formatDuration(summary.durationMs)} active
            </Text>
          ) : null}
          {summary.heaviestSet ? (
            <Text style={styles.detailRow}>
              Heaviest: {formatWeightLabel(summary.heaviestSet.weight)} ×{' '}
              {summary.heaviestSet.reps}
            </Text>
          ) : null}
          {summary.bestE1rm !== null ? (
            <Text style={styles.detailRow}>
              Best e1RM: {formatVolume(summary.bestE1rm)} lbs
            </Text>
          ) : null}
          {summary.hasPriors ? (
            <Text style={styles.prRow}>
              {summary.prCount > 0
                ? `⭐ ${summary.prCount} PR${summary.prCount === 1 ? '' : 's'} set`
                : 'No PRs this time'}
            </Text>
          ) : null}

          <Text style={styles.equivalence}>{summary.equivalenceText}</Text>

          <Pressable style={styles.doneBtn} onPress={onDone}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '88%',
    alignItems: 'center',
  },
  logo: { width: 100, height: 55, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  sessionName: { fontSize: 14, color: '#666', marginTop: 2 },
  volume: { fontSize: 34, fontWeight: '700', marginTop: 16 },
  volumeLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase' },
  counts: { fontSize: 15, color: '#333', marginTop: 4, fontWeight: '500' },
  footnote: { fontSize: 12, color: '#999', marginTop: 2 },
  divider: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginVertical: 14,
  },
  detailRow: { fontSize: 14, color: '#444', paddingVertical: 2 },
  prRow: { fontSize: 14, color: '#b8860b', fontWeight: '600', paddingVertical: 2 },
  equivalence: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  doneBtn: {
    backgroundColor: '#1aa260',
    borderRadius: 6,
    paddingHorizontal: 40,
    paddingVertical: 12,
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
