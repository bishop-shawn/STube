// @flow
import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { STYLE_CONSTANT } from '../constant';
import Confirm from './confirm';
import CheckBox from './checkBox';
import { fitSize } from '../util/baseUtil';

const styles = StyleSheet.create({
  hintMsg: {
    fontSize: fitSize(14),
    color: 'black',
    marginBottom: fitSize(2),
  },
  highLightHintMsg: {
    color: STYLE_CONSTANT.themeColor,
  },
  lastHintMsg: {
    marginBottom: fitSize(5),
  },
  deleteFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: fitSize(5),
  },
  deleteFileTitle: {
    fontSize: fitSize(14),
    color: 'gray',
    marginLeft: fitSize(6),
  },
});

type Props = {
  onClose: Function,
  deleteCount: number,
  fileSize: string,
  deleteFile: boolean,
  onDelete: Function,
};
type State = {
  deleteChecked: boolean,
};

export default class DeletePopUp extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      deleteChecked: true,
    };
  }

  _deleteTask = () => {
    this.props.onDelete(this.state.deleteChecked);
    this.props.onClose();
  };

  _updateCheckStatus = () => {
    const { deleteChecked } = this.state;
    this.setState({ deleteChecked: !deleteChecked });
  };

  render() {
    const { onClose, deleteCount, fileSize, deleteFile } = this.props;
    return (
      <Confirm title="提示" onClose={onClose} onConfirm={this._deleteTask} highlightCancel>
        <Text style={styles.hintMsg}>
          {'确认删除'}
          <Text style={styles.highLightHintMsg}>{deleteCount}</Text>
          {'个下载任务？'}
        </Text>
        <Text style={[styles.hintMsg, styles.lastHintMsg]}>
          {'占用空间：'}
          <Text style={styles.highLightHintMsg}>{fileSize}</Text>
        </Text>
        {deleteFile && (
          <View style={styles.deleteFileContainer}>
            <CheckBox checked={this.state.deleteChecked} onPress={this._updateCheckStatus} />
            <Text style={styles.deleteFileTitle}>同时删除本地文件</Text>
          </View>
        )}
      </Confirm>
    );
  }
}
