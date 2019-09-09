import React from 'react';
import { Image, requireNativeComponent, UIManager as NotTypedUIManager, View, NativeModules, findNodeHandle } from 'react-native';
import { defaultOriginWhitelist, createOnShouldStartLoadWithRequest, getViewManagerConfig, defaultRenderError, defaultRenderLoading } from './WebViewShared';
import styles from './WebView.styles';


const invariant = function (condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    let error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment '
        + 'for the full error message and additional helpful warnings.',
      );
    } else {
      const args = [a, b, c, d, e, f];
      let argIndex = 0;
      error = new Error(
        format.replace(/%s/g, () => args[argIndex++]),
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

const __extends = (this && this.__extends) || (function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf
          || ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; })
          || function (d, b) { for (const p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}());
const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(((resolve, reject) => {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : new P(((resolve) => { resolve(result.value); })).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  }));
};
const __generator = (this && this.__generator) || function (thisArg, body) {
  let _ = { label: 0, sent() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }; let f; let y; let t; let
    g;
  return g = { next: verb(0), throw: verb(1), return: verb(2) }, typeof Symbol === 'function' && (g[Symbol.iterator] = function () { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
    if (f) throw new TypeError('Generator is already executing.');
    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y.return : op[0] ? y.throw || ((t = y.return) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0: case 1: t = op; break;
          case 4: _.label++; return { value: op[1], done: false };
          case 5: _.label++; y = op[1]; op = [0]; continue;
          case 7: op = _.ops.pop(); _.trys.pop(); continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
            if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
            if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
            if (t[2]) _.ops.pop();
            _.trys.pop(); continue;
        }
        op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
    }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
const __rest = (this && this.__rest) || function (s, e) {
  const t = {};
  for (var p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) { t[p] = s[p]; }
  }
  if (s != null && typeof Object.getOwnPropertySymbols === 'function') {
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0) { t[p[i]] = s[p[i]]; }
    }
  }
  return t;
};
const _this = this;

