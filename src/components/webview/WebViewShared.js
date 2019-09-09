import React from 'react';
import { Linking, UIManager as NotTypedUIManager, View, ActivityIndicator, Text } from 'react-native';
import styles from './WebView.styles';

const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

const escapeStringRegexp = function (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }

  return str.replace(matchOperatorsRe, '\\$&');
};


const UIManager = NotTypedUIManager;
const defaultOriginWhitelist = ['http://*', 'https://*'];
const extractOrigin = function (url) {
  const result = /^[A-Za-z][A-Za-z0-9+\-.]+:(\/\/)?[^/]*/.exec(url);
  return result === null ? '' : result[0];
};
const originWhitelistToRegex = function (originWhitelist) {
  return `^${escapeStringRegexp(originWhitelist).replace(/\\\*/g, '.*')}`;
};
const passesWhitelist = function (compiledWhitelist, url) {
  const origin = extractOrigin(url);
  return compiledWhitelist.some((x) => new RegExp(x).test(origin));
};
const compileWhitelist = function (originWhitelist) {
  return ['about:blank'].concat((originWhitelist || [])).map(originWhitelistToRegex);
};
const createOnShouldStartLoadWithRequest = function (loadRequest, originWhitelist, onShouldStartLoadWithRequest) {
  return function (_a) {
    const { nativeEvent } = _a;
    let shouldStart = true;
    const { url } = nativeEvent; const
      { lockIdentifier } = nativeEvent;
    if (!passesWhitelist(compileWhitelist(originWhitelist), url)) {
      Linking.openURL(url);
      shouldStart = false;
    }
    if (onShouldStartLoadWithRequest) {
      shouldStart = onShouldStartLoadWithRequest(nativeEvent);
    }
    loadRequest(shouldStart, url, lockIdentifier);
  };
};
const getViewManagerConfig = function (viewManagerName) {
  if (!UIManager.getViewManagerConfig) {
    return UIManager[viewManagerName];
  }
  return UIManager.getViewManagerConfig(viewManagerName);
};
const defaultRenderLoading = function () {
  return (
    <View style={styles.loadingView}>
      <ActivityIndicator />
    </View>
  );
};
const defaultRenderError = function (errorDomain, errorCode, errorDesc) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTextTitle}>Error loading page</Text>
      <Text style={styles.errorText}>{`Domain: ${errorDomain}`}</Text>
      <Text style={styles.errorText}>{`Error Code: ${errorCode}`}</Text>
      <Text style={styles.errorText}>{`Description: ${errorDesc}`}</Text>
    </View>
  );
};
export { defaultOriginWhitelist, createOnShouldStartLoadWithRequest, getViewManagerConfig, defaultRenderLoading, defaultRenderError };
