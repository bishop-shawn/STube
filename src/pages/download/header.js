// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux';
import DownloadAction from '../../redux/actions/download';
import { STYLE_CONSTANT, ROUTE_NAMES, TASK_STATUS, CONNECTION_STATUS } from '../../constant';
import Button, { ButtonType } from '../../components/button';
import PopOverMenu from '../../components/popOverMenu';
import { fitSize } from '../../util/baseUtil';
import DownloadTask from '../../model/downloadTask';
import CellularDownloadPopUp from '../../components/cellularDownloadPopUp';

const innerHeight = fitSize(35);

const styles = StyleSheet.create({
  container: {
    height: fitSize(52),
    paddingHorizontal: fitSize(10),
    backgroundColor: STYLE_CONSTANT.appHeaderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadStatus: {
    fontSize: fitSize(18),
    height: innerHeight,
    paddingHorizontal: fitSize(10),
    textAlign: 'center',
    textAlignVertical: 'center',
    color: STYLE_CONSTANT.appHeaderTextColor,
  },
  headerRightContainer: {
    flexDirection: 'row',
  },
  buttonContainer: {
    height: innerHeight,
    paddingHorizontal: fitSize(10),
  },
});

type Props = {
  downloadStatus: string,
  navigation: Object,
  dispatch: Function,
  tasks: DownloadTask[],
  connectionType: string,
};
type State = {
  showAddTaskPopOver: boolean,
  showMorePopOver: false,
};

class DownloadHeader extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showAddTaskPopOver: false,
      showMorePopOver: false,
    };
  }

  _addTaskPopOverPosition: Object;

  _morePopOverPosition: Object;

  _showAddTaskPopOver = () => {
    if (this._addTaskPopOverPosition) {
      this.setState({
        showAddTaskPopOver: true,
      });
      return;
    }
    this._addRef.measure((x, y, width, height, pageX, pageY) => {
      this._addTaskPopOverPosition = {
        top: pageY + height,
        right: STYLE_CONSTANT.screenWidth - pageX - width / 2,
      };
      this.setState({
        showAddTaskPopOver: true,
      });
    });
  };

  _showMorePopOver = () => {
    if (this._morePopOverPosition) {
      this.setState({
        showMorePopOver: true,
      });
      return;
    }
    this._moreRef.measure((x, y, width, height, pageX, pageY) => {
      this._morePopOverPosition = {
        top: pageY + height,
        right: STYLE_CONSTANT.screenWidth - pageX - width / 2,
      };
      this.setState({
        showMorePopOver: true,
      });
    });
  };

  _updateAddRef = ref => {
    if (ref) {
      this._addRef = ref;
    }
  };

  _updateMoreRef = ref => {
    if (ref) {
      this._moreRef = ref;
    }
  };

  _hideAddTaskPopOver = () => {
    this.setState({
      showAddTaskPopOver: false,
    });
  };

  _hideMorePopOver = () => {
    this.setState({
      showMorePopOver: false,
    });
  };

  _gotoNewTaskPage = (page: string) => {
    this._hideAddTaskPopOver();
    this.props.navigation.navigate(page);
  };

  _canDownload = () => {
    const { connectionType } = this.props;
    if (connectionType === CONNECTION_STATUS.cellular) {
      return false;
    }
    return true;
  };

  _startDownload = () => {
    const { tasks, dispatch } = this.props;
    const needStartTaskIds = [];
    const needRestartTaskIds = [];
    for (let i = 0, len = tasks.length; i < len; i += 1) {
      const { id, status, visible } = tasks[i];
      if (visible) {
        if (status === TASK_STATUS.PAUSED) {
          needStartTaskIds.push(id);
        }
        if (status === TASK_STATUS.FAILED) {
          needRestartTaskIds.push(id);
        }
      }
    }
    dispatch(DownloadAction.resumeTasks(needStartTaskIds));
    dispatch(DownloadAction.restartTasks(needRestartTaskIds));
  };

  _startAllTasks = () => {
    this._hideMorePopOver();
    if (this._canDownload()) {
      this._startDownload();
      return;
    }
    this.setState({ showCellularPopUp: true });
  };

  _pauseAllTasks = () => {
    this._hideMorePopOver();
    const { tasks, dispatch } = this.props;
    const needPauseTaskIds = [];
    for (let i = 0, len = tasks.length; i < len; i += 1) {
      const { id, status } = tasks[i];
      if (status === TASK_STATUS.RUNNING || status === TASK_STATUS.PENDING) {
        needPauseTaskIds.push(id);
      }
    }
    dispatch(DownloadAction.pauseTasks(needPauseTaskIds));
  };

  _gotoMultiSelect = () => {
    this._hideMorePopOver();
    this.props.navigation.navigate(ROUTE_NAMES.downloadRecords);
  };

  _gotoDownloadSetting = () => {
    this._hideMorePopOver();
    this.props.navigation.navigate(ROUTE_NAMES.downloadSetting);
  };

  _renderAddTaskPopOver = () => {
    const { showAddTaskPopOver } = this.state;
    return (
      showAddTaskPopOver && (
        <PopOverMenu
          position={this._addTaskPopOverPosition}
          onClose={this._hideAddTaskPopOver}
          config={[
            {
              icon: 'download_link',
              title: '添加下载链接',
              onPress: () => {
                this._gotoNewTaskPage(ROUTE_NAMES.addNewLink);
              },
            },
            {
              icon: 'download_bt',
              title: '添加BT任务',
              onPress: () => {
                this._gotoNewTaskPage(ROUTE_NAMES.scanBTFile);
              },
            },
          ]}
        />
      )
    );
  };

  _renderMorePopOver = () => {
    const { showMorePopOver } = this.state;
    return (
      showMorePopOver && (
        <PopOverMenu
          position={this._morePopOverPosition}
          onClose={this._hideMorePopOver}
          config={[
            { icon: 'download_continue', title: '全部开始', onPress: this._startAllTasks },
            { icon: 'download_pause', title: '全部暂停', onPress: this._pauseAllTasks },
            { icon: 'download_select', title: '多选操作', onPress: this._gotoMultiSelect },
            { icon: 'download_config', title: '下载设置', onPress: this._gotoDownloadSetting },
          ]}
        />
      )
    );
  };

  _renderCellularPopUp = () => this.state.showCellularPopUp && (
      <CellularDownloadPopUp
        onClose={() => {
          this.setState({ showCellularPopUp: false });
        }}
        onConfirm={() => {
          this.setState({ showCellularPopUp: false });
          this._startDownload();
        }}
      />
  );

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.downloadStatus}>{this.props.downloadStatus}</Text>
        <View style={styles.headerRightContainer}>
          <Button
            icon={{
              name: 'plus',
              size: fitSize(18),
              color: STYLE_CONSTANT.appHeaderTextColor,
            }}
            type={ButtonType.clear}
            onPress={this._showAddTaskPopOver}
            setRef={this._updateAddRef}
            containerStyle={styles.buttonContainer}
          />
          <Button
            icon={{ name: 'menu', size: fitSize(18), color: STYLE_CONSTANT.appHeaderTextColor }}
            onPress={this._showMorePopOver}
            type={ButtonType.clear}
            setRef={this._updateMoreRef}
            containerStyle={styles.buttonContainer}
          />
        </View>
        {this._renderAddTaskPopOver()}
        {this._renderMorePopOver()}
        {this._renderCellularPopUp()}
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { tasks } = state.Download;
  const { connectionType } = state.Common;
  return {
    tasks,
    connectionType,
  };
};

export default connect(mapStateToProps)(DownloadHeader);
