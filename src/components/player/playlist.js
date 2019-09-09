// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableHighlight, FlatList } from 'react-native';
import { STYLE_CONSTANT } from '../../constant';
import { fitSize, toReadableSize } from '../../util/baseUtil';
import DeviceInfo from '../../util/deviceInfo';

const navigationBarHeight = DeviceInfo.getNavigationBarHeight();
const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'flex-end',
    position: 'absolute',
    top: 0,
    left: 0,
    width: STYLE_CONSTANT.screenHeight + navigationBarHeight,
    height: STYLE_CONSTANT.screenWidth,
  },
  listContainer: {
    height: STYLE_CONSTANT.screenWidth,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  header: {
    fontSize: fitSize(14),
    color: 'white',
    marginTop: fitSize(20),
    marginBottom: fitSize(10),
    paddingHorizontal: fitSize(15),
  },
  listItem: {
    width: fitSize(280),
    height: fitSize(80),
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderColor: STYLE_CONSTANT.fontGrayColor,
    paddingHorizontal: fitSize(15),
  },
  name: {
    fontSize: fitSize(13),
    color: 'white',
  },
  size: {
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontGrayColor,
  },
});

type Props = {
  onClose: Function,
  videoList: Object[],
  playingVideo: Object,
  onSwitchVideo: Function,
};

export default class Playlist extends Component<Props> {
  _onItemPressed = (video: Object) => {
    this.props.onSwitchVideo(video);
    this.props.onClose();
  };

  _renderHeader = () => <Text style={styles.header}>播放列表</Text>;

  _renderListItem = (data: Object) => {
    const videoItem = data.item;
    let fontColor = {};
    if (this.props.playingVideo.index === videoItem.index) {
      fontColor = { color: STYLE_CONSTANT.themeColor };
    }
    return (
      <TouchableHighlight
        underlayColor={STYLE_CONSTANT.checkedColor}
        onPress={() => {
          this._onItemPressed(videoItem);
        }}
      >
        <View style={styles.listItem}>
          <Text style={[styles.name, fontColor]} numberOfLines={2}>
            {videoItem.name}
          </Text>
          <Text style={styles.size}>{`大小：${toReadableSize(videoItem.fileSize)}`}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  render() {
    const { onClose, videoList } = this.props;
    return (
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.background}>
          <View onStartShouldSetResponder={() => true}>
            <FlatList style={styles.listContainer} ListHeaderComponent={this._renderHeader} data={videoList} renderItem={this._renderListItem} keyExtractor={item => item.id} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
