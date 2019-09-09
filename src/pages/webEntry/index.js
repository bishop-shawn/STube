// @flow
import React, { Component } from 'react';
import { DeviceEventEmitter, Linking } from 'react-native';
import { connect } from 'react-redux';
import DownloadAction from '../../redux/actions/download';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';
import { showToast, infoHashToMagnet } from '../../util/baseUtil';
import WebViewer from '../../components/webViewer';
import showDialog from '../homeWebview/showDialog';
import base64 from '../../util/base64';
import { isInfoHash } from '../../util/taskUtil';
import Video from '../../model/video';

type Props = {
  navigation: Object,
  dispatch: Function,
};
type State = {
  canGoBack: boolean,
};

class WebEntry extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.webViewRef = null;
    this._webViewDownloadListener = null;
    this.state = {
      title: props.navigation.getParam('title') || null,
    };
  }

  componentDidMount() {
    this._webViewDownloadListener = DeviceEventEmitter.addListener('startDownload', url => {
      this._createTask(url);
    });
  }

  componentWillUnmount() {
    this._webViewDownloadListener.remove();
  }

  _injectJavaScript = () => {
    // wait title ready
    setTimeout(() => {
      // prevent webView Node not exist.
      if (this.props.navigation.isFocused()) {
        this.webViewRef._webView.injectJavaScript(`
          window.ReactNativeWebView.postMessage(JSON.stringify({title:document.title}));
        `);
      }
    }, 0);
  };

  _createTask = url => {
    this.props.dispatch(
      DownloadAction.createTask({
        url,
        successCallBack: () => {
          reporter.create({
            [REPORT_KEYS.from]: DataMap.from_sites,
            [REPORT_KEYS.type]: DataMap.type_download,
            [REPORT_KEYS.url]: url,
          });
        },
      })
    );
  };

  // handle window.ReactNativeWebView.postMessage from webView
  _handleWebViewMessage = e => {
    this.webViewRef._webView.injectJavaScript(`
      document.activeElement.blur();
    `);
    try {
      const message = JSON.parse(e.nativeEvent.data);
      if (!message.url && message.title !== undefined) {
        this.setState({
          title: message.title || null,
        });
        return;
      }
      let originUrl = message.url;
      // if Base64, decode
      if (!isInfoHash(message.url) && /^[a-zA-Z0-9=+/]+$/.test(message.url)) {
        originUrl = base64.decode(message.url);
      }
      // if hash, add magnet prefix
      if (isInfoHash(originUrl)) {
        originUrl = infoHashToMagnet(originUrl);
      }
      if (message.action === 'dialog') {
        showDialog.show(new Video(message.name, message.size, message.url, -1), this.props.navigation);
      } else if (message.action === 'outlink') {
        Linking.openURL(message.url);
      }
      // eslint-disable-next-line no-shadow
    } catch (e) {
      showToast('参数错误');
    }
  };

  render() {
    return (
      <WebViewer
        onLoad={this._injectJavaScript}
        ref={ref => {
          if (ref) {
            this.webViewRef = ref;
          }
        }}
        title={this.state.title}
        url={this.props.navigation.getParam('url')}
        onMessage={this._handleWebViewMessage}
        navigation={this.props.navigation}
      />
    );
  }
}

export default connect()(WebEntry);
