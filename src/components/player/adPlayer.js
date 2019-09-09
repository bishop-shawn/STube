// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableWithoutFeedback, Linking } from 'react-native';
import Video from '../aplayer';
import { fitSize } from '../../util/baseUtil';
import DeviceInfo from '../../util/deviceInfo';
import configService from '../../service/configService';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'black',
  },
  leftTime: {
    position: 'absolute',
    zIndex: 2,
    width: fitSize(60),
    height: fitSize(30),
    fontSize: fitSize(14),
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    color: 'white',
    borderRadius: fitSize(15),
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
});

type Props = {
  onPlayEnd: Function,
  containerHeight: number,
  containerWidth: number,
  isLandscapeFullScreen: boolean,
  forcePause: boolean,
};

type State = {
  leftTime: number,
};

export default class AdPlayer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this._adPath = configService.getConfigSync().videoPath;
    this._adLink = '';
    this.state = {
      leftTime: -1,
    };
  }

  componentDidMount() {
    configService.getConfig().then(config => {
      this._adLink = config.adVideoLink;
    });
  }

  _openOutLink = () => {
    if (this._adLink) {
      Linking.openURL(this._adLink);
    }
  };

  _onLoaded = ({ duration }) => {
    this._duration = duration;
    this.setState({ leftTime: Math.floor(duration) });
  };

  _updateLeftTime = ({ currentTime }) => {
    if (currentTime >= 0) {
      this.setState({ leftTime: Math.floor(this._duration - currentTime) });
    }
  };

  _renderHeader = () => {
    const { leftTime } = this.state;
    const { isLandscapeFullScreen, forcePause } = this.props;
    const notchHeight = DeviceInfo.getNotchHeight();
    const top = isLandscapeFullScreen || notchHeight > 0 ? fitSize(5) : StatusBar.currentHeight;
    const right = isLandscapeFullScreen && notchHeight > 0 ? fitSize(6) : 0;
    return !forcePause && leftTime >= 0 && <Text style={[styles.leftTime, { top, right }]}>{`广告 ${leftTime}`}</Text>;
  };

  render() {
    const { containerHeight, containerWidth, onPlayEnd, forcePause } = this.props;
    return (
      <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
        {this._renderHeader()}
        <TouchableWithoutFeedback
          onPress={() => {
            this._openOutLink();
          }}
        >
          <Video
            source={{ uri: this._adPath }}
            style={{ flex: 1 }}
            resizeMode="contain"
            ignoreSilentSwitch="ignore"
            onEnd={onPlayEnd}
            onError={(error) => {
              // eslint-disable-next-line no-undef
              console.log('adPlayer load error:', error);
              configService.reset();
              onPlayEnd();
            }}
            playInBackground={false}
            fullscreen={false}
            onLoad={this._onLoaded}
            onProgress={this._updateLeftTime}
            paused={forcePause}
          />
        </TouchableWithoutFeedback>
      </View>
    );
  }
}
