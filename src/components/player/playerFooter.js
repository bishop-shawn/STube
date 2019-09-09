// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Slider from '../slider';
import { fitSize, secondToString } from '../../util/baseUtil';
import DeviceInfo from '../../util/deviceInfo';
import Button, { ButtonType } from '../button';
import { STYLE_CONSTANT } from '../../constant';
import CacheTrack from './cacheTrack';

const navigationBarHeight = DeviceInfo.getNavigationBarHeight();

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    height: fitSize(30),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: fitSize(5),
  },
  currentTimeSliderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  timeMsg: {
    color: 'white',
    fontSize: fitSize(10),
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  thumbStyle: {
    width: fitSize(10),
    height: fitSize(10),
    backgroundColor: STYLE_CONSTANT.themeColor,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
});

type Props = {
  isPortraitFullScreen: boolean,
  width: number,
  paused: boolean,
  isLandscapeFullScreen: boolean,
  currentTime: number,
  duration: number,
  readPosition: Number,
  updatePauseStatus: Function,
  fullScreenShow: Function,
  seekTime: Function,
  showPlaylist: Function,
  showDetail: Function,
};

export default class PlayerFooter extends Component<Props> {
  _getPaddingHorizontal = () => {
    if (this.props.isPortraitFullScreen && DeviceInfo.getNotchHeight() > 0) {
      return fitSize(8);
    }
    return fitSize(5);
  };

  _seekTime = (value: number) => {
    this.props.showDetail();
    this.props.seekTime(value * this.props.duration);
  };

  _renderActionButton = () => {
    const { paused, updatePauseStatus, showDetail } = this.props;
    const paddingLeft = this._getPaddingHorizontal();
    return (
      <Button
        icon={{ name: paused ? 'play' : 'pause', color: 'white', size: fitSize(16) }}
        type={ButtonType.clear}
        onPress={() => {
          updatePauseStatus();
          showDetail();
        }}
        containerStyle={{ paddingLeft }}
      />
    );
  };

  _renderProgress = () => {
    const { currentTime, duration, readPosition } = this.props;
    const timeProgress = currentTime / duration < 1 ? currentTime / duration : 1;
    return (
      <View style={styles.progressContainer}>
        <CacheTrack wrapperStyle={{ flex: 1 }} ranges={[[0, readPosition / duration]]} trackHeight={fitSize(2)} trackColor="rgb(102, 102, 102)" rangeColor="rgb(204, 204, 204)" />
        <Slider
          style={styles.currentTimeSliderContainer}
          minimumValue={0}
          maximumValue={1}
          value={timeProgress}
          onValueChange={this._seekTime}
          minimumTrackTintColor={STYLE_CONSTANT.themeColor}
          thumbStyle={styles.thumbStyle}
          maximumTrackTintColor="transparent"
          trackStyle={{ height: fitSize(2) }}
        />
      </View>
    );
  };

  _renderRightComponent = () => {
    const { isLandscapeFullScreen, fullScreenShow, showPlaylist, showDetail, isPortraitFullScreen } = this.props;
    if (isPortraitFullScreen) {
      return null;
    }
    const paddingRight = this._getPaddingHorizontal();
    return isLandscapeFullScreen ? (
      <Button
        title="播放列表"
        type={ButtonType.clear}
        onPress={() => {
          showPlaylist();
        }}
        color="white"
        containerStyle={{ paddingRight }}
      />
    ) : (
      <Button
        icon={{ name: 'full_screen', color: 'white', size: fitSize(16) }}
        type={ButtonType.clear}
        onPress={() => {
          fullScreenShow();
          showDetail();
        }}
        containerStyle={{ paddingRight }}
      />
    );
  };

  render() {
    const { currentTime, width, duration, showDetail, isLandscapeFullScreen } = this.props;
    const paddingHorizontal = isLandscapeFullScreen ? navigationBarHeight : 0;
    const fontSize = isLandscapeFullScreen ? fitSize(12) : fitSize(9);
    const timeTextWidth = isLandscapeFullScreen ? fitSize(58) : fitSize(40);
    return (
      <TouchableWithoutFeedback onPress={showDetail}>
        <View style={[styles.footerContainer, { width, paddingHorizontal }]}>
          {this._renderActionButton()}
          <Text style={[styles.timeMsg, { fontSize, width: timeTextWidth }]}>{secondToString(currentTime)}</Text>
          {this._renderProgress()}
          <Text style={[styles.timeMsg, { fontSize, width: timeTextWidth }]}>{secondToString(duration)}</Text>
          {this._renderRightComponent()}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
