// @flow
import React, { Component } from 'react';
import { View, StyleSheet, BackHandler, TouchableWithoutFeedback } from 'react-native';
import RootSiblings from 'react-native-root-siblings';
import { STYLE_CONSTANT, IS_IOS } from '../constant';
import DeviceInfo from '../util/deviceInfo';

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    height: STYLE_CONSTANT.screenHeight + DeviceInfo.getNotchHeight(),
    width: STYLE_CONSTANT.screenWidth,
    position: 'absolute',
    zIndex: 999,
    backgroundColor: 'rgba(30,30,30,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

type Props = {
  children: Component,
  onClose: Function,
  closeOnClickModal?: boolean,
  containerStyle: Object,
};

export default class Modal extends Component<Props, *> {
  componentDidMount() {
    if (!IS_IOS) {
      BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
    }
    this._popUp = new RootSiblings(
      (
        <TouchableWithoutFeedback onPress={this.onClose}>
          <View style={[styles.container, this.props.containerStyle]}>{this.props.children}</View>
        </TouchableWithoutFeedback>
      ),
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.children !== prevProps.children) {
      this._popUp.update(
        (
          <TouchableWithoutFeedback onPress={this.onClose}>
            <View style={[styles.container, this.props.containerStyle]}>{this.props.children}</View>
          </TouchableWithoutFeedback>
        ),
      );
    }
  }

  componentWillUnmount() {
    this._popUp.destroy();
    BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
  }

  onClose = () => {
    if (this.props.closeOnClickModal) {
      this._popUp.destroy();
      this.props.onClose();
    }
  };

  onBackAndroid = () => {
    this.onClose();
    return true;
  };

  render() {
    return null;
  }
}

Modal.defaultProps = {
  closeOnClickModal: true,
};
