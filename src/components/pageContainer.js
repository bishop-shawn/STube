// @flow
import React, { Component } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { STYLE_CONSTANT } from '../constant';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: STYLE_CONSTANT.appBackgroundColor, borderTopWidth: StatusBar.currentHeight, borderColor: STYLE_CONSTANT.appHeaderColor },
});

type Props = {
  style: Object,
  children: Component,
};

const PageContainer = (props: Props) => {
  const { style, children } = props;
  return <View style={[styles.container, style]}>{children}</View>;
};

export default PageContainer;
