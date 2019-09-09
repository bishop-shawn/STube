// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PopUpContainer from './popUpContainer';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT } from '../constant';
import { fitSize } from '../util/baseUtil';

const styles = StyleSheet.create({
  title: {
    color: 'black',
    fontSize: fitSize(16),
    marginTop: fitSize(20),
  },
  contentContainer: {
    padding: fitSize(20),
    width: '100%',
  },
  footerContainer: {
    flexDirection: 'row',
    height: fitSize(50),
  },
  cancelContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
    borderRadius: 0,
  },
  confirmContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
    borderRadius: 0,
  },
});

type Props = {
  title: string,
  titleStyle: Object,
  onConfirm: Function,
  children: Component,
  highlightCancel?: boolean,
  onClose: Function,
  confirmTitle?: string,
  cancelTitle?: string,
  confirming?: boolean,
};

const Confirm = (props: Props) => {
  const { onConfirm, children, highlightCancel, onClose, title, titleStyle, confirmTitle, cancelTitle, confirming } = props;
  return (
    <PopUpContainer onClose={onClose} width="75%" containerStyle={{ borderRadius: 8 }} closeOnClickModal={false}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      <View style={styles.contentContainer}>{children}</View>
      <View style={styles.footerContainer}>
        <Button title={cancelTitle} type={ButtonType.clear} containerStyle={styles.cancelContainer} titleStyle={{ color: highlightCancel ? STYLE_CONSTANT.themeColor : STYLE_CONSTANT.fontBlackColor, fontSize: fitSize(16) }} onPress={onClose} />
        <Button loading={confirming} title={confirmTitle} type={ButtonType.clear} containerStyle={styles.confirmContainer} titleStyle={{ color: highlightCancel ? STYLE_CONSTANT.fontBlackColor : STYLE_CONSTANT.themeColor, fontSize: fitSize(16) }} onPress={onConfirm} />
      </View>
    </PopUpContainer>
  );
};

Confirm.defaultProps = {
  highlightCancel: false,
  confirmTitle: '确认',
  cancelTitle: '取消',
  confirming: false,
};

export default Confirm;
