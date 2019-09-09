// @flow
import React, { Component } from 'react';
import { Text, StyleSheet, View, BackHandler, NativeModules } from 'react-native';
import RootSiblings from 'react-native-root-siblings';
import CheckBox from '../../components/checkBox';
import Confirm from '../../components/confirm';
import { fitSize } from '../../util/baseUtil';
import { TASK_STATUS } from '../../constant';
import store from '../../redux/store';

const styles = StyleSheet.create({
  exitAppHeader: {
    textAlign: 'center',
    fontSize: fitSize(18),
    color: '#000',
    paddingBottom: fitSize(15),
  },
  exitAppContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: fitSize(5),
  },
  exitAppTitle: {
    fontSize: fitSize(14),
    color: 'gray',
    marginLeft: fitSize(6),
  },
});

type Props = {
  onClose: Function,
};

class ExitAppModal extends Component<Props> {
  constructor(props: Props) {
    super(props);
    const hasDownloading = store.getState().Download.tasks.filter(task => task.visible && task.status === TASK_STATUS.RUNNING).length > 0;
    this.state = {
      checked: true,
      hasDownloading,
    };
  }

  _onClose = () => {
    this.props.onClose();
  };

  _changeCheckState = () => {
    const { checked } = this.state;
    this.setState({
      checked: !checked,
    });
  };

  _exit = () => {
    const { checked, hasDownloading } = this.state;
    if (hasDownloading && checked) {
      NativeModules.NativeHelper.hideApp();
      this._onClose();
    } else {
      BackHandler.exitApp();
    }
  };

  render() {
    return (
      <Confirm onClose={this._onClose} confirmTitle="退出" onConfirm={this._exit}>
        <Text style={styles.exitAppHeader}>退出</Text>
        {this.state.hasDownloading ? (
          <View style={styles.exitAppContainer}>
            <CheckBox title="保持下载任务后台进行" titleStyle={styles.exitAppTitle} checked={this.state.checked} onPress={this._changeCheckState} />
          </View>
        ) : (
          <View style={styles.exitAppContainer}>
            <Text style={styles.exitAppTitle}>是否确认退出？</Text>
          </View>
        )}
      </Confirm>
    );
  }
}

let exitModalInstance = null;

function close() {
  if (exitModalInstance) {
    exitModalInstance.destroy();
  }
}

function show() {
  if (exitModalInstance) {
    exitModalInstance.destroy();
  }
  exitModalInstance = new RootSiblings(<ExitAppModal onClose={close} />);
}

export default {
  show,
  close,
};
