// @flow
import React from 'react';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT } from '../constant';
import { fitSize } from '../util/baseUtil';

type Props = {
  checked: boolean,
  onPress: Function,
  containerStyle: Object,
  title: String,
  titleStyle: Object,
};

const CheckBox = (props: Props) => {
  const iconColor = props.checked ? STYLE_CONSTANT.themeColor : STYLE_CONSTANT.seperatorColor;
  return (
    <Button
      containerStyle={props.containerStyle}
      type={ButtonType.clear}
      icon={{
        name: 'check',
        size: fitSize(18),
        color: iconColor,
      }}
      title={props.title}
      titleStyle={props.titleStyle}
      onPress={props.onPress}
    />
  );
};

export default CheckBox;
