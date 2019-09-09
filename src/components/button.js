// @flow
import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Icon from './icon';
import { STYLE_CONSTANT } from '../constant';
import { fitSize } from '../util/baseUtil';

export const ButtonType = {
  solid: 1,
  clear: 2,
  outline: 3,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: fitSize(30),
    borderRadius: 3,
  },
  title: {
    fontSize: fitSize(12),
    marginHorizontal: fitSize(1),
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  icon: {
    marginHorizontal: fitSize(1),
  },
  image: {
    width: fitSize(12),
    height: fitSize(12),
    marginHorizontal: fitSize(1),
  },
});

type Props = {
  loading?: boolean,
  color?: string,
  containerStyle: Object,
  icon: Object,
  iconStyle: Object,
  title: string,
  titleStyle: Object,
  image: Object,
  imageStyle: Object,
  type?: string,
  onPress: Function,
  disabled?: boolean,
  setRef?: Function,
};

const Button = (props: Props) => {
  const { containerStyle, iconStyle, icon, title, titleStyle, onPress, type, disabled, setRef, color, image, imageStyle, loading } = props;

  const _onPress = () => {
    if (onPress) {
      onPress();
    }
  };

  const _ref = (ref: Object) => {
    if (setRef) {
      setRef(ref);
    }
  };

  let containerBackground = { backgroundColor: 'transparent' };
  let containerBorder = {};
  let titleColor = { color };
  if (type === ButtonType.solid) {
    containerBackground = disabled ? { backgroundColor: STYLE_CONSTANT.seperatorColor } : { backgroundColor: color };
    titleColor = { color: 'white' };
  } else if (type === ButtonType.outline) {
    containerBorder = disabled ? { borderWidth: 1, borderColor: 'gray' } : { borderWidth: 1, borderColor: color };
  }
  if (disabled) {
    titleColor = { color: 'gray' };
  }
  return (
    <TouchableWithoutFeedback onPress={_onPress} disabled={disabled}>
      <View style={[styles.container, containerBackground, containerBorder, containerStyle]} ref={_ref}>
        {loading && <ActivityIndicator size="small" color={titleColor.color} />}
        {!loading && image && <Image source={image} style={[styles.image, imageStyle]} resizeMode="contain" />}
        {!loading && icon && <Icon {...icon} style={[styles.icon, iconStyle]} />}
        {!loading && title && <Text style={[styles.title, titleColor, titleStyle]}>{title}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
};

Button.defaultProps = {
  loading: false,
  type: ButtonType.solid,
  disabled: false,
  setRef: undefined,
  color: STYLE_CONSTANT.themeColor,
};
export default Button;
