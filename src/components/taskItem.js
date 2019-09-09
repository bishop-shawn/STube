// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Image, Text, TouchableHighlight } from 'react-native';
import { connect } from 'react-redux';
import Icon from './icon';
import DownloadTask from '../model/downloadTask';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT, TASK_TYPE, TASK_STATUS } from '../constant';
import { fitSize, toReadableSize, secondToUnitString, isTorrent, toPercentString } from '../util/baseUtil';
import { getCategory, translateErrorMessage } from '../util/taskUtil';
import DownloadAction from '../redux/actions/download';
import DownloadService from '../service/downloadService';

const styles = StyleSheet.create({
  taskContainer: {
    marginTop: fitSize(10),
    backgroundColor: STYLE_CONSTANT.itemBackgroundColor,
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    paddingHorizontal: fitSize(10),
    paddingTop: fitSize(10),
  },
  poster: {
    justifyContent: 'center',
    alignItems: 'center',
    width: fitSize(40),
    height: fitSize(40),
    borderRadius: 4,
  },
  taskName: {
    flex: 1,
    marginLeft: fitSize(10),
    width: '100%',
    fontSize: fitSize(15),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  taskInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: fitSize(60),
    paddingVertical: fitSize(3),
  },
  fileSize: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(13),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  playingContainer: {
    height: fitSize(16),
    flexDirection: 'row',
    marginRight: fitSize(10),
    alignItems: 'center',
    backgroundColor: 'rgb(229,238,255)',
    paddingHorizontal: fitSize(3),
  },
  playingTitle: {
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.themeColor,
    // marginLeft: fitSize(2),
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    paddingHorizontal: fitSize(10),
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
  containerStyle: Object,
  task: DownloadTask,
  isSpeedUping: boolean,
  dispatch: Function,
  onLongPress: Function,
  onPress: Function,
  onOpenTask: Function,
  onSpeedUp: Function,
  showActionButton?: boolean,
  onRestartTask: Function,
  onResumeTask: Function,
};
type State = {
  failedBtTasks: numbedr,
};

class TaskItem extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this._lastTaskData = null;
    this.state = {
      failedBtTasks: 0,
    };
  }

  componentDidMount() {
    const { task }: DownloadTask = this.props;
    if (task.type === TASK_TYPE.BT && task.status === TASK_STATUS.FAILED) {
      this._setFailedBtTasks(this.props.task.id);
    }
  }

  componentDidUpdate(prevProps) {
    const { task }: DownloadTask = this.props;
    if (task.type === TASK_TYPE.BT && prevProps.task.status === TASK_STATUS.RUNNING && task.status === TASK_STATUS.FAILED) {
      this._setFailedBtTasks(task.id);
    }
  }

  _setFailedBtTasks = taskId => {
    DownloadService.fetchBtSubTasks(taskId).then(btSubTasks => {
      const failedBtTasks = btSubTasks.filter(btTask => btTask.status === TASK_STATUS.PENDING || btTask.status === TASK_STATUS.FAILED).length;
      this.setState({ failedBtTasks });
    });
  };

  _notEqual(oldObj, newObj) {
    let notEqual = false;
    if (oldObj) {
      const keys = Object.keys(oldObj);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (typeof oldObj[key] !== 'object' && oldObj[key] !== newObj[key]) {
          notEqual = true;
          break;
        }
      }
    } else {
      notEqual = true;
    }
    return notEqual;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this._notEqual(this.state, nextState) || this._notEqual(this.props.task, nextProps.task);
  }

  _getErrorMsg = (task: DownloadTask) => {
    if (this.state.failedBtTasks > 0) {
      return `${this.state.failedBtTasks}个BT子文件下载失败`;
    }
    return translateErrorMessage(task);
  };

  _renderDownloadingStatus = (task: DownloadTask) => {
    if (!task.isFileExist && task.progress > 0) {
      this.props.dispatch(DownloadAction.pauseTasks([task.id]));
      this.props.dispatch(DownloadAction.resumeTasks([task.id]));
    }
    return (
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
        {this.props.showActionButton && (
          <View style={styles.statusItemContainer}>
            {task.isSpeedUp || (
              <Button
                loading={this.props.isSpeedUping}
                title="加速"
                color="orange"
                type={ButtonType.outline}
                containerStyle={styles.actionButtonContainer}
                titleStyle={styles.actionButtonTitle}
                onPress={this.props.onSpeedUp}
                image={require('../resource/speedup.png')}
                imageStyle={{ width: fitSize(8), height: fitSize(14) }}
              />
            )}
            <Button
              title="暂停"
              type={ButtonType.outline}
              containerStyle={styles.actionButtonContainer}
              titleStyle={styles.actionButtonTitle}
              onPress={() => {
                this.props.dispatch(DownloadAction.pauseTasks([task.id]));
              }}
              icon={{ name: 'pause', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
            />
          </View>
        )}
      </View>
    );
  };

  _renderPausedStatus = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusInfo}>已暂停</Text>
      {this.props.showActionButton && (
        <Button
          title="继续"
          color={STYLE_CONSTANT.themeColor}
          type={ButtonType.outline}
          containerStyle={styles.actionButtonContainer}
          titleStyle={styles.actionButtonTitle}
          onPress={this.props.onResumeTask}
          icon={{ name: 'download_continue', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
        />
      )}
    </View>
  );

  _renderPendingStatus = task => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusInfo}>等待中</Text>
      {this.props.showActionButton && (
        <Button
          title="暂停"
          type={ButtonType.outline}
          containerStyle={styles.actionButtonContainer}
          titleStyle={styles.actionButtonTitle}
          onPress={() => {
            this.props.dispatch(DownloadAction.pauseTasks([task.id]));
          }}
          icon={{ name: 'pause', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
        />
      )}
    </View>
  );

  _renderExceptionStatus = task => (
    <View style={styles.statusContainer}>
      <View style={styles.statusItemContainer}>
        <Icon name="no_resource" color="rgb(225,45,45)" size={fitSize(15)} />
        <Text style={styles.statusInfo}>{this._getErrorMsg(task)}</Text>
      </View>
      {this.props.showActionButton && (
        <Button
          title="重试"
          color={STYLE_CONSTANT.themeColor}
          type={ButtonType.outline}
          containerStyle={styles.actionButtonContainer}
          titleStyle={styles.actionButtonTitle}
          onPress={task.isFileExist ? this.props.onResumeTask : this.props.onRestartTask}
          icon={{ name: 'retry', color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
        />
      )}
    </View>
  );

  _renderSuccessStatus = (task: DownloadTask) => {
    let actionIcon = '';
    let actionTitle = '';
    let handlePress = null;
    let canOpen = false;
    if (task.isFileExist === false) {
      actionTitle = '重试';
      actionIcon = 'retry';
      handlePress = this.props.onRestartTask;
      canOpen = true;
    } else if (getCategory(task.name) === 'video') {
      actionTitle = '播放';
      actionIcon = 'play';
      handlePress = this.props.onOpenTask;
      canOpen = true;
    } else if (isTorrent(task.name) || task.type === TASK_TYPE.BT) {
      actionTitle = '打开';
      actionIcon = 'open_downloaded';
      handlePress = this.props.onOpenTask;
      canOpen = true;
    }
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusInfo}>{task.isFileExist ? '已完成' : '文件已移除'}</Text>
        {this.props.showActionButton && canOpen && (
          <Button
            title={actionTitle}
            color={STYLE_CONSTANT.themeColor}
            type={ButtonType.outline}
            containerStyle={styles.actionButtonContainer}
            titleStyle={styles.actionButtonTitle}
            onPress={handlePress}
            icon={{ name: actionIcon, color: STYLE_CONSTANT.themeColor, size: fitSize(12) }}
          />
        )}
      </View>
    );
  };

  _renderTaskStatus = (task: DownloadTask) => {
    switch (task.status) {
      case TASK_STATUS.PENDING:
        return this._renderPendingStatus(task);
      case TASK_STATUS.RUNNING:
        return this._renderDownloadingStatus(task);
      case TASK_STATUS.PAUSED:
        return this._renderPausedStatus(task);
      case TASK_STATUS.SUCCESS:
        return this._renderSuccessStatus(task);
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

  _handlePress = () => {
    const { onPress, task } = this.props;
    let canPress = true;
    switch (task.status) {
      case TASK_STATUS.SUCCESS:
        if (!task.isFileExist) {
          canPress = false;
        }
        break;
      case TASK_STATUS.FAILED:
        if (task.type === TASK_TYPE.BT && task.progress > 0) {
          canPress = true;
        } else {
          canPress = false;
        }
        break;
      default:
        break;
    }
    if (canPress && onPress) {
      this.props.onPress();
    }
  };

  render() {
    const { task, containerStyle, onLongPress, onPress } = this.props;
    const canPlay = task.status !== TASK_STATUS.SUCCESS && (getCategory(task.name) === 'video' || task.type === TASK_TYPE.BT);
    return (
      <TouchableHighlight
        style={[styles.taskContainer, containerStyle]}
        disabled={!(onPress || onLongPress)}
        underlayColor={STYLE_CONSTANT.checkedColor}
        onLongPress={onLongPress}
        onPress={this._handlePress}
      >
        <View>
          <View style={styles.taskHeader}>
            <Image source={task.poster} style={styles.poster} resizeMode="contain" />
            <Text style={styles.taskName} numberOfLines={2}>
              {task.name}
            </Text>
          </View>
          <View style={styles.taskInfoContainer}>
            {canPlay && (
              <View style={styles.playingContainer}>
                <Icon name="play" color={STYLE_CONSTANT.themeColor} size={fitSize(12)} />
                <Text style={styles.playingTitle}>边下边播</Text>
              </View>
            )}
            <Text style={styles.fileSize}>{toReadableSize(task.fileSize)}</Text>
          </View>
          {this._renderProgress(task)}
          {this._renderTaskStatus(task)}
        </View>
      </TouchableHighlight>
    );
  }
}

TaskItem.defaultProps = {
  showActionButton: true,
};

export default connect()(TaskItem);
