// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, PanResponder, Image, ActivityIndicator, BackHandler, StatusBar } from 'react-native';
import { connect } from 'react-redux';
import SystemSetting from 'react-native-system-setting';
import Orientation from 'react-native-orientation';
import { STYLE_CONSTANT, CONNECTION_STATUS, IS_IOS, ORIENTATION_STATUS } from '../../constant';
import storageService from '../../service/storageService';
import Loading from '../loading';
import { fitSize, secondToString, toReadableSize } from '../../util/baseUtil';
import DeviceInfo from '../../util/deviceInfo';
import Button, { ButtonType } from '../button';
import PlayerFooter from './playerFooter';
import Playlist from './playlist';
import Video from '../aplayer';
import AdPlayer from './adPlayer';

const { screenHeight, screenWidth } = STYLE_CONSTANT;
const navigationBarHeight = DeviceInfo.getNavigationBarHeight();
const isShowNavigationBar = DeviceInfo.isShowNavigationBar();
const notchHeight = DeviceInfo.getNotchHeight();
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fitSize(16),
    color: 'white',
  },
  guideContainer: {
    width: isShowNavigationBar ? screenHeight + navigationBarHeight : screenHeight,
    height: STYLE_CONSTANT.screenWidth,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doubleClick: {
    width: fitSize(76),
    height: fitSize(48),
  },
  brightnessAndVolumnContainer: {
    width: STYLE_CONSTANT.screenHeight,
    paddingHorizontal: fitSize(42),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brightnessAndVolumn: {
    width: fitSize(55),
    height: fitSize(120),
  },
  backForward: {
    width: fitSize(130),
    height: fitSize(64),
  },
  netStatusButtonContainer: {
    width: '32%',
    height: fitSize(25),
  },
  statusMsg: {
    fontSize: fitSize(12),
    color: '#ffffff',
  },
  maskContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContainer: {
    width: fitSize(100),
    height: fitSize(80),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: fitSize(5),
  },
  progressIcon: {
    width: fitSize(30),
    height: fitSize(30),
  },
  progressMsg: {
    fontSize: fitSize(10),
    color: '#ffffff',
    marginTop: fitSize(5),
  },
  progressContainer: {
    height: fitSize(3),
    borderRadius: fitSize(2.5),
    width: fitSize(80),
    backgroundColor: 'gray',
  },
  progress: {
    height: fitSize(3),
    borderRadius: fitSize(2.5),
    backgroundColor: STYLE_CONSTANT.themeColor,
  },
  playButtonContainer: {
    width: fitSize(50),
    height: fitSize(50),
    borderRadius: fitSize(25),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});

type Props = {
  navigation: Object,
  connectionType: String,
  dispatch: Function,
  onLoad: Function,
  onError: Function,
  initPause: Boolean,
  url: String,
  videoList: Object[],
  onSwitchVideo: Function,
  playingVideo: Object,
  onPlayerSizeChange: Function,
  onFinished: Function,
  loadData: Function,
  loadEnd: Boolean,
  stopLoadData: Function,
  loadUrl: Function,
  startPlayTime: Number,
  speed: Number,
};
type State = {
  showCellular: Boolean,
  containerHeight: Number,
  containerWidth: Number,
  isLandscapeFullScreen: Boolean,
  paused: Boolean,
  isBuffering: Boolean,
  loadError: Boolean,
  showBrightness: Boolean,
  showVolume: Boolean,
  progressValue: Number,
  currentTime: Number,
  duration: Number,
  showVideoSeek: Boolean,
  reload: Boolean,
  showPlaylist: Boolean,
  showDetail: Boolean,
  adPlayEnd: Boolean,
  hasShowGuide: Boolean,
  canPlayOnCelluar: Boolean,
  showNetError: Boolean,
  readPosition: Number,
};

class Player extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showCellular: false,
      containerWidth: screenWidth,
      containerHeight: (screenWidth * 9) / 16,
      isLandscapeFullScreen: false,
      paused: props.initPause,
      isBuffering: !props.initPause,
      loadError: false,
      showBrightness: false,
      showVolume: false,
      progressValue: 0,
      currentTime: 0,
      duration: 0,
      showVideoSeek: false,
      reload: true,
      showPlaylist: false,
      showDetail: true,
      adPlayEnd: false,
      hasShowGuide: true,
      canPlayOnCelluar: false,
      showNetError: false,
      readPosition: 0,
    };
    this._touchEnd = false;
    this._lastTap = 0;
    this._maxSeekTime = 0;
  }

  componentDidMount() {
    Orientation.unlockAllOrientations();
    Orientation.addOrientationListener(this._orientationDidChange);

    storageService.getShowGuide().then(hasShowGuide => {
      this.setState({ hasShowGuide });
    });

    if (!IS_IOS) {
      BackHandler.addEventListener('hardwareBackPress', this._onBackPressed);
    }

    this._gestureHander = PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        this._moveStartTime = this.state.currentTime;
        this._preMoveTime = this.state.currentTime;
        clearTimeout(this._progressTimer);
      },
      onPanResponderMove: this._handleMove,
      onPanResponderRelease: this._handleRelease, // for press event
    });

    SystemSetting.getAppBrightness().then(brightness => {
      // this._originBrightness = brightness;
      this._lastBrightness = brightness;
    });
    SystemSetting.getVolume().then(volume => {
      this._lastVolume = volume;
    });
  }

  static getDerivedStateFromProps(props, state) {
    const { loadError, canPlayOnCelluar, adPlayEnd } = state;
    const { loadEnd, connectionType } = props;
    const showNetError = (connectionType === CONNECTION_STATUS.none || connectionType === CONNECTION_STATUS.unknown) && loadError;
    const showCellular = !canPlayOnCelluar && !loadEnd && connectionType === CONNECTION_STATUS.cellular;
    const derivedState = { showCellular, showNetError, adPlayEnd: loadEnd || adPlayEnd };
    return derivedState;
  }

  componentDidUpdate(prevProps, preState) {
    const badNet = [CONNECTION_STATUS.none, CONNECTION_STATUS.unknown];
    const reloadAfterNetWorkChange = badNet.indexOf(prevProps.connectionType) > -1 && badNet.indexOf(this.props.connectionType) === -1 && this.state.loadError;
    const reloadAfterUrlChange = prevProps.url !== this.props.url;
    if (!this.state.showCellular && (reloadAfterNetWorkChange || reloadAfterUrlChange)) {
      if (reloadAfterUrlChange) {
        this.setState({ currentTime: this.props.startPlayTime });
      }
      this.reload();
    }
    if (!preState.showCellular && this.state.showCellular) {
      this.props.stopLoadData();
    }
  }

  componentWillUnmount() {
    this.props.onFinished();
    if (!IS_IOS) {
      BackHandler.removeEventListener('hardwareBackPress', this._onBackPressed);
    }
    SystemSetting.setAppBrightness(-1);
    clearTimeout(this._progressTimer);
    clearTimeout(this._hideDetailTimer);
    clearTimeout(this._reloadTimer);
    Orientation.removeOrientationListener(this._orientationDidChange);
    Orientation.lockToPortrait();
  }

  _onBackPressed = () => {
    if (!this.props.navigation.isFocused()) {
      this.props.navigation.pop();
      return true;
    }
    const { isLandscapeFullScreen, containerHeight, containerWidth } = this.state;
    if (isLandscapeFullScreen || containerHeight > containerWidth) {
      this._normalScreenShow();
      if (isLandscapeFullScreen) {
        Orientation.lockToPortrait();
        this._unlockTimer = setTimeout(() => {
          Orientation.unlockAllOrientations();
        }, 3000);
      }
      return true;
    }
    clearTimeout(this._unlockTimer);
    this.props.navigation.goBack();
    return true;
  };

  _orientationDidChange = (orientation: String) => {
    let containerHeight = (screenWidth * 9) / 16;
    let containerWidth = screenWidth;
    console.log('_orientationDidChange', orientation);
    if (orientation === ORIENTATION_STATUS.LANDSCAPE) {
      StatusBar.setHidden(true);
      containerHeight = screenWidth;
      containerWidth = isShowNavigationBar ? screenHeight + navigationBarHeight : screenHeight;
      this.setState({ isLandscapeFullScreen: true });
      this.props.onPlayerSizeChange({ isLandscapeFullScreen: true });
    } else {
      StatusBar.setHidden(false);
      if (!IS_IOS) {
        StatusBar.setTranslucent(true);
      }
      this.setState({ isLandscapeFullScreen: false });
      this.props.onPlayerSizeChange({ isLandscapeFullScreen: false });
    }
    this.setState({ containerWidth, containerHeight });
  };

  _normalScreenShow = () => {
    const containerHeight = (screenWidth * 9) / 16;
    const containerWidth = screenWidth;
    this.props.onPlayerSizeChange({ isLandscapeFullScreen: false });
    this.setState({
      isLandscapeFullScreen: false,
      containerHeight,
      containerWidth,
    });
  };

  _fullScreenShow = () => {
    if (this._isPortrait) {
      const containerWidth = screenWidth;
      const containerHeight = screenHeight;
      this.setState({ containerHeight, containerWidth });
      this.props.onPlayerSizeChange({ isPortraitFullScreen: true });
    } else {
      Orientation.lockToLandscape();
    }
  };

  _handleMove = (event, gestureState) => {
    const { loadError, showVideoSeek, showBrightness, showVolume, containerHeight, containerWidth } = this.state;
    if (loadError) {
      return;
    }
    const { x0, dx, dy, y0 } = gestureState;
    if (x0 < containerWidth * 0.05 || x0 > containerWidth * 0.95 || (Math.abs(dx) < containerWidth * 0.03 && Math.abs(dy) < containerHeight * 0.03)) {
      return;
    }
    if (showVideoSeek && !this._touchEnd) {
      this._updateVideoProgress(dx, containerWidth);
      return;
    }
    if (showBrightness && !this._touchEnd) {
      this._updateBrightness(dy, containerHeight);
      return;
    }
    if (showVolume && !this._touchEnd) {
      this._updateVolume(dy, containerHeight);
      return;
    }
    this._touchEnd = false;
    const isHorizontal = Math.abs(dx) / (Math.abs(dy) + 0.001) > 2; // prevent dy===0
    if (isHorizontal && y0 < containerHeight * 0.85) {
      this._updateVideoProgress(dx, containerWidth);
    } else if (x0 < containerWidth * 0.5) {
      this._updateBrightness(dy, containerHeight);
    } else {
      this._updateVolume(dy, containerHeight);
    }
  };

  _updateVideoProgress = (dx: Number, containerWidth: Number) => {
    const { duration } = this.state;
    let newTime = this._moveStartTime + (dx / containerWidth / 0.9) * this._maxSeekTime;
    newTime = newTime > duration ? duration : newTime;
    newTime = newTime < 0 ? 0 : newTime;
    // consider don't change arrow direction while newTime === this._preMoveTime
    if (newTime > this._preMoveTime) {
      this._forward = true;
    } else if (newTime < this._preMoveTime) {
      this._forward = false;
    }
    this._preMoveTime = newTime;
    this._seekTime(newTime);
    this.setState({ showDetail: true, paused: true, showVideoSeek: true, currentTime: newTime, showBrightness: false, showVolume: false });
  };

  _updateBrightness = (dy: Number, containerHeight: Number) => {
    let newBrightness = this._lastBrightness - dy / containerHeight;
    if (newBrightness > 1) {
      newBrightness = 1;
    }
    if (newBrightness < 0) {
      newBrightness = 0;
    }
    SystemSetting.setAppBrightness(newBrightness);
    this.setState({ showBrightness: true, showVolume: false, showVideoSeek: false, progressValue: newBrightness });
  };

  _updateVolume = (dy: Number, containerHeight: Number) => {
    let newVolume = this._lastVolume - dy / containerHeight;
    if (newVolume > 1) {
      newVolume = 1;
    }
    if (newVolume < 0) {
      newVolume = 0;
    }
    SystemSetting.setVolume(newVolume);
    this.setState({ showVolume: true, showBrightness: false, showVideoSeek: false, progressValue: newVolume });
  };

  _handleRelease = (evt, gestureState) => {
    this._touchEnd = true;
    console.log('player, handleRelease:', JSON.stringify(gestureState));
    const { dy, dx } = gestureState;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      this._onVideoPressed();
    }
    this._hideDragProgress();
    this._recordBrightnessVolume(gestureState);
  };

  _hideDragProgress = () => {
    if (this.state.showBrightness) {
      this._progressTimer = setTimeout(() => {
        this.setState({ showBrightness: false });
      }, 2000);
    } else if (this.state.showVolume) {
      this._progressTimer = setTimeout(() => {
        this.setState({ showVolume: false });
      }, 2000);
    } else if (this.state.showVideoSeek) {
      this._progressTimer = setTimeout(() => {
        this.setState({ showVideoSeek: false, paused: false, showDetail: false });
      }, 500);
    }
  };

  _recordBrightnessVolume = gestureState => {
    const { containerWidth } = this.state;
    const { x0 } = gestureState;
    if (x0 < containerWidth * 0.5) {
      SystemSetting.getAppBrightness().then(brightness => {
        this._lastBrightness = brightness;
      });
    } else {
      SystemSetting.getVolume().then(volume => {
        this._lastVolume = volume;
      });
    }
  };

  _showDetail = () => {
    this.setState({ showDetail: true });
    clearTimeout(this._hideDetailTimer);
    this._hideDetailTimer = setTimeout(() => {
      this.setState({ showDetail: false });
    }, 5000);
  };

  _seekTime = (time: Number) => {
    const { duration } = this.state;
    if (time >= duration && duration > 0) {
      console.log('player seekTime', time, duration);
      this._onPlayEnd();
      return;
    }
    if (this._video) {
      this._video.seek(time);
    }
  };

  _onPlayEnd = () => {
    if (this.props.videoList.length > 1) {
      const playingVideoIndex = this.props.videoList.indexOf(this.props.playingVideo);
      if (playingVideoIndex < this.props.videoList.length - 1) {
        this.props.onSwitchVideo(this.props.videoList[playingVideoIndex + 1]);
        return;
      }
    }
    this._seekTime(0);
    this.setState({ paused: true, currentTime: 0 });
  };

  _updatePauseStatus = () => {
    const { paused } = this.state;
    this.setState({ paused: !paused });
  };

  _onVideoPressed = () => {
    this._showDetail();
    const tapTime = new Date().valueOf();
    if (tapTime - this._lastTap < 300) {
      this._updatePauseStatus();
      this._lastTap = 0;
    } else {
      this._lastTap = tapTime;
    }
  };

  reload = () => {
    this.props.loadData();
    this.setState({ reload: true, isBuffering: true, loadError: false, paused: false, showNetError: false });
    this._reloadTimer = setTimeout(() => {
      this.setState({ reload: false });
    }, 1000);
    this._showDetail();
  };

  _onVideoLoaded = e => {
    this._isPortrait = e.naturalSize.orientation === 'portrait';
    const { duration } = e;
    if (duration > 120) {
      this._maxSeekTime = duration / 4;
    } else if (duration > 30) {
      this._maxSeekTime = 30;
    } else {
      this._maxSeekTime = duration;
    }
    this.setState({ duration }, () => {
      if (this.state.currentTime > 0) {
        this._seekTime(this.state.currentTime);
      }
    });
  };

  playOnCellular = async () => {
    this.setState({ paused: false, canPlayOnCelluar: true, showCellular: false });
    this.props.loadData();
    if (this.state.loadError) {
      this.reload();
    }
  };

  getCurrentTime = () => this.state.currentTime;

  _onPlayButtonPressed = () => {
    if (!this.props.url && this.props.loadUrl) {
      this.props.loadUrl();
    }
    this.setState({ paused: false });
  };

  _renderHeader = () => {
    const { isLandscapeFullScreen, showDetail, adPlayEnd, isBuffering, loadError, showCellular, paused } = this.state;
    const { playingVideo } = this.props;
    const top = isLandscapeFullScreen || notchHeight > 0 ? fitSize(5) : StatusBar.currentHeight;
    const left = isLandscapeFullScreen ? navigationBarHeight : 0;
    const title = playingVideo ? playingVideo.name : '';
    const showHeader = showDetail || isBuffering || loadError || showCellular || paused;
    return (
      showHeader && (
        <View style={[styles.header, { top, left }]}>
          <Button icon={{ name: 'back', size: fitSize(18), color: 'white' }} onPress={this._onBackPressed} type={ButtonType.clear} containerStyle={{ width: fitSize(30), height: fitSize(30) }} />
          {isLandscapeFullScreen && adPlayEnd && <Text style={styles.title}>{title}</Text>}
        </View>
      )
    );
  };

  _renderAdPlayer = () => {
    const { isLandscapeFullScreen, adPlayEnd, paused, containerHeight, containerWidth, showCellular, showNetError } = this.state;
    if (adPlayEnd || !this.props.playingVideo) {
      return null;
    }
    return (
      <AdPlayer
        forcePause={showCellular || showNetError || paused}
        containerHeight={containerHeight}
        containerWidth={containerWidth}
        onPlayEnd={() => {
          this.setState({ adPlayEnd: true });
        }}
        isLandscapeFullScreen={isLandscapeFullScreen}
      />
    );
  };

  _renderGuide = () => {
    const { showGuide, isLandscapeFullScreen } = this.state;
    const show = isLandscapeFullScreen && showGuide;
    if (show) {
      storageService.saveShowGuide();
      this._guideTimer = setTimeout(() => {
        this.setState({ showGuide: false });
      }, 6000);
      return (
        <View style={styles.guideContainer}>
          <Image style={styles.doubleClick} source={require('../../resource/double_click.png')} />
          <View style={styles.brightnessAndVolumnContainer}>
            <Image resizeMode="contain" style={styles.brightnessAndVolumn} source={require('../../resource/brightness.png')} />
            <Image resizeMode="contain" style={styles.brightnessAndVolumn} source={require('../../resource/volume.png')} />
          </View>
          <Image style={styles.backForward} source={require('../../resource/back_forward.png')} />
        </View>
      );
    }
    return null;
  };

  _renderCellular = () => {
    const { showCellular, containerWidth, containerHeight } = this.state;
    return (
      showCellular && (
        <View style={[styles.maskContainer, { height: containerHeight, width: containerWidth, backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <Text style={[styles.statusMsg, { marginBottom: fitSize(30) }]}>正在使用移动流量，播放将产生流量费用</Text>
          <Button type={ButtonType.outline} color="#ffffff" title="继续播放" containerStyle={styles.netStatusButtonContainer} onPress={this.playOnCellular} />
        </View>
      )
    );
  };

  _renderNetError = () => {
    const { showNetError, containerWidth, containerHeight } = this.state;
    return (
      showNetError && (
        <View style={[styles.maskContainer, { height: containerHeight, width: containerWidth, backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <Text style={[styles.statusMsg, { marginBottom: fitSize(30) }]}>网络未连接，请检查网络后重试</Text>
          <Button type={ButtonType.outline} color="#ffffff" title="点击重试" containerStyle={styles.netStatusButtonContainer} onPress={this.reload} />
        </View>
      )
    );
  };

  _renderUrlStatus = () => {
    const { containerHeight, containerWidth, showCellular, paused } = this.state;
    const { url } = this.props;
    if (!url && !showCellular && !paused) {
      return (
        <Loading
          title="正在解析播放地址"
          activityIndicator={true}
          containerStyle={[styles.maskContainer, { height: containerHeight, width: containerWidth, backgroundColor: 'black' }]}
          titleStyle={styles.statusMsg}
        />
      );
    }
    return null;
  };

  _renderVideo = () => {
    const { paused, reload, isLandscapeFullScreen, adPlayEnd } = this.state;
    const { onError, url } = this.props;
    if (url && !reload) {
      return (
        <Video
          ref={ref => {
            if (ref) {
              this._video = ref;
            }
          }}
          source={{ uri: url }}
          style={{ flex: 1 }}
          paused={paused || !adPlayEnd}
          onLoad={this._onVideoLoaded}
          onReadyForDisplay={() => {
            this._showDetail();
            this.setState({ isBuffering: false, loadError: false });
          }}
          progressUpdateInterval={200}
          resizeMode="contain"
          ignoreSilentSwitch="ignore"
          onPlaybackStalled={() => {
            this._showDetail();
            this.setState({ isBuffering: true, loadError: false });
          }}
          onPlaybackResume={() => {
            this._showDetail();
            this.setState({ isBuffering: false, loadError: false });
          }}
          onProgress={({ currentTime, readPosition }) => {
            this.setState({
              currentTime: currentTime >= 0 ? currentTime : 0,
              readPosition,
            });
          }}
          onSeek={({ currentTime }) => {
            this.setState({ currentTime: currentTime >= 0 ? currentTime : 0 });
          }}
          onEnd={this._onPlayEnd}
          onError={() => {
            onError();
            this.setState({ loadError: true, isBuffering: false });
          }}
          playInBackground={false}
          fullscreen={isLandscapeFullScreen}
          repeat
        />
      );
    }
    this._video = null;
    return null;
  };

  _renderFooter = () => {
    const { paused, currentTime, duration, showDetail, isLandscapeFullScreen, containerWidth, containerHeight, readPosition } = this.state;
    const show = showDetail && this.props.url && duration > 0;
    return (
      show && (
        <PlayerFooter
          ref={ref => {
            if (ref) {
              this._footer = ref;
            }
          }}
          width={containerWidth}
          paused={paused}
          isLandscapeFullScreen={isLandscapeFullScreen}
          isPortraitFullScreen={containerHeight > containerWidth}
          fullScreenShow={this._fullScreenShow}
          updatePauseStatus={this._updatePauseStatus}
          showPlaylist={() => {
            this.setState({ showPlaylist: true, showDetail: false });
          }}
          seekTime={this._seekTime}
          currentTime={currentTime}
          duration={duration}
          readPosition={readPosition}
          showDetail={this._showDetail}
        />
      )
    );
  };

  _renderVolumeBrightness = () => {
    const { showVolume, showBrightness, progressValue, showVideoSeek, currentTime, duration, containerHeight, containerWidth } = this.state;
    if (!this.props.url) {
      return null;
    }
    const show = showBrightness || showVolume || showVideoSeek;
    let width = `${progressValue * 100}%`;
    let icon = showBrightness ? require('../../resource/brightness_progress.png') : require('../../resource/volume_progrese.png');
    if (showVideoSeek) {
      width = duration > 0 ? `${(currentTime / duration) * 100}%` : 0;
      icon = this._forward ? require('../../resource/video_forward.png') : require('../../resource/video_back.png');
    }
    return (
      <View {...this._gestureHander.panHandlers} style={[styles.maskContainer, { height: containerHeight, width: containerWidth, backgroundColor: 'transparent' }]}>
        {show && (
          <View style={styles.settingContainer}>
            {<Image source={icon} style={[styles.progressIcon, { marginBottom: showVideoSeek ? fitSize(5) : fitSize(20) }]} />}
            <View style={styles.progressContainer}>
              <View style={[styles.progress, { width }]} />
            </View>
            {showVideoSeek && (
              <Text style={styles.progressMsg}>
                <Text style={{ color: STYLE_CONSTANT.themeColor }}>{secondToString(currentTime)}</Text>
                {` / ${secondToString(duration)}`}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  _renderLoading = () => {
    const { url, speed } = this.props;
    const { isBuffering, containerHeight, containerWidth, showCellular } = this.state;
    const show = url && isBuffering && !showCellular;
    return (
      show && (
        <View style={[styles.maskContainer, { height: containerHeight, width: containerWidth }]}>
          <Text style={styles.statusMsg}>加载中，请稍候...</Text>
          <ActivityIndicator size="small" color="white" style={{ marginVertical: fitSize(6) }} />
          <Text style={styles.statusMsg}>{`${toReadableSize(speed)}/s`}</Text>
        </View>
      )
    );
  };

  _renderLoadError = () => {
    const { loadError, containerHeight, containerWidth, showCellular } = this.state;
    const { connectionType } = this.props;
    const show = loadError && !showCellular && (connectionType === CONNECTION_STATUS.wifi || connectionType === CONNECTION_STATUS.cellular);
    return (
      show && (
        <View style={[styles.maskContainer, { height: containerHeight, width: containerWidth }]}>
          <Text style={styles.statusMsg}>视频加载失败</Text>
          <Button type={ButtonType.outline} color="gray" title="点击重试" containerStyle={{ width: '20%', height: fitSize(25), marginTop: fitSize(10) }} onPress={this.reload} />
        </View>
      )
    );
  };

  _renderPlayButton = () => {
    const { loadError, isBuffering, paused, showVideoSeek, containerHeight, containerWidth, showCellular } = this.state;
    const show = paused && !loadError && !isBuffering && !showCellular && !showVideoSeek;
    return (
      show && (
        <View style={[styles.maskContainer, { height: containerHeight, width: containerWidth }]}>
          <Button
            containerStyle={styles.playButtonContainer}
            iconStyle={{
              paddingLeft: fitSize(3),
            }}
            icon={{
              name: 'play',
              color: '#fff',
              size: fitSize(20),
            }}
            onPress={this._onPlayButtonPressed}
          />
        </View>
      )
    );
  };

  _renderPlaylist = () => {
    const { showPlaylist } = this.state;
    if (!showPlaylist) {
      return null;
    }
    const { videoList, playingVideo, onSwitchVideo } = this.props;
    return (
      showPlaylist && (
        <Playlist
          videoList={videoList}
          playingVideo={playingVideo}
          onClose={() => {
            this.setState({ showPlaylist: false });
          }}
          onSwitchVideo={onSwitchVideo}
        />
      )
    );
  };

  render() {
    const { containerHeight, containerWidth } = this.state;
    return (
      <View style={[styles.container, { height: containerHeight, width: containerWidth }]}>
        {this._renderHeader()}
        {this._renderVideo()}
        {this._renderVolumeBrightness()}
        {this._renderUrlStatus()}
        {this._renderLoading()}
        {this._renderLoadError()}
        {this._renderNetError()}
        {this._renderFooter()}
        {this._renderPlaylist()}
        {this._renderGuide()}
        {this._renderAdPlayer()}
        {this._renderPlayButton()}
        {this._renderCellular()}
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { connectionType } = state.Common;
  return { connectionType };
};

export default connect(
  mapStateToProps,
  null,
  null,
  { forwardRef: true },
)(Player);
