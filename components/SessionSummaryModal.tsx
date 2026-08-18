import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from './LogoMark';
import { colors, type } from '../constants/theme';
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
          <LogoMark size={120} />
          <View style={styles.stamp}>
            <Text style={styles.stampText}>Session complete</Text>
          </View>
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
                ? `✦ ${summary.prCount} PR${summary.prCount === 1 ? '' : 's'} set`
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    padding: 24,
    width: '88%',
    alignItems: 'center',
  },
  stamp: {
    borderWidth: 1.5,
    borderColor: colors.verdigris,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 12,
    marginBottom: 6,
  },
  stampText: {
    color: colors.verdigris,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  sessionName: { fontSize: 14, color: colors.inkSoft, marginTop: 2 },
  volume: {
    ...type.display,
    fontSize: 34,
    fontWeight: '700',
    marginTop: 16,
    color: colors.ink,
  },
  volumeLabel: { fontSize: 12, color: colors.textTertiary, textTransform: 'uppercase' },
  counts: { ...type.tabular, fontSize: 15, color: colors.inkFaint, marginTop: 4, fontWeight: '500' },
  footnote: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  divider: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginVertical: 14,
  },
  detailRow: { fontSize: 14, color: colors.inkFaint, paddingVertical: 2 },
  prRow: { ...type.tabular, fontSize: 14, color: colors.brass, fontWeight: '600', paddingVertical: 2 },
  equivalence: {
    fontSize: 13,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 10,
  },
  doneBtn: {
    backgroundColor: colors.verdigris,
    borderRadius: 6,
    paddingHorizontal: 40,
    paddingVertical: 12,
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  doneBtnText: { color: colors.paper, fontWeight: '700', fontSize: 16 },
});
