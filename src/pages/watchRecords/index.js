// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import WatchRecord from '../../model/watchRecord';
import { fitSize, toReadableSize, showToast } from '../../util/baseUtil';
import watchRecordService from '../../service/watchRecordService';
import DownloadAction from '../../redux/actions/download';
import MultiSelectPage from '../../components/multiSelectPage';
import { STYLE_CONSTANT, PAGE_APPEAR_STATUS, ROUTE_NAMES, TASK_STATUS } from '../../constant';
import InterestPopUp from '../../components/interestPopUp';
import Video from '../../model/video';
import DownloadTask from '../../model/downloadTask';
import Loading from '../../components/loading';
import EmptyHint from '../../components/emptyHint';
import { isMagnet } from '../../util/taskUtil';
import downloadService from '../../service/downloadService';

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: fitSize(14),
    fontWeight: 'bold',
    padding: fitSize(10),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  recordContainer: {
    height: fitSize(66),
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: fitSize(10),
    borderBottomWidth: 1,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  videoName: {
    fontSize: fitSize(14),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  videoInfo: {
    fontSize: fitSize(11),
    color: STYLE_CONSTANT.fontGrayColor,
  },
  label: {
    height: fitSize(22),
    paddingHorizontal: fitSize(10),
    borderRadius: fitSize(11),
    borderWidth: 1,
    borderColor: STYLE_CONSTANT.themeColor,
    color: STYLE_CONSTANT.themeColor,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

type Props = {
  navigation: Object,
  dispatch: Function,
  tasks: DownloadTask[],
};

type State = {
  startInterest: boolean,
  isLoading: boolean,
  watchRecords: WatchRecord[],
};

class WatchRecords extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      startInterest: false,
      isLoading: false,
      watchRecords: [],
    };
    this._loadingRecords = true;
  }

  componentDidMount() {
    this._willFocusListener = this.props.navigation.addListener(PAGE_APPEAR_STATUS.didFocus, () => {
      const watchRecords = watchRecordService.getAllWatchRecords();
      this.setState({ watchRecords });
      this._loadingRecords = false;
    });
  }

  componentWillUnmount() {
    this._willFocusListener.remove();
  }

  _deleteTasks = (deletedRecordIds: string[]) => {
    const recordTaskIds = this.state.watchRecords.filter((record: WatchRecord) => deletedRecordIds.indexOf(record.id) >= 0).map((record: WatchRecord) => record.taskId);
    const needDeleteTasks = this.props.tasks.filter((task: DownloadTask) => recordTaskIds.indexOf(task.id) >= 0 && !task.visible);
    const needDeleteTaskIds = needDeleteTasks.map((task: DownloadTask) => task.id);
    this.props.dispatch(DownloadAction.deleteTasks(needDeleteTaskIds, true));
  };

  _deleteWatchRecord = (deletedRecordIds: string[], deletedCallBack: Function) => {
    this._deleteTasks(deletedRecordIds);
    watchRecordService.deleteWatchRecords(deletedRecordIds);
    const { watchRecords } = this.state;
    const newWatchRecords = watchRecords.filter((record: WatchRecord) => deletedRecordIds.indexOf(record.id) < 0);
    this.setState({ watchRecords: newWatchRecords });
    if (deletedCallBack) {
      deletedCallBack();
    }
  };

  _onPlay = async (record: WatchRecord) => {
    if (record.fromHome) {
      let { taskUrl } = record;
      if (isMagnet(taskUrl)) {
        const task = this.props.tasks.find(item => taskUrl.indexOf(item.infoHash) >= 0);
        if (task) {
          const btSubTasks = await downloadService.fetchBtSubTasks(task.id);
          if (btSubTasks.length > 0 && !btSubTasks.find(btSubTask => btSubTask.index === record.subTaskIndex)) {
            showToast('已失效');
            return;
          }
          taskUrl = task.url;
        }
      }
      this._selectVideo = new Video(record.name, record.size, taskUrl, record.subTaskIndex);
      this.setState({ startInterest: true, isLoading: true });
    } else {
      this.props.navigation.navigate(ROUTE_NAMES.downloadingPlayer, { taskId: record.taskId, subTaskIndex: record.subTaskIndex });
    }
  };

  _getSectionRecords = (records: WatchRecord[]) => {
    let sections = [{ title: '今天', data: [] }, { title: '昨天', data: [] }, { title: '更早', data: [] }];
    const today = moment();
    const yesterday = moment().subtract(1, 'day');
    records.forEach((record: WatchRecord) => {
      if (moment(record.watchTime).isSame(today, 'day')) {
        sections[0].data.push(record);
      } else if (moment(record.watchTime).isSame(yesterday, 'day')) {
        sections[1].data.push(record);
      } else {
        sections[2].data.push(record);
      }
    });
    sections = sections.filter(section => section.data.length > 0);
    return sections;
  };

  _renderRecordItem = (record: WatchRecord, isEditing: boolean) => {
    let title = '在线播放';
    if (!record.fromHome) {
      const task = this.props.tasks.find(item => item.id === record.taskId);
      if (!task) return null;
      title = task.status === TASK_STATUS.SUCCESS && task.isFileExist ? '本地播放' : '边下边播';
    }
    return (
      <View style={[styles.recordContainer, isEditing && { paddingRight: fitSize(45) }]}>
        <Text numberOfLines={1} style={styles.videoName}>
          {record.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: fitSize(5), height: fitSize(22) }}>
          <Text numberOfLines={1} style={[styles.videoInfo, { width: STYLE_CONSTANT.screenWidth * 0.45 }]}>{`时间：${moment(record.watchTime).format('YYYY.MM.DD HH:mm')}`}</Text>
          <Text numberOfLines={1} style={[styles.videoInfo, { flex: 1 }]}>{`大小：${toReadableSize(record.size)}`}</Text>
          {isEditing || <Text style={styles.label}>{title}</Text>}
        </View>
      </View>
    );
  };

  _renderSectionHeader = ({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>;

  _renderEmpty = () => (this._loadingRecords ? <Loading /> : <EmptyHint title="暂无播放记录" image={require('../../resource/no_play_records.png')} />);

  _renderInterestPopUp = () => {
    const { startInterest } = this.state;
    return (
      startInterest && (
        <InterestPopUp
          navigation={this.props.navigation}
          video={this._selectVideo}
          onFinished={() => {
            this.setState({ startInterest: false });
          }}
          onBalanceChecked={() => {
            this.setState({ isLoading: false });
          }}
        />
      )
    );
  };

  _renderLoading = () => {
    const { isLoading } = this.state;
    return (
      isLoading && (
        <Loading
          containerStyle={{ position: 'absolute', top: STYLE_CONSTANT.screenHeight / 2 - fitSize(30), left: STYLE_CONSTANT.screenWidth / 2 - fitSize(30), width: fitSize(60), height: fitSize(60) }}
        />
      )
    );
  };

  render() {
    const { navigation } = this.props;
    const dataList = this._getSectionRecords(this.state.watchRecords);
    return (
      <View style={{ flex: 1 }}>
        <MultiSelectPage
          navigation={navigation}
          dataList={dataList}
          itemKey="id"
          renderItem={this._renderRecordItem}
          onDelete={this._deleteWatchRecord}
          title="播放记录"
          renderEmpty={this._renderEmpty}
          renderSectionHeader={this._renderSectionHeader}
          onItemPressed={this._onPlay}
        />
        {this._renderInterestPopUp()}
        {this._renderLoading()}
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { tasks } = state.Download;
  return { tasks };
};

export default connect(mapStateToProps)(WatchRecords);
