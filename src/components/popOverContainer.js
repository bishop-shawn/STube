// @flow
import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import Modal from './modal';
import { fitSize } from '../util/baseUtil';

const arrowHeight = fitSize(5);
const arrowRightOffset = fitSize(15);
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderWidth: arrowHeight,
    borderColor: 'transparent',
    borderBottomColor: 'white',
    alignSelf: 'flex-end',
    marginRight: arrowRightOffset,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
  },
});

type Props = {
  position: Object,
  children: Component,
  containerStyle: Object,
  onClose: Function,
};

const PopOverContainer = (props: Props) => {
  const { onClose, children, containerStyle, position } = props;
  const actualPosition = {
    top: position.top - arrowHeight,
    right: position.right - arrowHeight - arrowRightOffset,
  };
  return (
    <Modal onClose={onClose}>
      <View style={[styles.container, actualPosition]}>
        <View style={styles.arrowUp} />
        <View style={[styles.contentContainer, containerStyle]}>{children}</View>
      </View>
    </Modal>
  );
};

export default PopOverContainer;
