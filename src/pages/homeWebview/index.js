// @flow
import React, { Component } from 'react';
import { DeviceEventEmitter, AppState, BackHandler, View, Text, Image, Clipboard, Linking, NativeModules } from 'react-native';
import { connect } from 'react-redux';
import DownloadAction from '../../redux/actions/download';
import { ROUTE_NAMES, STYLE_CONSTANT } from '../../constant';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';
import { fitSize, showToast, infoHashToMagnet } from '../../util/baseUtil';
import WebViewer from '../../components/webViewer';
import showDialog from './showDialog';
import InviteCodePopUp from '../../components/inviteCodePopUp';
import storageService from '../../service/storageService';
import { isURLSupported, isInfoHash } from '../../util/taskUtil';
import exitModal from './exitAppModal';
import Confirm from '../../components/confirm';
import base64 from '../../util/base64';
import Button, { ButtonType } from '../../components/button';
import Video from '../../model/video';
import configService from '../../service/configService';
import request from '../../util/request';

type Props = {
  navigation: Object,
  dispatch: Function,
};
type State = {
  canGoBack: boolean,
};

class HomeWebView extends Component<Props, State> {
  static navigationOptions = { header: null };

  constructor(props: Props) {
    super(props);
    this._url = configService.getConfigSync().homeUrls;
    this._WebViewer = null;
    this._tabBarPressed = false;
    this._webViewDownloadListener = null;
    this._didFocusListener = null;
    this.catchUrlListener = null;
    this._lastClipboardText = null;
    this.state = {
      // showInviteCodePopUp: false,
      showClipboardConfirm: false,
    };
    this._injectedJavaScript = `
      // search
      window.__searchCbIndex = 1;
      window.__searchCbList = {};
      window.search = function(args, cb) {
        window.__searchCbList[window.__searchCbIndex] = cb;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'exec',
          method: 'search',
          args: args,
          cb: window.__searchCbIndex,
        }));
        window.__searchCbIndex++;
      }
    `;
  }

  async componentDidMount() {
    this.props.navigation.setParams({
      onPress: this._onPress,
    });
    const isFirstUseApp = await storageService.getFirstUseApp();
    // this.setState({ showInviteCodePopUp: isFirstUseApp });
    if (!isFirstUseApp) {
      this._readClipboard();
    }
    this._webViewDownloadListener = DeviceEventEmitter.addListener('homeDownloadEvent', url => {
      this._createTask(url);
    });
    this.catchUrlListener = DeviceEventEmitter.addListener('catchUrl', url => {
      this._gotoAdPage(url);
    });

    AppState.addEventListener('change', this._handleAppStateChange);
    BackHandler.addEventListener('hardwareBackPress', this._handleBackPress);
  }