const UIManager = NotTypedUIManager;
const RNCWebView = requireNativeComponent('RNCWebView');
const { resolveAssetSource } = Image;
/**
* Renders a native WebView.
*/
const WebView = /** @class */ (function (_super) {
  __extends(WebView, _super);
  function WebView() {
    const _this = _super !== null && _super.apply(this, arguments) || this;
    _this.state = {
      viewState: _this.props.startInLoadingState ? 'LOADING' : 'IDLE',
      lastErrorEvent: null,
    };
    _this.webViewRef = React.createRef();
    _this.getCommands = function () { return getViewManagerConfig('RNCWebView').Commands; };
    _this.goForward = function () {
      UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().goForward, null);
    };
    _this.goBack = function () {
      UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().goBack, null);
    };
    _this.reload = function () {
      _this.setState({
        viewState: _this.props.startInLoadingState ? 'LOADING' : 'IDLE',
      });
      UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().reload, null);
    };
    _this.stopLoading = function () {
      UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().stopLoading, null);
    };
    _this.postMessage = function (data) {
      UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().postMessage, [String(data)]);
    };
    /**
       * Injects a javascript string into the referenced WebView. Deliberately does not
       * return a response because using eval() to return a response breaks this method
       * on pages with a Content Security Policy that disallows eval(). If you need that
       * functionality, look into postMessage/onMessage.
       */
    _this.injectJavaScript = function (data) {
      UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().injectJavaScript, [data]);
    };
    /**
       * We return an event with a bunch of fields including:
       *  url, title, loading, canGoBack, canGoForward
       */
    _this.updateNavigationState = function (event) {
      if (_this.props.onNavigationStateChange) {
        _this.props.onNavigationStateChange(event.nativeEvent);
      }
    };
    /**
       * Returns the native `WebView` node.
       */
    _this.getWebViewHandle = function () {
      const nodeHandle = findNodeHandle(_this.webViewRef.current);
      invariant(nodeHandle != null, 'nodeHandle expected to be non-null');
      return nodeHandle;
    };
    _this.onLoadingStart = function (event) {
      const { onLoadStart } = _this.props;
      if (onLoadStart) {
        onLoadStart(event);
      }
      _this.updateNavigationState(event);
    };
    _this.onLoadingError = function (event) {
      event.persist(); // persist this event because we need to store it
      const _a = _this.props; const { onError } = _a; const
        { onLoadEnd } = _a;
      if (onError) {
        onError(event);
      }
      if (onLoadEnd) {
        onLoadEnd(event);
      }
      console.warn('Encountered an error loading page', event.nativeEvent);
      _this.setState({
        lastErrorEvent: event.nativeEvent,
        viewState: 'ERROR',
      });
    };
    _this.onLoadingFinish = function (event) {
      const _a = _this.props; const { onLoad } = _a; const
        { onLoadEnd } = _a;
      if (onLoad) {
        onLoad(event);
      }
      if (onLoadEnd) {
        onLoadEnd(event);
      }
      _this.setState({
        viewState: 'IDLE',
      });
      _this.updateNavigationState(event);
    };
    _this.onTitle = function (title) {
      const { onTitle } = _this.props;
      if (onTitle) {
        onTitle(title);
      }
    };
    _this.onMessage = function (event) {
      const { onMessage } = _this.props;
      if (onMessage) {
        onMessage(event);
      }
    };
    _this.onLoadingProgress = function (event) {
      const { onLoadProgress } = _this.props;
      if (onLoadProgress) {
        onLoadProgress(event);
      }
    };
    _this.onShouldStartLoadWithRequestCallback = function (shouldStart, url) {
      if (shouldStart) {
        UIManager.dispatchViewManagerCommand(_this.getWebViewHandle(), _this.getCommands().loadUrl, [String(url)]);
      }
    };
    return _this;
  }
  WebView.prototype.render = function () {
    const _a = this.props; const { onMessage } = _a; const onShouldStartLoadWithRequestProp = _a.onShouldStartLoadWithRequest; const { originWhitelist } = _a; const { renderError } = _a; const { renderLoading } = _a; const { source } = _a; const { style } = _a; const _b = _a.nativeConfig; const nativeConfig = _b === void 0 ? {} : _b; const
      otherProps = __rest(_a, ['onMessage', 'onShouldStartLoadWithRequest', 'originWhitelist', 'renderError', 'renderLoading', 'source', 'style', 'nativeConfig']);
    let otherView = null;
    if (this.state.viewState === 'LOADING') {
      otherView = (renderLoading || defaultRenderLoading)();
    } else if (this.state.viewState === 'ERROR') {
      const errorEvent = this.state.lastErrorEvent;
      invariant(errorEvent != null, 'lastErrorEvent expected to be non-null');
      otherView = (renderError || defaultRenderError)(errorEvent.domain, errorEvent.code, errorEvent.description);
    } else if (this.state.viewState !== 'IDLE') {
      console.error(`RNCWebView invalid state encountered: ${this.state.viewState}`);
    }
    if(otherView !== null) {
      // wrapper otherView int absolute View
      otherView = <View style={styles.otherViewContainer}>{otherView}</View>;
    }
    const webViewStyles = [styles.container, styles.webView, style];
    if (source && 'method' in source) {
      if (source.method === 'POST' && source.headers) {
        console.warn('WebView: `source.headers` is not supported when using POST.');
      } else if (source.method === 'GET' && source.body) {
        console.warn('WebView: `source.body` is not supported when using GET.');
      }
    }
    const NativeWebView = nativeConfig.component || RNCWebView;
    const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(this.onShouldStartLoadWithRequestCallback,
      // casting cause it's in the default props
      originWhitelist, onShouldStartLoadWithRequestProp);
    const webView = (
      <NativeWebView
        key="webViewKey"
        {...otherProps}
        messagingEnabled={typeof onMessage === 'function'}
        onLoadingError={this.onLoadingError}
        onLoadingFinish={this.onLoadingFinish}
        onLoadingProgress={this.onLoadingProgress}
        onLoadingStart={this.onLoadingStart}
        onMessage={this.onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        ref={this.webViewRef}
      // TODO: find a better way to type this.
        onTitle={this.onTitle}
        source={resolveAssetSource(source)}
        style={webViewStyles}
        {...nativeConfig.props}
      />
    );
    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  };
  WebView.defaultProps = {
    overScrollMode: 'always',
    javaScriptEnabled: true,
    thirdPartyCookiesEnabled: true,
    scalesPageToFit: true,
    allowFileAccess: false,
    saveFormDataDisabled: false,
    cacheEnabled: true,
    androidHardwareAccelerationDisabled: false,
    originWhitelist: defaultOriginWhitelist,
  };
  WebView.isFileUploadSupported = function () {
    return __awaiter(_this, void 0, void 0, function () {
      return __generator(this, (_a) =>
      // native implementation should return "true" only for Android 5+
        [2 /* return */, NativeModules.RNCWebView.isFileUploadSupported()]);
    });
  };
  return WebView;
}(React.Component));
export default WebView;
