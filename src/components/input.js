// @flow
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { fitSize } from '../util/baseUtil';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT } from '../constant';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: fitSize(45),
  },
  input: {
    width: '100%',
    height: fitSize(35),
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 2,
    fontSize: fitSize(15),
  },
  errorMsg: {
    marginTop: fitSize(2),
    fontSize: fitSize(10),
    color: 'red',
  },
  clear: {
    position: 'absolute',
    right: 0,
    top: fitSize(6),
  },
});

type Props = {
  containerStyle: Object,
  inputStyle: Object,
  clearStyle: Object,
  errorMsg: string,
  errorMsgStyle: Object,
  showClear: boolean,
  onClear: Function,
};

const Input = (props: Props) => {
  const { containerStyle, inputStyle, clearStyle, errorMsg, errorMsgStyle, showClear, onClear } = props;
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput {...props} style={[styles.input, inputStyle]} />
      {errorMsg && <Text style={[styles.errorMsg, errorMsgStyle]}>{errorMsg}</Text>}
      {showClear && (
        <Button
          icon={{
            name: 'close',
            color: STYLE_CONSTANT.themeColor,
            size: fitSize(18),
          }}
          type={ButtonType.clear}
          onPress={onClear}
          containerStyle={[styles.clear, clearStyle]}
        />
      )}
    </View>
  );
};

export default Input;
