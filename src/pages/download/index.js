// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Clipboard, FlatList, View } from 'react-native';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';
import PageContainer from '../../components/pageContainer';
import Header from './header';
import DownloadTab, { DOWNLOAD_TABS } from './downloadTab';
import DownloadFooter from './downloadFooter';
import { ROUTE_NAMES, TASK_STATUS, TASK_TYPE, CONNECTION_STATUS, STYLE_CONSTANT } from '../../constant';
import Loading from '../../components/loading';
import DownloadTask from '../../model/downloadTask';
import DownloadAction from '../../redux/actions/download';
import { showToast, toReadableSize, infoHashToMagnet, fitSize } from '../../util/baseUtil';
import RenamePopUp from './renamePopUp';
import DeletePopUp from '../../components/deletePopUp';
import selectFilePopUper from '../../components/selectFilePopUper';
import TaskItem from '../../components/taskItem';
import DownloadSDK from '../../sdk/downloadSDK';
import { getCategory } from '../../util/taskUtil';
import InterestPopUp from '../../components/interestPopUp';
import CellularDownloadPopUp from '../../components/cellularDownloadPopUp';
import reporter, { REPORT_KEYS } from '../../util/reporter';
import DeviceInfo from '../../util/deviceInfo';
import EmptyHint from '../../components/emptyHint';
import CommonAction from '../../redux/actions/common';
import watchRecordService from '../../service/watchRecordService';

const ACTION_SHEET_INDEX = {
  copy: 0,
  rename: 1,
  delete: 2,
  cancel: 3,
};

type Props = {
  navigation: Object,
  tasks: DownloadTask[],
  loadingTask: boolean,
  dispatch: Function,
  connectionType: string,
};

type State = {
  selectedTab: string,
  showRenamePopUp: boolean,
  showDeletePopUp: boolean,
  downloadStatus: string,
  isParsingBT: boolean,
  showSelectFilePopUp: boolean,
  startInterest: boolean,
  showCellularPopUp: boolean,
  speedUpTaskId: string,
  avalibleStorage: number,
  usedStorage: number,
  isLongPress: boolean,
};

