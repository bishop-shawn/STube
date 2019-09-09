// @flow
import React, { Component } from 'react';
import { StyleSheet, BackHandler, View, Text, Image, TouchableWithoutFeedback } from 'react-native';
import Config from 'react-native-config';
import deviceInfo from '../util/deviceInfo';
import WebView from './webview';
import Icon from './icon';
import PageContainer from './pageContainer';
import AppHeader from './appHeader';
import { fitSize, showToast } from '../util/baseUtil';
import { IS_IOS, STYLE_CONSTANT, PAGE_APPEAR_STATUS } from '../constant';
import request from '../util/request';
import Loading from './loading';
import Button from './button';

const styles = StyleSheet.create({
  menuIcon: {
    padding: fitSize(10),
  },
  progress: {
    marginTop: 1,
    height: fitSize(2),
    backgroundColor: STYLE_CONSTANT.themeColor,
  },
});

type Props = {
  navigation: Object,
  title: string,
  url: string,
  showClose?: Boolean,
  showGoBack?: Boolean,
  leftComponent: Function,
  rightButtons: Array,
  renderError?: Function,
  showHeader?: Boolean,
};
type State = {
  canGoBack: boolean,
  loadingProgress: number,
  loadEnd: boolean,
};

export default class WebViewer extends Component<Props, State> {
  static defaultProps = {
    showClose: true,
    showGoBack: true,
    showHeader: true,
  };

  constructor(props: Props) {
    super(props);
    this._urlIndex = null;
    this._isList = Array.isArray(props.url);
    if (this._isList) {
      this._urlIndex = 0;
    }
    this.state = {
      canGoBack: false,
      loadingProgress: 0,
      loadEnd: false,
      url: this._isList ? props.url[0] : props.url,
    };
  }

  componentDidMount() {
    this._didFocusListener = this.props.navigation.addListener(PAGE_APPEAR_STATUS.didFocus, () => {
      if (!IS_IOS) {
        BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
      }
    });
    this._willBlurListener = this.props.navigation.addListener(PAGE_APPEAR_STATUS.willBlur, () => {
      if (!IS_IOS) {
        BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
      }
    });
  }

  componentWillUnmount() {
    this._didFocusListener.remove();
    this._willBlurListener.remove();
  }

  onBackAndroid = () => {
    if (!this.props.showGoBack) {
      return false;
    }
    if (this.state.canGoBack) {
      this._webView.goBack();
      return true;
    }
    return false;
  };

  _onNavigationStateChange = navState => {
    this.setState({
      canGoBack: navState.canGoBack,
    });
  };

  _onGoBack = () => {
    const { canGoBack } = this.state;
    if (canGoBack) {
      this._webView.goBack();
    } else {
      this.props.navigation.goBack();
    }
  };

  _updateLoadingProgress = event => {
    const { progress } = event.nativeEvent;
    this.setState({ loadingProgress: progress });
  };

  _renderHeaderBack = () => (!this.props.showGoBack || (!this.props.showClose && !this.state.canGoBack) ? null : <Icon style={styles.menuIcon} name="back" color={STYLE_CONSTANT.appHeaderTextColor} size={fitSize(18)} onPress={this._onGoBack} />);

  _renderLoadingProgress = () => {
    const { loadEnd, loadingProgress } = this.state;
    if (loadEnd) {
      return null;
    }
    return <View style={[styles.progress, { width: Math.floor(STYLE_CONSTANT.screenWidth * loadingProgress) }]} />;
  };

  _initListUrl = () => {
    let url;
    if (this._isList) {
      this._urlIndex = 0;
      url = this.props.url[this._urlIndex];
      this.setState({
        url,
      });
    }
  };

  _useNextUrl = () => {
    if (this._urlIndex === null) return;
    this._urlIndex += 1;
    const { url } = this.props;
    if (this._urlIndex < url.length) {
      this.setState({
        url: url[this._urlIndex],
      });
    }
  };

  reload = () => {
    if (request.isOffline()) {
      showToast('无网络连接');
    } else {
      this._initListUrl();
      this._webView.reload();
    }
  };

  _renderLoading = () => <Loading containerStyle={{ backgroundColor: '#fff' }} />;

  _renderError = () => {
    let isError = true;
    if (this._isList && this._urlIndex < this.props.url.length) {
      isError = false;
    }
    const { renderError } = this.props;
    return isError ? (
      <TouchableWithoutFeedback>
        {renderError ? (
          renderError()
        ) : (
          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <Image resizeMode="contain" style={{ height: fitSize(100), marginBottom: fitSize(10) }} source={require('../resource/load_failed.png')} />
            <Text>内容加载失败</Text>
            <Button
              containerStyle={{
                marginTop: fitSize(50),
                padding: fitSize(20),
              }}
              title="重新加载"
              onPress={this.reload}
            />
          </View>
        )}
      </TouchableWithoutFeedback>
    ) : (
      this._renderLoading()
    );
  };

  render() {
    const { showHeader, title, showClose, leftComponent, rightButtons, ...webViewProps } = this.props;
    const { url } = this.state;
    const config = {
      icon: 'close',
      onPress: () => {
        this.props.navigation.goBack();
      },
    };
    return (
      <PageContainer>
        {showHeader && <AppHeader leftComponent={leftComponent || this._renderHeaderBack} title={title} rightButtons={rightButtons || (showClose ? [config] : [])} />}
        {this._renderLoadingProgress()}
        <WebView
          onLoadProgress={this._updateLoadingProgress}
          style={{ flex: 1 }}
          ref={ref => {
            if (ref) {
              this._webView = ref;
            }
          }}
          onNavigationStateChange={this._onNavigationStateChange}
          source={{
            uri: url,
            headers: {
              'user-id': deviceInfo.getUniqueID(),
            },
          }}
          userAgent={`${deviceInfo.getUserAgent()} ${Config.APP_NAME}`}
          onLoadStart={() => {
            this.setState({ loadEnd: false });
          }}
          onLoadEnd={() => {
            this.setState({ loadEnd: true });
          }}
          {...webViewProps}
          renderError={this._renderError}
          onError={this._useNextUrl}
          startInLoadingState={Config.SHOW_HOME_LOADING === 1}
          mixedContentMode="always"
          cacheEnabled={true}
          renderLoading={this._renderLoading}
        />
      </PageContainer>
    );
  }
}
