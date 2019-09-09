// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/icon';
import DownloadTask from '../../model/downloadTask';
import Button, { ButtonType } from '../../components/button';
import InterestPopUp from '../../components/interestPopUp';
import { STYLE_CONSTANT, TASK_TYPE, TASK_STATUS, CONNECTION_STATUS } from '../../constant';
import { fitSize, toReadableSize, secondToUnitString, toPercentString } from '../../util/baseUtil';
import { translateErrorMessage } from '../../util/taskUtil';
import DownloadAction from '../../redux/actions/download';
import SubTaskList from './subTaskList';
import CellularDownloadPopUp from '../../components/cellularDownloadPopUp';
import configService from '../../service/configService';
import AdComponent from '../../components/adComponent';

const styles = StyleSheet.create({
  taskContainer: {
    marginTop: fitSize(10),
    flex: 1,
    paddingHorizontal: fitSize(10),
  },
  taskName: {
    width: '100%',
    fontSize: fitSize(14),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  taskInfo: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(11),
    paddingVertical: fitSize(3),
  },
  progressContainer: {
    height: fitSize(2),
    backgroundColor: STYLE_CONSTANT.seperatorColor,
    width: '100%',
    marginTop: fitSize(5),
  },
  progress: {
    height: fitSize(2),
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: fitSize(40),
  },
  statusItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontBlackColor,
    marginRight: fitSize(10),
  },
  actionButtonContainer: {
    height: fitSize(25),
    marginLeft: fitSize(8),
    paddingHorizontal: fitSize(3),
  },
  actionButtonTitle: {
    fontSize: fitSize(12),
  },
});

type Props = {
  task: DownloadTask,
  dispatch: Function,
  navigation: Object,
  subTasks: Object[],
  connectionType: string,
  onVideoItemPressed: Function,
  playingSubTask: Object,
  onTaskStatusChange: Function,
};

type State = {
  startInterest: boolean,
  speedUploading: boolean,
  showCellularPopUp: boolean,
  failedBtTasks: number,
};

