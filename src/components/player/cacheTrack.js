// @flow
import React from 'react';
import { View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: 2,
  },
  range: {
    position: 'absolute',
    height: '100%',
    top: 0,
  },
});

type Props = {
  ranges: Array,
  trackHeight: Number,
  trackColor: String,
  rangeColor: String,
  wrapperStyle: Object,
};

const CacheTrack = (props: Props) => {
  const { ranges, trackHeight, trackColor, rangeColor, wrapperStyle } = props;
  const percentRanges = [];
  ranges.forEach(item => {
    const start = item[0] * 100;
    const length = item[1] * 100;
    // if length < 0.1% ignore.
    if (length > 0.1) {
      percentRanges.push([start, length]);
    }
  });
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <View style={[styles.container, { backgroundColor: trackColor, height: trackHeight }]}>
        {percentRanges.map((item, index) => {
          return (
            <View
              key={index.toString()}
              style={[
                styles.range,
                {
                  backgroundColor: rangeColor,
                  left: `${item[0].toFixed(1)}%`,
                  width: `${item[1].toFixed(1)}%`,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

export default CacheTrack;
