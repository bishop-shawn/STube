// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button, { ButtonType } from './button';
import { fitSize } from '../util/baseUtil';
import PopUpContainer from './popUpContainer';
import { STYLE_CONSTANT } from '../constant';

const styles = StyleSheet.create({
  body: {
    width: '100%',
    alignItems: 'flex-start',
    padding: fitSize(20),
  },
  button: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
  },
});

type Props = {
  title?: String,
  footerText?: String,
  onClose: Function,
  children: Component,
  width?: Number | String,
  containerStyle?: Object,
  closeOnClickModal?: Boolean,
};

const Alert = (props: Props) => {
  const { title, footerText, children, ...popProps } = props;
  return (
    <PopUpContainer {...popProps}>
      <View style={styles.body}>{children || <Text style={{ color: '#000', fontSize: fitSize(16) }}>{title}</Text>}</View>
      <Button containerStyle={styles.button} onPress={props.onClose} title={footerText} titleStyle={{ color: STYLE_CONSTANT.themeColor, fontSize: fitSize(16) }} type={ButtonType.clear} />
    </PopUpContainer>
  );
};

Alert.defaultProps = {
  title: 'title',
  footerText: '知道了',
  containerStyle: {
    padding: 0,
    borderRadius: 3,
  },
  width: '80%',
  closeOnClickModal: false,
};

export default Alert;