class TaskInfo extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      startInterest: false,
      showCellularPopUp: false,
      speedUploading: false,
      adBase64: null,
      adLink: null,
      failedBtTasks: 0,
    };
    this._isResume = false;
  }

  componentDidMount() {
    configService.once(configService.keys.playerAd, (path, link, base64) => {
      this.setState({
        adBase64: base64,
        adLink: link,
      });
    });
  }

  static getDerivedStateFromProps(props) {
    const { task, subTasks } = props;
    if (task.type === TASK_TYPE.BT && task.status === TASK_STATUS.FAILED) {
      const failedBtTasks = subTasks.filter(subTask => subTask.status === TASK_STATUS.PENDING || subTask.status === TASK_STATUS.FAILED).length;
      return { failedBtTasks };
    }
    return null;
  }

  _onResumeTask = () => {
    this._isResume = true;
    if (this._canDownload()) {
      this.props.dispatch(DownloadAction.resumeTasks([this.props.task.id]));
      this.props.onTaskStatusChange(TASK_STATUS.RUNNING);
      return;
    }
    this.setState({ showCellularPopUp: true });
  };

  _onRestartTask = () => {
    this._isResume = false;
    if (this._canDownload()) {
      this.props.dispatch(DownloadAction.restartTasks([this.props.task.id]));
      this.props.onTaskStatusChange(TASK_STATUS.RUNNING);
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
      this.props.dispatch(DownloadAction.resumeTasks([this.props.task.id]));
    } else {
      this.props.dispatch(DownloadAction.restartTasks([this.props.task.id]));
    }
  };

  _getErrorMsg = (task: DownloadTask) => {
    if (this.state.failedBtTasks > 0) {
      return `${this.state.failedBtTasks}个BT子文件下载失败`;
    }
    return translateErrorMessage(task);
  };

  _renderDownloadingStatus = (task: DownloadTask) => (
    <View style={styles.statusContainer}>
      {task.speed > 1 ? (
        <View style={styles.statusItemContainer}>
          <Text style={styles.statusInfo}>{`${toReadableSize(task.speed)}/s`}</Text>
          {task.isSpeedUp && <Text style={[styles.statusInfo, { color: 'orange' }]}>{'正在加速中'}</Text>}
          <Text style={[styles.statusInfo, { color: 'gray' }]}>{`还剩${secondToUnitString(task.leftTime)}`}</Text>
        </View>
      ) : (
        <Text style={styles.statusInfo}>连接资源中</Text>
      )}
      <View style={styles.statusItemContainer}>
        {task.isSpeedUp || (
          <Button
            title="加速"
            color="orange"
            type={ButtonType.outline}
            containerStyle={styles.actionButtonContainer}
            titleStyle={styles.actionButtonTitle}
            onPress={() => {
              this.setState({ startInterest: true, speedUploading: true });
            }}
            image={require('../../resource/speedup.png')}
            imageStyle={{ width: fitSize(8), height: fitSize(14) }}
            loading={this.state.speedUploading}
          />
        )}
        <Button
          title="暂停"
          type={ButtonType.outline}
          containerStyle={styles.actionButtonContainer}
          titleStyle={styles.actionButtonTitle}
          onPress={() => {
            this.props.dispatch(DownloadAction.pauseTasks([task.id]));
            this.props.onTaskStatusChange(TASK_STATUS.PAUSED);
          }}
          icon={{ name: 'pause', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
        />
      </View>
    </View>
  );

  _renderPausedStatus = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusInfo}>已暂停</Text>
      <Button
        title="继续"
        color={STYLE_CONSTANT.themeColor}
        type={ButtonType.outline}
        containerStyle={styles.actionButtonContainer}
        titleStyle={styles.actionButtonTitle}
        onPress={this._onResumeTask}
        icon={{ name: 'download_continue', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
      />
    </View>
  );

  _renderExceptionStatus = task => (
    <View style={styles.statusContainer}>
      <View style={styles.statusItemContainer}>
        <Icon name="no_resource" color="rgb(225,45,45)" size={fitSize(15)} />
        <Text style={styles.statusInfo}>{this._getErrorMsg(task)}</Text>
      </View>
      <Button
        title="重试"
        color={STYLE_CONSTANT.themeColor}
        type={ButtonType.outline}
        containerStyle={styles.actionButtonContainer}
        titleStyle={styles.actionButtonTitle}
        onPress={task.isFileExist ? this._onResumeTask : this._onRestartTask}
        icon={{ name: 'retry', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
      />
    </View>
  );

  _renderSuccessStatus = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusInfo}>下载完成</Text>
    </View>
  );

  _renderTaskStatus = (task: DownloadTask) => {
    switch (task.status) {
      case TASK_STATUS.PENDING:
        return (
          <View style={styles.statusContainer}>
            <Text>等待中</Text>
          </View>
        );
      case TASK_STATUS.RUNNING:
        return this._renderDownloadingStatus(task);
      case TASK_STATUS.PAUSED:
        return this._renderPausedStatus(task);
      case TASK_STATUS.SUCCESS:
        return this._renderSuccessStatus();
      default:
        return this._renderExceptionStatus(task);
    }
  };

  _renderProgress = (task: DownloadTask) => {
    let progressColor = 'rgb(164,166,170)';
    switch (task.status) {
      case TASK_STATUS.SUCCESS:
        return null;
      case TASK_STATUS.RUNNING:
        progressColor = STYLE_CONSTANT.themeColor;
        break;
      default:
        break;
    }
    return (
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progress,
            {
              width: toPercentString(task.progress),
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
    );
  };

  _renderInterestPopUp = () => {
    const { startInterest } = this.state;
    return (
      startInterest && (
        <InterestPopUp
          navigation={this.props.navigation}
          task={this.props.task}
          onFinished={() => {
            this.setState({ startInterest: false });
          }}
          onBalanceChecked={() => {
            setTimeout(() => {
              this.setState({ speedUploading: false });
            }, 500);
          }}
        />
      )
    );
  };

  _renderBTFiles = () => {
    const isBT = this.props.task.type === TASK_TYPE.BT;
    if (!isBT) {
      return null;
    }
    const { task, subTasks, onVideoItemPressed, playingSubTask } = this.props;
    return <SubTaskList task={task} subTasks={subTasks} onVideoItemPressed={onVideoItemPressed} playingSubTask={playingSubTask} navigation={this.props.navigation} />;
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
    const { task } = this.props;
    const { adBase64, adLink } = this.state;
    return (
      <View style={styles.taskContainer}>
        <Text style={styles.taskName} numberOfLines={2}>
          {task.name}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.taskInfo}>{toReadableSize(task.fileSize)}</Text>
          <Text style={styles.taskInfo}>{toPercentString(task.progress)}</Text>
        </View>
        {this._renderProgress(task)}
        {this._renderTaskStatus(task)}
        <AdComponent style={{ marginLeft: -fitSize(10) }} base64={adBase64} link={adLink} />
        {this._renderInterestPopUp()}
        {this._renderBTFiles()}
        {this._renderCellularPopUp()}
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { connectionType } = state.Common;
  return { connectionType };
};

export default connect(mapStateToProps)(TaskInfo);
