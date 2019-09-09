// @flow
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { STYLE_CONSTANT } from '../../constant';
import { fitSize, toReadableSize } from '../../util/baseUtil';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: STYLE_CONSTANT.screenWidth,
    height: fitSize(10),
  },
  storageTitle: {
    height: fitSize(10),
    fontSize: fitSize(8),
    color: 'white',
  },
});

type Props = {
  usedStorage: number,
  avalibleStorage: number,
};

const DownloadFooter = (props: Props) => {
  const { usedStorage, avalibleStorage } = props;
  const totalStorage = avalibleStorage + usedStorage;
  const usedStorageStyle = {
    backgroundColor: STYLE_CONSTANT.themeColor,
    width: STYLE_CONSTANT.screenWidth * (usedStorage / totalStorage),
  };
  const avalibleStorageStyle = {
    backgroundColor: 'gray',
    width: (STYLE_CONSTANT.screenWidth * avalibleStorage) / totalStorage,
  };
  return (
    <View style={styles.container}>
      <View style={usedStorageStyle} />
      <View style={avalibleStorageStyle} />
      <Text
        style={[
          styles.storageTitle,
          {
            position: 'absolute',
            left: 10,
          },
        ]}
      >
        {`已用空间${toReadableSize(usedStorage)}`}
      </Text>
      <Text
        style={[
          styles.storageTitle,
          {
            position: 'absolute',
            right: 10,
          },
        ]}
      >
        {`剩余空间${toReadableSize(avalibleStorage)}`}
      </Text>
    </View>
  );
};
export default DownloadFooter;