  componentWillUnmount() {
    this._webViewDownloadListener.remove();
    this.catchUrlListener.remove();
    BackHandler.removeEventListener('hardwareBackPress', this._handleBackPress);
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _onPress = () => {
    if (!this._WebViewer) {
      return;
    }
    if (this._tabBarPressed === true) {
      // // dblclick reload
      // this._WebViewer._webView.reload();
      this._tabBarPressed = false;
    }
    this._tabBarPressed = true;
    setTimeout(() => {
      this._tabBarPressed = false;
    }, 300);
  };

  _handleBackPress = () => {
    if (!this.props.navigation.isFocused()) {
      return false;
    }
    exitModal.show();
    return true;
  };

  _handleAppStateChange = async state => {
    if (state === 'active') {
      this._readClipboard();
    } else if (state === 'background') {
      await storageService.saveLastClipboard(await this._getClipboardUrl());
    }
    this.appState = state;
  };

  _readClipboard = async () => {
    const text = await this._getClipboardUrl();
    if (isURLSupported(text) && text !== (await storageService.getLastClipboard())) {
      await storageService.saveLastClipboard(text);
      this._lastClipboardText = text;
      this.setState({
        showClipboardConfirm: true,
      });
    }
  };

  _getClipboardUrl = async () => {
    const text = (await Clipboard.getString()) || '';
    return text.split(/\s+/)[0];
  };

  _gotoAdPage = (url, title) => {
    this.props.navigation.navigate(ROUTE_NAMES.webEntry, { url, title });
  };

  _execMethod = (message) => {
    if (!message.cb) return;
    if (message.args && message.args[0]) {
      request.search(message.args[0], message.args[1]).then(res => {
        this._WebViewer._webView.injectJavaScript(`
          window.__searchCbList[${message.cb}](null, ${JSON.stringify(res)});
          delete window.__searchCbList[${message.cb}];
        `);
      }).catch((err) => {
        this._WebViewer._webView.injectJavaScript(`
          window.__searchCbList[${message.cb}](new Error(${err.message}));
          delete window.__searchCbList[${message.cb}];
        `);
      });
    } else {
      this._WebViewer._webView.injectJavaScript(`
        window.__searchCbList[${message.cb}](new Error('search value is ${JSON.stringify(message.args && message.args[0])}, search failed.'));
        delete window.__searchCbList[${message.cb}];
      `);
    }
  }

  _openDialog = (message) => {
    if (!message.url) return;
    let originUrl = message.url;
    // if Base64, decode
    if (!isInfoHash(message.url) && /^[a-zA-Z0-9=+/]+$/.test(message.url)) {
      originUrl = base64.decode(message.url);
    }
    // if hash, add magnet prefix
    if (isInfoHash(originUrl)) {
      originUrl = infoHashToMagnet(originUrl);
    }
    showDialog.show(new Video(message.name, Number(message.size), originUrl, -1), this.props.navigation);
  }

  _openOutLink = (message) => {
    if (message.url) {
      Linking.openURL(message.url);
    }
  }

  // handle window.ReactNativeWebView.postMessage from webView
  _handleWebViewMessage = e => {
    this._WebViewer._webView.injectJavaScript(`
      document.activeElement.blur();
    `);
    try {
      const message = JSON.parse(e.nativeEvent.data);
      switch (message.action) {
        case 'exec': this._execMethod(message); break;
        case 'dialog': this._openDialog(message); break;
        case 'outlink': this._openOutLink(message); break;
        default:
      }
    } catch (e) {
      showToast('参数错误');
    }
  };

  _createClipboardTask = () => {
    this.setState({
      showClipboardConfirm: false,
    });
    this.props.dispatch(
      DownloadAction.createTask({
        url: this._lastClipboardText,
      }),
    );
    this.props.navigation.navigate(ROUTE_NAMES.download);
  };

  _createTask = url => {
    this.props.dispatch(
      DownloadAction.createTask({
        url,
        successCallBack: () => {
          reporter.create({
            [REPORT_KEYS.from]: DataMap.from_films,
            [REPORT_KEYS.type]: DataMap.type_download,
            [REPORT_KEYS.url]: url,
          });
        },
      }),
    );
  };

  _renderClipboardConfirm = () => (
    <Confirm
      title="检测到您复制了一个下载链接"
      onClose={() => {
        this.setState({
          showClipboardConfirm: false,
        });
      }}
      onConfirm={this._createClipboardTask}
    >
      <Text style={{ textAlign: 'center', color: STYLE_CONSTANT.themeColor }}>{this._lastClipboardText}</Text>
      <Text style={{ textAlign: 'center', marginTop: fitSize(5) }}>是否创建任务?</Text>
    </Confirm>
  );

  _closeInviteCodePopUp = () => {
    this.setState({ showInviteCodePopUp: false });
    storageService.saveFirstUseApp();
  };

  _renderInviteCodePopUp = () => {
    const { showInviteCodePopUp } = this.state;
    return showInviteCodePopUp && <InviteCodePopUp onClose={this._closeInviteCodePopUp} />;
  };

  render() {
    return (
      <WebViewer
        injectedJavaScript={this._injectedJavaScript}
        showGoBack={false}
        showHeader={false}
        ref={ref => {
          this._WebViewer = ref;
        }}
        url={this._url}
        navigation={this.props.navigation}
        onMessage={this._handleWebViewMessage}
        showClose={false}
        renderError={() => (
          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <Image resizeMode="contain" style={{ height: fitSize(100), marginBottom: fitSize(10) }} source={require('../../resource/load_failed.png')} />
            <Text>内容加载失败</Text>
            <Button
              containerStyle={{
                marginTop: fitSize(50),
                padding: fitSize(20),
              }}
              title="重新加载"
              onPress={() => {
                this._WebViewer.reload();
              }}
            />
            <Button
              type={ButtonType.outline}
              containerStyle={{
                marginTop: fitSize(10),
                padding: fitSize(20),
              }}
              title="前往搜索"
              onPress={() => {
                this.props.navigation.navigate(ROUTE_NAMES.search);
              }}
            />
          </View>
        )}
        eventName="homeDownloadEvent"
        shouldCatchUrl
      >
        {/* this._renderInviteCodePopUp() */}
        {this.state.showClipboardConfirm && this._renderClipboardConfirm()}
      </WebViewer>
    );
  }
}

export default connect()(HomeWebView);
