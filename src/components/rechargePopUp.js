// @flow
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Confirm from './confirm';
import { fitSize } from '../util/baseUtil';
import { STYLE_CONSTANT } from '../constant';

const styles = StyleSheet.create({
  title: {
    color: STYLE_CONSTANT.fontBlackColor,
    fontSize: fitSize(15),
  },
});

type Props = {
  onClose: Function,
  onConfirm: Function,
};

const RechargePopUp = (props: Props) => {
  const { onClose, onConfirm } = props;
  return (
    <Confirm onClose={onClose} onConfirm={onConfirm} confirmTitle="前往充值" cancelTitle="知道了">
      <Text style={styles.title}>当前账户余额不足</Text>
    </Confirm>
  );
};

export default RechargePopUp;
