// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Image, Text, FlatList, TouchableHighlight } from 'react-native';
import { STYLE_CONSTANT, TASK_STATUS } from '../../constant';
import { fitSize, toReadableSize, toPercentString, showToast } from '../../util/baseUtil';
import { getCategory } from '../../util/taskUtil';
import Button, { ButtonType } from '../../components/button';
import BTFileInfo from '../../model/BTFileInfo';
import DownloadSDK from '../../sdk/downloadSDK';
import selectFilePopUper from '../../components/selectFilePopUper';
import DownloadTask from '../../model/downloadTask';

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: fitSize(10),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fitSize(13),
    color: STYLE_CONSTANT.fontBlackColor,
    marginVertical: fitSize(5),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  taskContainer: {
    backgroundColor: STYLE_CONSTANT.itemBackgroundColor,
    flex: 1,
    padding: fitSize(10),
  },
  taskHeader: {
    flexDirection: 'row',
  },
  poster: {
    justifyContent: 'center',
    alignItems: 'center',
    width: fitSize(32),
    height: fitSize(32),
    borderRadius: 4,
  },
  taskName: {
    flex: 1,
    paddingLeft: fitSize(15),
    width: '100%',
    fontSize: fitSize(13),
    color: STYLE_CONSTANT.fontBlackColor,
    includeFontPadding: false,
  },
  taskSize: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(11),
    marginLeft: fitSize(47),
    marginVertical: fitSize(3),
  },
  progressContainer: {
    height: fitSize(2),
    backgroundColor: STYLE_CONSTANT.seperatorColor,
    width: '100%',
  },
  progress: {
    height: fitSize(2),
    backgroundColor: STYLE_CONSTANT.themeColor,
  },
  itemFooterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionContainer: {
    height: fitSize(25),
    paddingHorizontal: fitSize(5),
  },
});

type Props = {
  subTasks: Object,
  onVideoItemPressed: Function,
  playingSubTask: Object,
  task: DownloadTask,
};

type State = {
  torrentFiles: BTFileInfo[],
};

export default class SubTaskList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      torrentFiles: [],
    };
    DownloadSDK.getTorrentInfo(this.props.task.infoHash).then(files => {
      if (files) {
        this.setState({ torrentFiles: JSON.parse(files) });
      }
    });
  }

  _onVideoItemPressed = (subTask: Object, deleteSubTask: Boolean = false) => {
    if (deleteSubTask) {
      let subTaskIndexes = this.props.subTasks.filter((item) => item.index !== subTask.index).map((item) => item.index);
      if (subTaskIndexes.length === 0) {
        subTaskIndexes = [-1];
      }
      DownloadSDK.addBtSubTasks(this.props.task.id, subTaskIndexes);
      return;
    }
    if (getCategory(subTask.name) === 'video') {
      this.props.onVideoItemPressed(subTask);
    }
  };

  _onAddSubtasks = () => {
    const { torrentFiles } = this.state;
    if (torrentFiles.length === 0) {
      showToast('添加任务失败，请直接打开种子文件添加任务');
      return;
    }
    const { subTasks, task, playingSubTask } = this.props;
    const downloadedIndexes = subTasks.map(subTask => subTask.index);
    const files = torrentFiles.filter(file => !downloadedIndexes.includes(file.index));
    selectFilePopUper.show({
      files,
      taskId: task.id,
      extraDownloadIndexes: downloadedIndexes,
      callback: () => {
        if (playingSubTask && playingSubTask.status !== TASK_STATUS.SUCCESS) {
          DownloadSDK.setPlayTask(task.id, `${playingSubTask.index}`);
        }
      },
    });
  };

  _renderHeader = () => {
    const downloadedLength = this.props.subTasks.filter(task => task.status === TASK_STATUS.SUCCESS && task.isFileExist).length;
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{`已下载${downloadedLength}个(共${this.props.subTasks.length}个)`}</Text>
        {this.props.task.visible && (
          <Button
            icon={{ name: 'plus_circle', size: fitSize(20), color: STYLE_CONSTANT.themeColor }}
            onPress={this._onAddSubtasks}
            type={ButtonType.clear}
            containerStyle={{ paddingLeft: fitSize(25) }}
          />
        )}
      </View>
    );
  };

  _renderItemFooter = subTask => {
    if (!this.props.task.visible) {
      return null;
    }
    let actionTitle = null;
    let errorMsg = null;
    let showDelete = false;
    if (this.props.task.status === TASK_STATUS.FAILED && (subTask.status === TASK_STATUS.FAILED || subTask.status === TASK_STATUS.PENDING)) {
      errorMsg = '下载失败';
    } else if (subTask.status === TASK_STATUS.SUCCESS && !subTask.isFileExist) {
      errorMsg = '文件已删除';
      showDelete = true;
      actionTitle = '删除';
    }
    if (getCategory(subTask.name) === 'video') {
      if (subTask.status === TASK_STATUS.SUCCESS) {
        actionTitle = showDelete ? '删除' : '播放';
      } else {
        actionTitle = '边下边播';
      }
    }
    const marginTop = errorMsg || actionTitle ? fitSize(10) : 0;
    const containerStyle = !errorMsg && actionTitle ? { justifyContent: 'flex-end', marginTop } : { marginTop };
    return (
      <View style={[styles.itemFooterContainer, containerStyle]}>
        {errorMsg && <Text style={{ color: STYLE_CONSTANT.fontGrayColor, fontSize: fitSize(11) }}>{errorMsg}</Text>}
        {actionTitle && (
          <Button
            containerStyle={styles.actionContainer}
            type={ButtonType.outline}
            icon={{ name: showDelete ? 'trash' : 'play', size: fitSize(12), color: STYLE_CONSTANT.themeColor }}
            title={actionTitle}
            onPress={() => {
              this._onVideoItemPressed(subTask, showDelete);
            }}
          />
        )}
      </View>
    );
  };

  _renderItem = data => {
    const subTask = data.item;
    const containerStyle = this.props.playingSubTask && this.props.playingSubTask.index === subTask.index ? { backgroundColor: STYLE_CONSTANT.checkedColor } : {};
    return (
      <TouchableHighlight
        underlayColor={STYLE_CONSTANT.checkedColor}
        onPress={() => {
          this._onVideoItemPressed(subTask);
        }}
        style={{ marginTop: fitSize(5) }}
      >
        <View style={[styles.taskContainer, containerStyle]}>
          <View style={styles.taskHeader}>
            <Image source={subTask.poster} style={styles.poster} resizeMode="contain" />
            <Text style={styles.taskName} numberOfLines={2}>
              {subTask.name}
            </Text>
          </View>
          <Text style={styles.taskSize}>{toReadableSize(subTask.fileSize)}</Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progress,
                {
                  width: toPercentString(subTask.isFileExist ? subTask.progress : 0),
                },
              ]}
            />
          </View>
          {this._renderItemFooter(subTask)}
        </View>
      </TouchableHighlight>
    );
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this._renderHeader()}
        <FlatList data={this.props.subTasks} renderItem={this._renderItem} keyExtractor={item => item.id} />
      </View>
    );
  }
}
