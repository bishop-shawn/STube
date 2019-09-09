// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import DownloadAction from '../../redux/actions/download';
import MultiSelectPage from '../../components/multiSelectPage';
import DownloadTask from '../../model/downloadTask';
import TaskItem from '../../components/taskItem';
import DeletePopUp from '../../components/deletePopUp';
import { toReadableSize, fitSize } from '../../util/baseUtil';
import { TASK_STATUS, STYLE_CONSTANT } from '../../constant';
import reporter, { REPORT_KEYS } from '../../util/reporter';
import EmptyHint from '../../components/emptyHint';
import watchRecordService from '../../service/watchRecordService';
import DownloadSDK from '../../sdk/downloadSDK';

type Props = {
  navigation: Object,
  tasks: DownloadTask[],
  dispatch: Function,
};
type State = {
  showDeletePopUp: boolean,
};

class DownloadRecords extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showDeletePopUp: false,
    };
    this._selectedTaskIds = [];
    this._selection = [];
  }

  _deleteTasks = (deleteFile: boolean) => {
    this._selection.forEach(item => {
      reporter.delete({
        [REPORT_KEYS.url]: item.type === TASK_STATUS.BT ? `bt://${item.infoHash}` : item.url,
      });
    });
    const infoHashes = [];
    this.props.tasks.forEach(task => {
      if (task.infoHash && this._selectedTaskIds.includes(task.id)) {
        infoHashes.push(task.infoHash);
      }
    });
    if (infoHashes.length > 0) {
      DownloadSDK.deleteTorrentInfo(infoHashes);
    }
    watchRecordService.deleteRecordsByTaskId(this._selectedTaskIds);
    this.props.dispatch(DownloadAction.deleteTasks(this._selectedTaskIds, deleteFile));
    this._selectedTaskIds = [];
    if (this._deletedCallBack) {
      this._deletedCallBack();
      this._deletedCallBack = null;
    }
  };

  _showDeletePopUp = (selectedTaskIds: string[], deletedCallBack: Function, selection: Array) => {
    this._selectedTaskIds = selectedTaskIds;
    this._selection = selection;
    this.setState({ showDeletePopUp: true });
    this._deletedCallBack = deletedCallBack;
  };

  _closeDeletePopUp = () => {
    this._selectedTaskIds = [];
    this.setState({ showDeletePopUp: false });
    if (this._deletedCallBack) {
      this._deletedCallBack();
      this._deletedCallBack = null;
    }
  };

  _renderDeletePopUp = () => {
    if (!this.state.showDeletePopUp) {
      return null;
    }
    const selectedTasks = this.props.tasks.filter((task: DownloadTask) => this._selectedTaskIds.indexOf(task.id) >= 0);
    const fileSize = selectedTasks.reduce((accumulator, currentValue) => accumulator + currentValue.fileSize, 0);
    const deleteFile = selectedTasks.some((task: DownloadTask) => task.status === TASK_STATUS.SUCCESS);
    return <DeletePopUp onClose={this._closeDeletePopUp} deleteCount={this._selectedTaskIds.length} fileSize={toReadableSize(fileSize)} deleteFile={deleteFile} onDelete={this._deleteTasks} />;
  };

  _renderTaskItem = (task: DownloadTask) => <TaskItem task={task} showActionButton={false} containerStyle={{ marginTop: 0, backgroundColor: 'transparent' }} />;

  _renderEmpty = () => <EmptyHint title="暂无任务" image={require('../../resource/no_tasks.png')} />;

  render() {
    const { tasks, navigation } = this.props;
    const filteredTasks = tasks.filter((task: DownloadTask) => task.visible);
    const dataList = filteredTasks.length > 0 ? [{ data: filteredTasks }] : [];
    return (
      <View style={{ flex: 1 }}>
        <MultiSelectPage
          navigation={navigation}
          dataList={dataList}
          itemKey="id"
          renderItem={this._renderTaskItem}
          onDelete={this._showDeletePopUp}
          itemContainerStyle={{ backgroundColor: STYLE_CONSTANT.itemBackgroundColor, marginTop: fitSize(10) }}
          showEdit={false}
          renderEmpty={this._renderEmpty}
          title="全部下载任务"
        />
        {this._renderDeletePopUp()}
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { tasks } = state.Download;
  return { tasks };
};

export default connect(mapStateToProps)(DownloadRecords);
