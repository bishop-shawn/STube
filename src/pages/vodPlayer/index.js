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
import VideoInfo from './videoInfo';
import { getCategory, isMagnet, getCommonPoster } from '../../util/taskUtil';
import DeviceInfo from '../../util/deviceInfo';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';
import watchRecordService from '../../service/watchRecordService';
import DownloadSDK from '../../sdk/downloadSDK';
import dhtVodService from '../../service/dhtVodService';

const playUrlRetryCount = 10;
const notchHeight = DeviceInfo.getNotchHeight();
const DOWNLOAD_LINE = 1;
const VOD_LINE = 2;

type Props = {
  navigation: Object,
  tasks: DownloadTask[],
  subTasks: Object[],
  dispatch: Function,
};
type State = {
  task: DownloadTask,
  videoTasks: Object[],
  playingTask: Object,
  isLandscapeFullScreen: Boolean,
  isPortraitFullScreen: Boolean,
  startPlayTime: Number,
  playUrl: String,
  currentLine: Number,
};

class VodPlayer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      task: null,
      videoTasks: [],
      playingTask: null,
      isLandscapeFullScreen: false,
      isPortraitFullScreen: false,
      startPlayTime: 0,
      playUrl: null,
      currentLine: DOWNLOAD_LINE,
    };
    // in case that user go to watch record to play directly
    props.dispatch(DownloadAction.fetchTasks());
    this._getUrlCount = playUrlRetryCount;
    this._allLines = [DOWNLOAD_LINE];
    this._url = props.navigation.getParam('url');
    this._fileName = props.navigation.getParam('fileName');
    this._isMagnet = isMagnet(this._url);
    this._infoHash = this._isMagnet ? this._url.substr(20, 40) : null;
  }

  componentDidMount() {
    this._setVodInfo();
    this._getBTSubtasks();
    this._reportEnterPlay();
    this._initPlayState();
    this._initPlayUrl();
  }

  static getDerivedStateFromProps(props, state) {
    if (state.currentLine === VOD_LINE) {
      return null;
    }
    const taskId = props.navigation.getParam('taskId');
    let task: DownloadTask = null;
    const { tasks } = props;
    for (let i = 0, len = tasks.length; i < len; i += 1) {
      if (tasks[i].id === taskId) {
        task = tasks[i];
        break;
      }
    }
    const derivedState = { task, videoTasks: props.subTasks };
    if (task && task.type !== TASK_TYPE.BT) {
      Object.assign(derivedState, { playingTask: task });
    }
    return derivedState;
  }

  componentWillUnmount() {
    clearTimeout(this._getVodTasksTimer);
    clearTimeout(this._getSubTaskTimer);
    clearTimeout(this._reportEnterPlayTimer);
    this.props.dispatch(DownloadAction.clearBtSubTasks(this.props.navigation.getParam('taskId')));
    this._stopVod();
    this._cancelSetPlayTask();
    this._handleTask();
  }

  _handleTask = () => {
    const taskId = this.props.navigation.getParam('taskId');
    const task = this.props.tasks.find(item => item.id === taskId);
    if (!task || task.visible) {
      return;
    }
    if (task.type === TASK_TYPE.BT) {
      this.props.dispatch(DownloadAction.deleteTasks([task.id], true));
      const magnet = infoHashToMagnet(task.infoHash);
      const torrentTask = this.props.tasks.find(item => !item.visible && item.url.startsWith(magnet));
      if (torrentTask) {
        this.props.dispatch(DownloadAction.deleteTasks([torrentTask.id], true));
      }
    } else {
      const taskIds = [];
      let invisibleCount = 0;
      this.props.tasks.forEach(item => {
        if (!item.visible) {
          invisibleCount += 1;
          if (invisibleCount > 5) {
            taskIds.push(item.id);
          }
        }
      });
      if (taskIds.length > 0) {
        this.props.dispatch(DownloadAction.deleteTasks(taskIds, true));
      }
      this.props.dispatch(DownloadAction.pauseTasks([task.id]));
    }
  };

  _initPlayState = () => {
    const { videoTasks, task } = this.state;
    if (!task || (task.type === TASK_TYPE.BT && videoTasks.length === 0)) {
      setTimeout(() => {
        this._initPlayState();
      }, 300);
      return;
    }
    let playingTask = task.type === TASK_TYPE.BT ? videoTasks[0] : task;
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
          startPlayTime = watchRecord.playProgress;
          playingTask = videoTasks.find(subTask => subTask.index === watchRecord.subTaskIndex);
        }
      } else {
        startPlayTime = this._watchRecords[0].playProgress;
      }
    }
    this.setState({ startPlayTime, playingTask });
  };

  _initPlayUrl = async () => {
    if (this._getUrlCount === 0) {
      return;
    }
    const { task, playingTask, currentLine } = this.state;
    if (currentLine === VOD_LINE) {
      // get play url from dht
      const url = this._isMagnet ? this._infoHash : this._url;
      const index = this._isMagnet ? playingTask.index : 0;
      try {
        const { taskId, playUrl } = await dhtVodService.start(url, index);
        playingTask.vodTaskId = taskId;
        this.setState({ playUrl, playingTask });
        return;
      } catch (error) {
        console.log('getVodPlayUrl-error:', error);
      }
    } else if (task && task.isFileExist && playingTask) {
      // get play url from downloadTask
      const filePath = playingTask.path;
      const downloadSuccess = playingTask.status === TASK_STATUS.SUCCESS;
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
    const { task, playingTask, currentLine } = this.state;
    if (currentLine === VOD_LINE || playingTask.status === TASK_STATUS.SUCCESS) {
      return;
    }
    if (task.type !== TASK_TYPE.BT) {
      DownloadSDK.setPlayTask(task.id, '-1');
      return;
    }
    DownloadSDK.setPlayTask(task.id, `${playingTask.index}`);
  };

  _cancelSetPlayTask = () => {
    DownloadSDK.setPlayTask('-1', '0');
  };

  _onStartLoading = async () => {
    const { playingTask, currentLine, playUrl } = this.state;
    if (currentLine === VOD_LINE) {
      if (!playUrl) {
        if (this._player.getCurrentTime() > 0) {
          this.setState({ startPlayTime: this._player.getCurrentTime() });
        }
        this._initPlayUrl();
      }
      return;
    }
    if (playingTask.status === TASK_STATUS.SUCCESS) {
      return;
    }
    this._resumeTask();
    await sleep(1000);
    this.setPlayTask();
  };

  _onStopLoading = () => {
    if (this.state.currentLine === DOWNLOAD_LINE) {
      this.props.dispatch(DownloadAction.pauseTasks([this.props.navigation.getParam('taskId')]));
    } else {
      this._stopVod();
      this.setState({ playUrl: null });
    }
  };

  _saveProgress = () => {
    const { playingTask, playUrl } = this.state;
    if (!playUrl) {
      return;
    }
    const taskId = this.props.navigation.getParam('taskId');
    const task = this.props.tasks.find(item => item.id === taskId);
    let newRecord: WatchRecord = null;
    if (task.type === TASK_TYPE.BT) {
      const subTaskIndex = playingTask.index;
      const oldRecord = this._watchRecords.find((watchRecord: WatchRecord) => watchRecord.subTaskIndex === subTaskIndex);
      if (oldRecord) {
        newRecord = oldRecord;
      } else {
        newRecord = new WatchRecord();
        newRecord.id = uuid();
        newRecord.name = playingTask.name;
        newRecord.size = playingTask.fileSize;
        newRecord.subTaskIndex = playingTask.index;
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
    newRecord.fromHome = !task.visible;
    newRecord.playProgress = this._player.getCurrentTime();
    newRecord.taskId = task.id;
    newRecord.watchTime = new Date();
    watchRecordService.addWatchRecord(newRecord);
    if (!this._watchRecords.includes(newRecord)) {
      this._watchRecords.push(newRecord);
    }
  };

  _reportEnterPlay = () => {
    const { task } = this.state;
    if (task) {
      reporter.enterPlay({
        [REPORT_KEYS.type]: DataMap.type_play,
        [REPORT_KEYS.url]: task.url,
      });
      return;
    }
    this._reportEnterPlayTimer = setTimeout(this._reportEnterPlay, 1000);
  };

  _reporterMedia = canPlay => {
    reporter.media({
      [REPORT_KEYS.type]: DataMap.type_play,
      [REPORT_KEYS.url]: this.state.task.url,
      [REPORT_KEYS.status]: canPlay ? DataMap.status_success : DataMap.status_fail,
    });
  };

  _setVodInfo = async () => {
    const fetchUrl = this._isMagnet ? this._infoHash : this._url;
    try {
      const info = await dhtVodService.getPlayList(fetchUrl);
      if (this._allLines.length === 1) {
        this._allLines.push(VOD_LINE);
      }
      if (this.state.currentLine !== VOD_LINE) {
        return;
      }

      const task = new DownloadTask();
      task.name = this._fileName;
      task.speed = 0; // TODO
      task.type = this._isMagnet ? TASK_TYPE.BT : 0;
      task.infoHash = this._infoHash;
      task.url = this._url;
      task.fileSize = 0;
      const videoTasks = [];
      for (let i = 0; i < info.filelist.length; i += 1) {
        const { id, filesize, filename } = info.filelist[i];
        task.fileSize += filesize;
        if (this._isMagnet && getCategory(filename) === 'video') {
          const subTask = {
            index: id,
            fileSize: filesize,
            name: filename,
            poster: getCommonPoster(filename),
          };
          videoTasks.push(subTask);
        }
      }
      videoTasks.sort((a, b) => a.index - b.index);
      this.setState({ task, videoTasks });
    } catch (e) {
      console.log(`Not in dht network, url: ${this._url} ${JSON.stringify(e)}`);
    }
  };

  _getBTSubtasks = () => {
    const { task } = this.state;
    if (task && task.type !== TASK_TYPE.BT) {
      return;
    }
    if (task) {
      this.props.dispatch(DownloadAction.fetchBtSubTasks(task.id));
    }
    this._getSubTaskTimer = setTimeout(() => {
      this._getBTSubtasks();
    }, 1000);
  };

  _getVodTasks = () => {
    dhtVodService
      .getInfo(this.state.playingTask.vodTaskId)
      .then(info => {
        const { currentLine, task } = this.state;
        if (currentLine === VOD_LINE && info) {
          task.speed = info.download_speed;
          this.setState({ task });
        }
      })
      .catch((err) => { console.log('getVodTasks err', err); })
      .finally(() => {
        this._getVodTasksTimer = setTimeout(() => {
          this._getVodTasks();
        }, 2000);
      });
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

  _stopVod = () => {
    const { playingTask, currentLine } = this.state;
    if (currentLine === VOD_LINE) {
      dhtVodService.stop(playingTask.vodTaskId);
    }
  };

  _switchPlayingVideo = (videoTask: Object) => {
    const { playingTask, task } = this.state;
    if (!playingTask || !task || !videoTask) {
      return;
    }
    if (videoTask.index !== playingTask.index) {
      this._stopVod();
      this._saveProgress();
      this.setState({ playingTask: videoTask }, () => {
        this._getUrlCount = playUrlRetryCount;
        this._initPlayUrl();
        const watchRecord = this._watchRecords.find((record: WatchRecord) => record.subTaskIndex === videoTask.index);
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

  _switchLine = (line: Number) => {
    if (this.state.currentLine === line) {
      return;
    }
    this._stopVod();
    this.setState({ currentLine: line }, () => {
      if (line === VOD_LINE) {
        this._setVodInfo();
        clearTimeout(this._getSubTaskTimer);
        this._getVodTasks();
        this.props.dispatch(DownloadAction.pauseTasks([this.props.navigation.getParam('taskId')]));
      } else {
        this._getBTSubtasks();
        clearTimeout(this._getVodTasksTimer);
      }
      if (this._player.getCurrentTime() > 0) {
        this.setState({ startPlayTime: this._player.getCurrentTime() });
      }
      this._getUrlCount = playUrlRetryCount;
      this._initPlayUrl();
    });
    reporter.switchLine({
      [REPORT_KEYS.from]: 10 + line,
      [REPORT_KEYS.url]: this.state.task.url,
    });
  };

  _renderPlayer = () => {
    const { videoTasks, playUrl, task, playingTask, startPlayTime } = this.state;
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
        initPause={false}
        url={playUrl}
        videoList={task && task.type === TASK_TYPE.BT ? videoTasks : [task]}
        onSwitchVideo={this._switchPlayingVideo}
        playingVideo={playingTask}
        onPlayerSizeChange={this._onPlayerSizeChange}
        onFinished={this._saveProgress}
        loadData={this._onStartLoading}
        stopLoadData={this._onStopLoading}
        startPlayTime={startPlayTime}
        speed={task ? task.speed : 0}
      />
    );
  };

  _renderVideoInfo = () => {
    const { task, playingTask, videoTasks, isLandscapeFullScreen, isPortraitFullScreen, currentLine } = this.state;
    if (isPortraitFullScreen || isLandscapeFullScreen || !task) {
      return null;
    }
    return (
      <VideoInfo
        playingVideo={playingTask}
        name={task.name}
        fileSize={task.fileSize}
        fileList={videoTasks}
        onVideoItemPressed={this._switchPlayingVideo}
        currentLine={currentLine}
        allLines={this._allLines}
        onSwitchLine={this._switchLine}
      />
    );
  };

  render() {
    const borderTop = this.state.isLandscapeFullScreen || notchHeight === 0 ? { borderTopWidth: 0 } : { borderTopWidth: notchHeight, borderColor: '#000' };
    return (
      <PageContainer style={borderTop}>
        {this._renderPlayer()}
        {this._renderVideoInfo()}
      </PageContainer>
    );
  }
}

const mapStateToProps = state => {
  const { tasks, subTasks } = state.Download;
  return { tasks, subTasks };
};

export default connect(mapStateToProps)(VodPlayer);
