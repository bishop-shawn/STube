// @flow
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STYLE_CONSTANT } from '../../constant';
import { fitSize } from '../../util/baseUtil';
import PopUpContainer from '../popUpContainer';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: fitSize(15),
    overflow: 'hidden',
  },
  title: {
    width: '100%',
    fontSize: fitSize(16),
    fontWeight: '600',
    paddingVertical: fitSize(10),
    color: STYLE_CONSTANT.fontBlackColor,
    textAlign: 'center',
    backgroundColor: '#f5f4f9',
  },
  body: {
    width: '100%',
    paddingHorizontal: fitSize(15),
    paddingVertical: fitSize(20),
  },
  progressText: {
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: STYLE_CONSTANT.fontGrayColor,
    marginVertical: fitSize(20),
  },
  progress: {
    height: 4,
    backgroundColor: STYLE_CONSTANT.themeColor,
  },
  tip: {
    width: '100%',
    textAlign: 'center',
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontGrayColor,
  },
});

type Props = {
  progress?: Number, // between 0 and 1
  onClose?: Function,
};

const UpdatingModal = (props: Props) => {
  const present = `${Math.floor(props.progress * 100)}%`;
  return (
    <PopUpContainer containerStyle={styles.container} onClose={props.onClose} closeOnClickModal={false}>
      <Text style={styles.title}>正在下载新版本</Text>
      <View style={styles.body}>
        <Text style={styles.progressText}>{`下载进度: ${present}`}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progress, {
            width: present,
          }]}
          />
        </View>
        <Text style={styles.tip}>请耐心等待下载成功完成升级</Text>
      </View>
    </PopUpContainer>
  );
};

UpdatingModal.defaultProps = {
  onClose: () => {},
};

UpdatingModal.defaultProps = {
  progress: 0.5,
};

export default UpdatingModal;
