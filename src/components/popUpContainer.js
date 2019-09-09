// @flow
import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import Modal from './modal';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

type Props = {
  onClose: Function,
  children: Component,
  containerStyle?: Object,
  width?: number | string,
  closeOnClickModal?: Boolean,
};

const PopUpContainer = (props: Props) => {
  const { onClose, children, containerStyle, width, closeOnClickModal } = props;
  return (
    <Modal onClose={onClose} closeOnClickModal={closeOnClickModal}>
      <View onStartShouldSetResponder={() => true} style={[styles.container, { width }, containerStyle]}>
        {children}
      </View>
    </Modal>
  );
};

PopUpContainer.defaultProps = {
  containerStyle: undefined,
  width: '80%',
  closeOnClickModal: true,
};

export default PopUpContainer;