class Download extends Component<Props, State> {
  static navigationOptions = {
    header: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedTab: DOWNLOAD_TABS.all,
      showRenamePopUp: false,
      showDeletePopUp: false,
      downloadStatus: '',
      startInterest: false,
      showCellularPopUp: false,
      speedUpTaskId: null,
      avalibleStorage: -1,
      usedStorage: -1,
      isLongPress: false,
    };
    this._isResume = false;
    this._torrentInfo = null;
    this._loadOnce = false;
    this.props.dispatch(DownloadAction.fetchTasks());
    this._didFocusListener = null;
    this._updateStorageInfoTimer = null;
  }

  componentDidMount() {
    this._didFocusListener = this.props.navigation.addListener('didFocus', () => {
      this._updateStorageInfo();
    });
  }

  static getDerivedStateFromProps(props) {
    const tasks = props.tasks.filter((task: DownloadTask) => task.visible);
    if (tasks.length === 0) {
      return { downloadStatus: '无任务' };
    }
    if (props.connectionType === CONNECTION_STATUS.none || props.connectionType === CONNECTION_STATUS.unknown) {
      return { downloadStatus: '无网络连接' };
    }
    let speed = 0;
    let isDownloading = false;
    let isPaused = false;
    let successCount = 0;
    tasks.forEach((task: DownloadTask) => {
      if (!task.visible) return;
      switch (task.status) {
        case TASK_STATUS.RUNNING:
          isDownloading = true;
          speed += task.speed;
          break;
        case TASK_STATUS.PAUSED:
          isPaused = true;
          break;
        case TASK_STATUS.SUCCESS:
          successCount += 1;
          break;
        default:
      }
    });
    let downloadStatus = '下载完成';
    if (isDownloading) {
      downloadStatus = `${toReadableSize(speed)}/s`;
    } else if (isPaused) {
      downloadStatus = '下载暂停';
    } else if (successCount !== tasks.length) {
      downloadStatus = '无法下载';
    }
    return { downloadStatus };
  }

  componentWillUnmount() {
    clearTimeout(this._updateStorageInfoTimer);
    this._didFocusListener.remove();
  }

  shouldComponentUpdate(nextProps) {
    if (!nextProps.navigation.isFocused()) {
      return false;
    }
    if (nextProps.loadingTask && this._loadOnce) {
      return false;
    }
    return true;
  }

  _updateStorageInfo = () => {
    clearTimeout(this._updateStorageInfoTimer);
    DeviceInfo.getFreeDiskStorage().then(avalibleStorage => {
      this.props.dispatch(CommonAction.updateStorageInfo(avalibleStorage));
      const usedStorage = this.props.tasks.reduce((acc, task: DownloadTask) => acc + task.currentBytes, 0);
      this.setState({ usedStorage, avalibleStorage });
      this._updateStorageInfoTimer = setTimeout(() => {
        this._updateStorageInfo();
      }, 10000);
    });
  };

  _updateTabStatus = (selectedTab: string) => {
    this.setState({ selectedTab });
  };

  _getFilteredTasks = tasks => {
    const { selectedTab } = this.state;
    const filteredTasks = tasks.filter((task: DownloadTask) => {
      const visible = task.visible || global.showAllTasks;
      if (selectedTab === DOWNLOAD_TABS.all) {
        return visible;
      }
      if (selectedTab === DOWNLOAD_TABS.completed) {
        return visible && task.status === TASK_STATUS.SUCCESS;
      }
      if (selectedTab === DOWNLOAD_TABS.downloding) {
        return visible && task.status !== TASK_STATUS.SUCCESS;
      }
      return false;
    });
    return filteredTasks;
  };

  _startParseBTFile = (path: string) => {
    selectFilePopUper.show({ path });
  };

  _updateSelectedTask = (task: DownloadTask) => {
    this._selectedTask = task;
    this._ActionSheet.show();
    this.setState({ isLongPress: true });
  };

  _gotoPlayer = (task: DownloadTask) => {
    this.props.navigation.navigate(ROUTE_NAMES.downloadingPlayer, { taskId: task.id });
  };

  _onOpenTask = (task: DownloadTask) => {
    const canPlay = getCategory(task.name) === 'video' || task.type === TASK_TYPE.BT;
    if (canPlay) {
      this._gotoPlayer(task);
    } else {
      this._startParseBTFile(task.path);
    }
  };

  _onCopyUrl = () => {
    this.setState({ isLongPress: false });
    if (this._selectedTask.type === TASK_TYPE.BT) {
      Clipboard.setString(infoHashToMagnet(this._selectedTask.infoHash));
    } else {
      Clipboard.setString(this._selectedTask.url);
    }
  };

  _handleActionPressed = (index: number) => {
    switch (index) {
      case ACTION_SHEET_INDEX.copy:
        this._onCopyUrl();
        showToast('复制成功');
        break;
      case ACTION_SHEET_INDEX.rename:
        this.setState({ showRenamePopUp: true });
        break;
      case ACTION_SHEET_INDEX.delete:
        this.setState({ showDeletePopUp: true });
        break;
      default:
        this.setState({ isLongPress: false });
    }
  };

  _renameTask = (newName: string) => {
    DownloadSDK.renameTask(this._selectedTask.id, newName);
  };

  _deleteTask = (deleteFile: boolean) => {
    reporter.delete({
      [REPORT_KEYS.url]: this._selectedTask.type === TASK_STATUS.BT ? `bt://${this._selectedTask.infoHash}` : this._selectedTask.url,
    });
    if (this._selectedTask.infoHash) {
      DownloadSDK.deleteTorrentInfo([this._selectedTask.infoHash]);
    }
    watchRecordService.deleteRecordsByTaskId([this._selectedTask.id]);
    this.props.dispatch(DownloadAction.deleteTasks([this._selectedTask.id], deleteFile));
  };

  _closeRenamePopUp = () => {
    this.setState({ isLongPress: false });
    this.setState({ showRenamePopUp: false });
  };

  _closeDeletePopUp = () => {
    this.setState({ isLongPress: false });
    this.setState({ showDeletePopUp: false });
  };

  _onResumeTask = () => {
    this._isResume = true;
    if (this._canDownload()) {
      this.props.dispatch(DownloadAction.resumeTasks([this._selectedTask.id]));
      return;
    }
    this.setState({ showCellularPopUp: true });
  };

  _onRestartTask = () => {
    this._isResume = false;
    if (this._canDownload()) {
      this.props.dispatch(DownloadAction.restartTasks([this._selectedTask.id]));
      return;
    }
    this.setState({ showCellularPopUp: true });
  };

  _canDownload = () => {
    const { connectionType } = this.props;
    if (connectionType === CONNECTION_STATUS.cellular) {
      return false;
    }
    return true;
  };

  _onConfirm = () => {
    this.setState({ showCellularPopUp: false });
    if (this._isResume) {
      this.props.dispatch(DownloadAction.resumeTasks([this._selectedTask.id]));
    } else {
      this.props.dispatch(DownloadAction.restartTasks([this._selectedTask.id]));
    }
  };

  _renderDownloadItem = (data: Object) => {
    const task: DownloadTask = data.item;
    const containerStyle = this.state.isLongPress && this._selectedTask && this._selectedTask.id === task.id ? { backgroundColor: STYLE_CONSTANT.checkedColor } : {};
    return (
      <TaskItem
        task={task}
        onPress={() => {
          if (getCategory(task.name) === 'video' || task.type === TASK_TYPE.BT) {
            this._gotoPlayer(task);
          }
        }}
        onLongPress={() => {
          this._updateSelectedTask(task);
        }}
        onOpenTask={() => {
          this._onOpenTask(task);
        }}
        onResumeTask={() => {
          this._selectedTask = task;
          this._onResumeTask();
        }}
        onRestartTask={() => {
          this._selectedTask = task;
          this._onRestartTask();
        }}
        onSpeedUp={() => {
          this._selectedTask = task;
          this.setState({ startInterest: true, speedUpTaskId: task.id });
        }}
        isSpeedUping={this.state.speedUpTaskId === task.id}
        containerStyle={containerStyle}
      />
    );
  };

  _renderTaskList = () => {
    const { loadingTask, tasks } = this.props;
    const filteredTasks = this._getFilteredTasks(tasks);
    if (loadingTask && !this._loadOnce && filteredTasks.length <= 0) {
      this._loadOnce = true;
      return <Loading />;
    }
    return filteredTasks.length === 0 ? (
      <EmptyHint title="暂无任务" image={require('../../resource/no_tasks.png')} />
    ) : (
      <FlatList
        ItemSeparatorComponent={() => <View style={{ width: '100%', height: fitSize(10) }} />}
        data={filteredTasks}
        renderItem={this._renderDownloadItem}
        extraData={this.state.isLongPress}
        keyExtractor={item => item.id}
        initialNumToRender={6}
      />
    );
  };

  _renderDownloadFooter = () => {
    const { usedStorage, avalibleStorage } = this.state;
    return avalibleStorage >= 0 && <DownloadFooter usedStorage={usedStorage} avalibleStorage={avalibleStorage} />;
  };

  _renderActionSheet = () => (
    <ActionSheet
      options={['复制下载链接', '重命名', '删除', '取消']}
      destructiveButtonIndex={ACTION_SHEET_INDEX.delete}
      cancelButtonIndex={ACTION_SHEET_INDEX.cancel}
      onPress={this._handleActionPressed}
      ref={ref => {
        if (ref) {
          this._ActionSheet = ref;
        }
      }}
    />
  );

  _renderRenamePopUp = () => {
    if (!this.state.showRenamePopUp) {
      return null;
    }
    return <RenamePopUp onClose={this._closeRenamePopUp} preName={this._selectedTask.name} rename={this._renameTask} />;
  };

  _renderDeletePopUp = () => {
    if (!this.state.showDeletePopUp) {
      return null;
    }
    return (
      <DeletePopUp
        onClose={this._closeDeletePopUp}
        deleteCount={1}
        fileSize={toReadableSize(this._selectedTask.fileSize)}
        deleteFile={this._selectedTask.status === TASK_STATUS.SUCCESS}
        onDelete={this._deleteTask}
      />
    );
  };

  _renderInterestPopUp = () => {
    const { startInterest } = this.state;
    return (
      startInterest && (
        <InterestPopUp
          navigation={this.props.navigation}
          task={this._selectedTask}
          onFinished={() => {
            this.setState({ startInterest: false });
            this.forceUpdate();
          }}
          onBalanceChecked={() => {
            setTimeout(() => {
              this.setState({ speedUpTaskId: null });
            }, 500);
          }}
        />
      )
    );
  };

  _renderCellularPopUp = () => this.state.showCellularPopUp && (
      <CellularDownloadPopUp
        onClose={() => {
          this.setState({ showCellularPopUp: false });
        }}
        onConfirm={this._onConfirm}
      />
  );

  render() {
    const { selectedTab, downloadStatus } = this.state;
    return (
      <PageContainer>
        <Header navigation={this.props.navigation} downloadStatus={downloadStatus} />
        <DownloadTab selectedTab={selectedTab} onTabPressed={this._updateTabStatus} />
        {this._renderTaskList()}
        {this._renderDownloadFooter()}
        {this._renderActionSheet()}
        {this._renderRenamePopUp()}
        {this._renderDeletePopUp()}
        {this._renderInterestPopUp()}
        {this._renderCellularPopUp()}
      </PageContainer>
    );
  }
}

const mapStateToProps = state => {
  const { connectionType } = state.Common;
  const { tasks, loadingTask } = state.Download;
  return { tasks, loadingTask, connectionType };
};

export default connect(mapStateToProps)(Download);
