// @flow
import React, { Component } from 'react';
import { TouchableWithoutFeedback, Image, Linking } from 'react-native';
import { STYLE_CONSTANT } from '../constant';

type Props = {
  base64: String,
  link: String,
  style: Object,
};

export default class AdComponent extends Component<Props> {
  _openOutLink = () => {
    const { link } = this.props;
    if (link) {
      Linking.openURL(link);
    }
  };

  render() {
    const { base64, style } = this.props;
    return base64 ? (
      <TouchableWithoutFeedback onPress={this._openOutLink}>
        <Image
          source={{ uri: base64 }}
          resizeMode="stretch"
          style={[
            {
              width: STYLE_CONSTANT.screenWidth,
              height: STYLE_CONSTANT.screenWidth * 0.4,
            },
            style,
          ]}
        />
      </TouchableWithoutFeedback>
    ) : null;
  }
}
