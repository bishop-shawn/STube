// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PageContainer from '../../components/pageContainer';
import { sleep, infoHashToMagnet, uuid } from '../../util/baseUtil';
import Player from '../../components/player/player';
import { TASK_TYPE, TASK_STATUS } from '../../constant';
import DownloadTask from '../../model/downloadTask';
import WatchRecord from '../../model/watchRecord';
import DownloadAction from '../../redux/actions/download';
import TaskInfo from './taskInfo';
import { getCategory } from '../../util/taskUtil';
import DeviceInfo from '../../util/deviceInfo';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';
import watchRecordService from '../../service/watchRecordService';
import DownloadSDK from '../../sdk/downloadSDK';

const playUrlRetryCount = 10;
const notchHeight = DeviceInfo.getNotchHeight();

type Props = {
  navigation: Object,
  tasks: DownloadTask[],
  subTasks: Object[],
  dispatch: Function,
};
type State = {
  task: DownloadTask,
  videoTasks: Object[],
  playingSubTask: Object,
  isLandscapeFullScreen: Boolean,
  isPortraitFullScreen: Boolean,
  startPlayTime: Number,
  playUrl: String,
};
class DownloadingPlayer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      task: null,
      videoTasks: [],
      playingSubTask: null,
      isLandscapeFullScreen: false,
      isPortraitFullScreen: false,
      startPlayTime: 0,
      playUrl: null,
    };
    // in case that user go to watch record to play directly
    props.dispatch(DownloadAction.fetchTasks());
    this._getUrlCount = playUrlRetryCount;
  }

  componentDidMount() {
    this._getBTSubtasks();
    this._reportEnterPlay();
    this._initPlayState();
  }

  static getDerivedStateFromProps(props) {
    const taskId = props.navigation.getParam('taskId');
    let task: DownloadTask = null;
    const { tasks } = props;
    for (let i = 0, len = tasks.length; i < len; i += 1) {
      if (tasks[i].id === taskId) {
        task = tasks[i];
        break;
      }
    }
    const videoTasks = props.subTasks.filter(subTask => getCategory(subTask.name) === 'video');
    return { task, videoTasks };
  }

  componentWillUnmount() {
    clearTimeout(this._fetchSubTaskTimer);
    clearTimeout(this._reportEnterPlayTimer);
    this.props.dispatch(DownloadAction.clearBtSubTasks(this.props.navigation.getParam('taskId')));
    this._cancelSetPlayTask();
  }

  _initPlayState = () => {
    const { videoTasks, task } = this.state;
    if (!task || (task.type === TASK_TYPE.BT && this.props.subTasks.length === 0)) {
      setTimeout(() => {
        this._initPlayState();
      }, 300);
      return;
    }
    let playingSubTask = videoTasks.length > 0 ? videoTasks[0] : null;
    let startPlayTime = 0;
    const taskUrl = videoTasks.length > 0 ? infoHashToMagnet(task.infoHash) : task.url;
    this._watchRecords = watchRecordService.getRecordByTaskUrl(taskUrl);
    if (this._watchRecords.length > 0) {
      if (videoTasks.length > 0) {
        const allSubTaskIndex = videoTasks.map(videoTask => videoTask.index);
        const subTaskIndex = this.props.navigation.getParam('subTaskIndex');
        const watchRecord = this._watchRecords.find((record: WatchRecord) => {
          if (subTaskIndex >= 0) {
            return record.subTaskIndex === subTaskIndex;
          }
          return allSubTaskIndex.includes(record.subTaskIndex);
        });
        if (watchRecord) {
          playingSubTask = videoTasks.find(subTask => subTask.index === watchRecord.subTaskIndex);
          startPlayTime = watchRecord.playProgress;
        }
      } else {
        startPlayTime = this._watchRecords[0].playProgress;
      }
    }
    this.setState({ startPlayTime, playingSubTask });
  };

  _initPlayUrl = async () => {
    if (this._getUrlCount === 0) {
      return;
    }
    const { task, playingSubTask } = this.state;
    if (task && task.path && task.isFileExist) {
      const playingTask = task.type === TASK_TYPE.BT ? playingSubTask : task;
      let filePath = null;
      let downloadSuccess = false;
      if (playingTask) {
        filePath = playingTask.path;
        downloadSuccess = playingTask.status === TASK_STATUS.SUCCESS;
      }
      console.log('getPlayUrl-file path:', filePath);
      if (downloadSuccess) {
        this.setState({ playUrl: filePath });
        return;
      }
      if (filePath) {
        try {
          const playUrl = await DownloadSDK.getPlayUrl(filePath);
          if (playUrl) {
            this.setState({ playUrl });
            console.log('getPlayUrl-success:', playUrl);
            return;
          }
        } catch (error) {
          console.log('getPlayUrl-error:', error);
        }
      }
    }
    this._getUrlCount -= 1;
    setTimeout(() => {
      this._initPlayUrl();
    }, 1000);
  };

  setPlayTask = () => {
    const { task, videoTasks, playingSubTask } = this.state;
    if (task.status === TASK_STATUS.SUCCESS || (videoTasks.length > 0 && playingSubTask.status === TASK_STATUS.SUCCESS)) {
      return;
    }
    if (task.type !== TASK_TYPE.BT) {
      DownloadSDK.setPlayTask(task.id, '-1');
      return;
    }
    DownloadSDK.setPlayTask(task.id, `${playingSubTask.index}`);
  };

  _cancelSetPlayTask = () => {
    const { task, videoTasks, playingSubTask } = this.state;
    if (task.status === TASK_STATUS.SUCCESS || (videoTasks.length > 0 && playingSubTask.status === TASK_STATUS.SUCCESS)) {
      return;
    }
    DownloadSDK.setPlayTask('-1', '0');
  };

  _onStartLoading = async () => {
    const { playingSubTask, task } = this.state;
    if ((task && task.status === TASK_STATUS.SUCCESS) || (playingSubTask && playingSubTask.status === TASK_STATUS.SUCCESS)) {
      return;
    }
    this._resumeTask();
    await sleep(1000);
    this.setPlayTask();
  };

  _onStopLoading = () => {
    this.props.dispatch(DownloadAction.pauseTasks([this.props.navigation.getParam('taskId')]));
  };

  _saveProgress = () => {
    const { task, videoTasks, playingSubTask, playUrl } = this.state;
    if (!playUrl) {
      return;
    }
    let newRecord: WatchRecord = null;
    if (videoTasks.length > 0) {
      const subTaskIndex = playingSubTask.index;
      const oldRecord = this._watchRecords.find((watchRecord: WatchRecord) => watchRecord.subTaskIndex === subTaskIndex);
      if (oldRecord) {
        newRecord = oldRecord;
      } else {
        newRecord = new WatchRecord();
        newRecord.id = uuid();
        newRecord.name = playingSubTask.name;
        newRecord.size = playingSubTask.fileSize;
        newRecord.subTaskIndex = playingSubTask.index;
        newRecord.taskUrl = infoHashToMagnet(task.infoHash);
      }
    } else if (this._watchRecords.length > 0) {
      [newRecord] = this._watchRecords;
    } else {
      const { url, name, fileSize } = task;
      newRecord = new WatchRecord();
      newRecord.id = uuid();
      newRecord.name = name;
      newRecord.size = fileSize;
      newRecord.subTaskIndex = -1;
      newRecord.taskUrl = url;
    }
    newRecord.fromHome = false;
    newRecord.playProgress = this._player.getCurrentTime();
    newRecord.taskId = task.id;
    newRecord.watchTime = new Date();
    watchRecordService.addWatchRecord(newRecord);
    if (!this._watchRecords.includes(newRecord)) {
      this._watchRecords.push(newRecord);
    }
  };

  _updateTaskStatus = async status => {
    if (status === TASK_STATUS.RUNNING && this._player) {
      await sleep(1000);
      this.setPlayTask();
    }
  };

  _reportEnterPlay = () => {
    const { task } = this.state;
    if (task) {
      reporter.enterPlay({
        [REPORT_KEYS.type]: DataMap.type_download,
        [REPORT_KEYS.url]: task.url,
      });
      return;
    }
    this._reportEnterPlayTimer = setTimeout(this._reportEnterPlay, 1000);
  };

  _reporterMedia = canPlay => {
    reporter.media({
      [REPORT_KEYS.type]: DataMap.type_download,
      [REPORT_KEYS.url]: this.state.task.url,
      [REPORT_KEYS.status]: canPlay ? DataMap.status_success : DataMap.status_fail,
    });
  };

  _getBTSubtasks = () => {
    const { task } = this.state;
    if (task && task.type !== TASK_TYPE.BT) {
      return;
    }
    if (task) {
      this.props.dispatch(DownloadAction.fetchBtSubTasks(task.id));
    }
    this._fetchSubTaskTimer = setTimeout(() => {
      this._getBTSubtasks();
    }, 1000);
  };

  _resumeTask = () => {
    const { task } = this.state;
    if (task.status === TASK_STATUS.RUNNING) {
      return;
    }
    if (task.status === TASK_STATUS.FAILED) {
      if (task.isFileExist) {
        this.props.dispatch(DownloadAction.resumeTasks([task.id]));
      } else {
        this.props.dispatch(DownloadAction.restartTasks([task.id]));
      }
    } else if (task.status === TASK_STATUS.PAUSED) {
      this.props.dispatch(DownloadAction.resumeTasks([task.id]));
    }
  };

  _switchPlayingVideo = (videoTask: Object) => {
    const { playingSubTask, task } = this.state;
    if (videoTask.status !== TASK_STATUS.SUCCESS) {
      this._resumeTask();
    }
    if (!playingSubTask || !task || !videoTask) {
      return;
    }
    if (videoTask.index !== playingSubTask.index) {
      this._saveProgress();
      this.setState({ playingSubTask: videoTask }, () => {
        this._getUrlCount = playUrlRetryCount;
        this._initPlayUrl();
        const watchRecord = this._watchRecords.find((record: WatchRecord) => record.subTaskIndex === this.state.playingSubTask.index);
        const startPlayTime = watchRecord ? watchRecord.playProgress : 0;
        this.setState({ startPlayTime });
      });
    }
  };

  _setPlayer = ref => {
    if (ref) {
      this._player = ref;
    }
  };

  _onPlayerSizeChange = (info: Object) => {
    if (info.isLandscapeFullScreen) {
      this.setState({ isLandscapeFullScreen: true, isPortraitFullScreen: false });
    } else if (info.isPortraitFullScreen) {
      this.setState({ isLandscapeFullScreen: false, isPortraitFullScreen: true });
    } else {
      this.setState({ isLandscapeFullScreen: false, isPortraitFullScreen: false });
    }
  };

  _renderPlayer = () => {
    const { videoTasks, playUrl, task, playingSubTask, startPlayTime } = this.state;
    const taskType = task ? task.type : '';
    return (
      <Player
        ref={this._setPlayer}
        navigation={this.props.navigation}
        onLoad={() => {
          this._reporterMedia(true);
        }}
        onError={() => {
          this._reporterMedia();
        }}
        initPause
        url={playUrl}
        videoList={taskType === TASK_TYPE.BT ? videoTasks : [task]}
        onSwitchVideo={this._switchPlayingVideo}
        playingVideo={taskType === TASK_TYPE.BT ? playingSubTask : task}
        onPlayerSizeChange={this._onPlayerSizeChange}
        onFinished={this._saveProgress}
        loadUrl={this._initPlayUrl}
        loadData={this._onStartLoading}
        stopLoadData={this._onStopLoading}
        loadEnd={(task && task.status === TASK_STATUS.SUCCESS) || (playingSubTask && playingSubTask.status === TASK_STATUS.SUCCESS)}
        startPlayTime={startPlayTime}
        speed={task ? task.speed : 0}
      />
    );
  };

  _renderTaskInfo = () => {
    const { task, playingSubTask, isLandscapeFullScreen, isPortraitFullScreen } = this.state;
    if (isPortraitFullScreen || isLandscapeFullScreen || !task) {
      return null;
    }
    return (
      <TaskInfo
        onTaskStatusChange={this._updateTaskStatus}
        playingSubTask={playingSubTask}
        task={task}
        navigation={this.props.navigation}
        subTasks={this.props.subTasks}
        onVideoItemPressed={this._switchPlayingVideo}
      />
    );
  };

  render() {
    const borderTop = this.state.isLandscapeFullScreen || notchHeight === 0 ? { borderTopWidth: 0 } : { borderTopWidth: notchHeight, borderColor: '#000' };
    return (
      <PageContainer style={borderTop}>
        {this._renderPlayer()}
        {this._renderTaskInfo()}
      </PageContainer>
    );
  }
}

const mapStateToProps = state => {
  const { tasks, subTasks } = state.Download;
  const { connectionType } = state.Common;
  return { tasks, subTasks, connectionType };
};

export default connect(mapStateToProps)(DownloadingPlayer);
