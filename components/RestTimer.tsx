import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, type } from '../constants/theme';
import { formatStopwatch } from '../utils/format';

interface RestTimerProps {
  anchorTs: number;
}

function RestTimerBase({ anchorTs }: RestTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [anchorTs]);

  return (
    <Text style={styles.text} pointerEvents="none">
      {formatStopwatch(now - anchorTs)}
    </Text>
  );
}

export const RestTimer = React.memo(RestTimerBase);

const styles = StyleSheet.create({
  text: {
    ...type.stat,
    color: colors.inkSoft,
    marginLeft: 8,
  },
});
