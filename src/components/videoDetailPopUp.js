// @flow
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Video from '../model/video';
import PopUpContainer from './popUpContainer';
import { fitSize, toReadableSize } from '../util/baseUtil';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT } from '../constant';

const styles = StyleSheet.create({
  name: {
    fontSize: fitSize(15),
    lineHeight: fitSize(18),
    color: STYLE_CONSTANT.fontBlackColor,
    width: '100%',
    padding: fitSize(20),
    paddingBottom: 0,
  },
  size: {
    width: '100%',
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontGrayColor,
    paddingLeft: fitSize(20),
    marginTop: fitSize(10),
    marginBottom: fitSize(15),
  },
  footerContainer: {
    flexDirection: 'row',
    height: fitSize(50),
  },
  rightContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
    borderRadius: 0,
  },
  leftContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
    borderRadius: 0,
  },
  buttonTitle: {
    fontSize: fitSize(16),
  },
});

type Props = {
  video: Video,
  onClose: Function,
  onWatch: Function,
  onDownload: Function,
  confirmWatching: boolean,
};

const VideoDetailPopUp = (props: Props) => {
  const { video, onClose, onWatch, onDownload, confirmWatching } = props;
  const { name, size } = video;
  return (
    <PopUpContainer onClose={onClose}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.size}>{`大小：${toReadableSize(size)}`}</Text>
      <View style={styles.footerContainer}>
        <Button type={ButtonType.clear} containerStyle={styles.rightContainer} titleStyle={[styles.buttonTitle, { color: STYLE_CONSTANT.fontBlackColor }]} title="下载" onPress={onDownload} />
        <Button type={ButtonType.clear} containerStyle={styles.leftContainer} titleStyle={styles.buttonTitle} title="播放" onPress={onWatch} loading={confirmWatching} />
      </View>
    </PopUpContainer>
  );
};

export default VideoDetailPopUp;
