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

const CellularDownloadPopUp = (props: Props) => {
  const { onClose, onConfirm } = props;
  return (
    <Confirm onClose={onClose} onConfirm={onConfirm} confirmTitle="开始下载">
      <Text style={styles.title}>当前为移动网络</Text>
      <Text style={[styles.title, { marginBottom: fitSize(10) }]}>下载会耗费流量，是否继续下载</Text>
    </Confirm>
  );
};

export default CellularDownloadPopUp;
