// @flow
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Icon from './icon';
import PopOverContainer from './popOverContainer';
import { STYLE_CONSTANT } from '../constant';
import { fitSize } from '../util/baseUtil';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    paddingVertical: fitSize(3),
  },
  text: {
    color: '#000000',
    fontSize: fitSize(14),
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  button: {
    paddingVertical: fitSize(10),
    paddingHorizontal: fitSize(15),
  },
});

type Props = {
  position: Object,
  onClose: Function,
  config: [
    {
      icon: String,
      title: String,
    },
  ],
};

const popOverButtons = (props: Props) => {
  const { position, onClose } = props;

  return (
    <PopOverContainer onClose={onClose} position={position} containerStyle={styles.container}>
      {props.config.map(item => (
        <Icon.Button
          style={styles.button}
          borderRadius={0}
          underlayColor="rgba(0, 0, 0, 0.1)"
          key={item.icon}
          onPress={() => {
            item.onPress();
          }}
          name={item.icon}
          size={fitSize(18)}
          color={STYLE_CONSTANT.themeColor}
          backgroundColor="rgba(0, 0, 0, 0)"
        >
          <Text style={styles.text}>{item.title}</Text>
        </Icon.Button>
      ))}
    </PopOverContainer>
  );
};

export default popOverButtons;
