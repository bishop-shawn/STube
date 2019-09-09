// @flow
import React from 'react';
import WebView from '../webview';
import { View } from 'react-native';

type Props = {
  style: object,
  context: object,
  render: Function,
  onLoad: Function,
  onLoadEnd: Function,
};

const Canvas = (props: Props) => {
  const contextString = JSON.stringify(props.context);
  const renderString = props.render.toString();
  return (
    <View style={props.style}>
      <WebView
        automaticallyAdjustContentInsets={false}
        scalesPageToFit={false}
        contentInset={{ top: 0, right: 0, bottom: 0, left: 0 }}
        source={{
          html:`
            <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"/>
            </head>
            <body>
            <style>*{margin:0;padding:0;}canvas{transform:translateZ(0);}</style>
            <canvas></canvas>
            <script>
              var canvas = document.querySelector('canvas');
              (${renderString}).call(${contextString}, canvas);
            </script>
            </body></html>
          `,
        }}
        opaque={false}
        underlayColor={'transparent'}
        style={props.style}
        javaScriptEnabled={true}
        scrollEnabled={false}
        onLoad={props.onLoad}
        onLoadEnd={props.onLoadEnd}
        originWhitelist={['*']}
      />
    </View>
  );
};

export default Canvas;
