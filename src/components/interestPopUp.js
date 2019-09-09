// @flow
import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { ROUTE_NAMES, TASK_STATUS } from '../constant';
import { showToast } from '../util/baseUtil';
import VideoDetailPopUp from './videoDetailPopUp';
import DownloadSDK from '../sdk/downloadSDK';
import safeRequest from '../util/safeRequest';
import Video from '../model/video';
import DownloadTask from '../model/downloadTask';
import DownloadAction from '../redux/actions/download';
import reporter, { REPORT_KEYS, DataMap } from '../util/reporter';
import { DataError } from '../util/errors';
import { isMagnet, getCategory } from '../util/taskUtil';
import InvitePopUp from './invitePopUp';

type Props = {
  navigation: Object,
  video: Video,
  task: DownloadTask,
  onFinished: Function,
  showVideoDetailPopUp?: boolean,
  dispatch: Function,
  onBalanceChecked: Function,
  tasks: DownloadTask[],
};

type State = {
  showVideoDetailPopUp: boolean,
  showInvitePopUp: boolean,
  showRechargePopUp: boolean,
  confirmWatching: boolean,
};

class InterestPopUp extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { video, task } = props;
    this._url = video ? video.url : task.url;
    this.state = {
      showVideoDetailPopUp: props.showVideoDetailPopUp,
      showInvitePopUp: false,
      showRechargePopUp: false,
      confirmWatching: false,
    };
    this._info = null;
    this._torrentInfo = null;
    this._checkTorrentDownloadedCount = 10;
  }

  componentDidMount() {
    if (!this.state.showVideoDetailPopUp) {
      this._checkBalance();
    }
  }

  componentWillUnmount() {
    clearTimeout(this._checkTorrentDownloadedTimer);
  }

  _onBalanceChecked = () => {
    if (this.props.onBalanceChecked) {
      this.props.onBalanceChecked();
    }
  };

  _getNameWithType = (name, url) => {
    const typeReg = /\.[a-zA-Z0-9]{2,5}$/;
    if (name && !typeReg.test(name)) {
      const urlSplit = url.split('.');
      return `${name}.${urlSplit[urlSplit.length - 1]}`;
    }
    return name;
  };

  _onCanSpeedUp = () => {
    if (this.props.video) {
      // create play task
      let infoHash = null;
      let files = [];
      let reportUrl = this._url;
      let selectSet = [];
      if (this._torrentInfo) {
        // eslint-disable-next-line prefer-destructuring
        infoHash = this._torrentInfo.infoHash;
        // eslint-disable-next-line prefer-destructuring
        files = this._torrentInfo.files;
        selectSet = files.filter(file => getCategory(file.name) === 'video').map(file => file.index);
        if (selectSet.length === 0) {
          showToast('该BT不包含视频文件');
          return;
        }
        reportUrl = `bt://${infoHash}`;
      }
      const { name, subTaskIndex, url, from } = this.props.video;
      const fileName = this._getNameWithType(name, this._url);
      this.props.dispatch(
        DownloadAction.createTask({
          url: this._url,
          infoHash,
          selectSet,
          hidden: true,
          speedUp: false,
          fileName,
          successCallBack: (taskId: string) => {
            DownloadSDK.speedUpTask(taskId, this._info);
            this.props.navigation.navigate(ROUTE_NAMES.vodPlayer, { taskId, url, subTaskIndex, fileName });
            reporter.create({
              [REPORT_KEYS.type]: DataMap.type_play,
              [REPORT_KEYS.from]: from || DataMap.from_films,
              [REPORT_KEYS.url]: reportUrl,
            });
          },
        }),
      );
    } else {
      DownloadSDK.speedUpTask(this.props.task.id, this._info);
    }
  };

  _checkBalance = async () => {
    await this._downloadTorrent();
    const url = this._torrentInfo && this._torrentInfo.infoHash ? `bt://${this._torrentInfo.infoHash.toUpperCase()}` : this._url;
    this._info = '{}';
    const reqObj = JSON.parse(this._info);
    reqObj.url = url;
    const req = JSON.stringify(reqObj);
    let res = null;
    try {
      res = await safeRequest.post('/task/precommit', req, false);
    } catch (e) {
      if (e instanceof DataError) {
        showToast('预请求失败');
      }
      this._onBalanceChecked();
      this.props.onFinished();
      return;
    }
    // has free times
    if (res.if_acc === 1) {
      this._onCanSpeedUp();
      this.props.onFinished();
    } else {
      this.setState({ showInvitePopUp: true });
    }
    this._onBalanceChecked();
  };

  _checkTorrentDownloaded = async (taskId: string, resolve: Function) => {
    const downloadingTask = this.props.tasks.find(task => task.id === taskId);
    if (downloadingTask && downloadingTask.status === TASK_STATUS.SUCCESS) {
      if (downloadingTask.isFileExist) {
        try {
          this._url = `file://${downloadingTask.path}`;
          this._torrentInfo = await DownloadSDK.parseTorrent(downloadingTask.path);
          console.log('parseTorrent', this._torrentInfo);
          resolve();
        } catch (error) {
          showToast('视频解析失败');
          resolve();
        }
      } else {
        this.props.dispatch(DownloadAction.deleteTasks([taskId]));
        this._createTorrentTask(resolve);
      }
    } else if (this._checkTorrentDownloadedCount > 0) {
      this._checkTorrentDownloadedCount -= 1;
      this._checkTorrentDownloadedTimer = setTimeout(() => {
        this._checkTorrentDownloaded(taskId, resolve);
      }, 1000);
    } else {
      this._onCanSpeedUp();
      this.props.onFinished();
      showToast('BT文件下载失败');
    }
  };

  _downloadTorrent = () => {
    if (isMagnet(this._url)) {
      return new Promise(resolve => {
        this.props.dispatch(DownloadAction.fetchTasks());
        this._createTorrentTask(resolve);
      });
    }
    return Promise.resolve();
  };

  _createTorrentTask = resolve => {
    this.props.dispatch(
      DownloadAction.createTask({
        url: this._url,
        hidden: true,
        speedUp: false,
        successCallBack: (taskId: string) => {
          this.props.dispatch(DownloadAction.resumeTasks([taskId]));
          this._checkTorrentDownloaded(taskId, resolve);
        },
      }),
    );
  };

  // play
  _watchVideo = async () => {
    this.setState({ confirmWatching: true });
    await this._checkBalance();
    this.setState({ showVideoDetailPopUp: false, confirmWatching: false });
  };

  // downlaod
  _downloadTask = () => {
    const { video } = this.props;
    this.props.dispatch(
      DownloadAction.createTask({
        url: this._url,
        successCallBack: () => {
          reporter.create({
            [REPORT_KEYS.type]: DataMap.type_download,
            [REPORT_KEYS.from]: video.from || DataMap.from_films,
            [REPORT_KEYS.url]: this._url,
          });
        },
        fileName: isMagnet(this._url) ? `${video.name}.torrent` : this._getNameWithType(video.name, this._url),
      }),
    );
    this.props.onFinished();
  };

  _renderVideoDetailPopUp = () => {
    const { showVideoDetailPopUp, confirmWatching } = this.state;
    return (
      showVideoDetailPopUp && <VideoDetailPopUp video={this.props.video} onClose={this.props.onFinished} onWatch={this._watchVideo} onDownload={this._downloadTask} confirmWatching={confirmWatching} />
    );
  };

  _renderInvitePopUp = () => this.state.showInvitePopUp && <InvitePopUp onClose={this.props.onFinished} navigation={this.props.navigation} />;

  render() {
    return (
      <View>
        {this._renderVideoDetailPopUp()}
        {this._renderInvitePopUp()}
      </View>
    );
  }
}

InterestPopUp.defaultProps = {
  showVideoDetailPopUp: false,
};

const mapStateToProps = state => {
  const { tasks } = state.Download;
  return { tasks };
};

export default connect(mapStateToProps)(InterestPopUp);
