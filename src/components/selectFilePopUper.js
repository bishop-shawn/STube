// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableHighlight, DeviceEventEmitter } from 'react-native';
import RootSiblings from 'react-native-root-siblings';
import BTFileInfo from '../model/BTFileInfo';
import DownloadAction from '../redux/actions/download';
import PopUpContainer from './popUpContainer';
import Loading from './loading';
import Button, { ButtonType } from './button';
import { fitSize, showToast, toReadableSize } from '../util/baseUtil';
import { getCommonPoster, getCategory } from '../util/taskUtil';
import { STYLE_CONSTANT } from '../constant';
import DownloadSDK from '../sdk/downloadSDK';
import reporter, { REPORT_KEYS, DataMap } from '../util/reporter';
import store from '../redux/store';
import CommonActions from '../redux/actions/common';
import DeviceInfo from '../util/deviceInfo';
import Icon from './icon';
import { DataError } from '../util/errors';

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: fitSize(10),
  },
  selectedCount: {
    fontSize: fitSize(15),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  selectAllTitle: {
    color: 'gray',
    fontSize: fitSize(15),
  },
  loadingContainer: {
    height: fitSize(250),
    flex: undefined,
  },
  listContainer: {
    width: '100%',
    height: fitSize(250),
    borderTopWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  fileItemContainer: {
    flexDirection: 'row',
    height: fitSize(60),
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 0.7,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  emptyHint: {
    height: fitSize(250),
    width: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontSize: fitSize(20),
    color: STYLE_CONSTANT.fontGrayColor,
  },
  poster: {
    width: fitSize(40),
    height: fitSize(40),
  },
  fileDetailContainer: {
    flex: 1,
    paddingLeft: fitSize(5),
  },
  fileName: {
    fontSize: fitSize(12),
    color: 'black',
  },
  fileSize: {
    fontSize: fitSize(11),
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  storageInfo: {
    fontSize: fitSize(12),
    color: 'gray',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    height: fitSize(30),
    width: '100%',
  },
  downloadContainer: {
    width: '100%',
    marginTop: fitSize(10),
    marginBottom: fitSize(5),
    height: fitSize(40),
  },
  buttonTitle: {
    fontSize: fitSize(16),
  },
  selectedIcon: {
    height: '100%',
    fontSize: fitSize(18),
    paddingHorizontal: fitSize(5),
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
type Props = {
  isParsing: Boolean,
  onClose: Function,
  torrentInfo: Object,
  taskId: String,
  extraDownloadIndexes: Number[],
};
type State = {
  selectedIndexList: Number[],
  selectAll: Boolean,
};

class SelectFilePopUp extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this._selectFiles = [];
    let selectedIndexList = [];
    if (props.torrentInfo) {
      this._selectFiles = JSON.parse(JSON.stringify(props.torrentInfo.files.filter(file => getCategory(file.name) === 'video')));
      selectedIndexList = this._selectFiles.map(file => file.index);
    }
    this.state = {
      selectedIndexList,
      selectAll: props.torrentInfo && this._selectFiles.length === props.torrentInfo.files.length,
      avalibleStorage: store.getState().Common.avalibleStorage,
    };
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.torrentInfo && this.props.torrentInfo) {
      this._selectFiles = JSON.parse(JSON.stringify(this.props.torrentInfo.files.filter(file => getCategory(file.name) === 'video')));
      const selectedIndexList = this._selectFiles.map(file => file.index);
      this.setState({
        selectedIndexList,
        selectAll: this._selectFiles.length === this.props.torrentInfo.files.length,
      });
    }
  }

  _selectAllFile = () => {
    if (!this.props.torrentInfo) {
      return;
    }
    const { selectAll } = this.state;
    if (selectAll) {
      this._selectFiles = [];
      this.setState({
        selectAll: false,
        selectedIndexList: [],
      });
    } else {
      this._selectFiles = JSON.parse(JSON.stringify(this.props.torrentInfo.files));
      this.setState({
        selectAll: true,
        selectedIndexList: this.props.torrentInfo.files.map(file => file.index),
      });
    }
  };

  _updateSelectedFileStatus = file => {
    const { selectedIndexList } = this.state;
    const index = selectedIndexList.indexOf(file.index);
    if (index >= 0) {
      this._selectFiles.splice(index, 1);
      selectedIndexList.splice(index, 1);
    } else {
      this._selectFiles.push(file);
      selectedIndexList.push(file.index);
    }
    this.setState({
      selectedIndexList,
      selectAll: selectedIndexList.length === this.props.torrentInfo.files.length,
    });
  };

  _getSelectFileSize = () => this._selectFiles.reduce((acc, record) => acc + Number(record.size), 0);

  _startDownload = async () => {
    const { avalibleStorage, selectedIndexList } = this.state;
    const { torrentInfo, taskId, extraDownloadIndexes } = this.props;
    const { path, infoHash, files } = torrentInfo;
    if (avalibleStorage < this._getSelectFileSize()) {
      showToast('磁盘空间不足');
      return;
    }
    if (taskId >= 0) {
      DownloadSDK.addBtSubTasks(taskId, selectedIndexList.concat(extraDownloadIndexes));
      if (infoHash && files) {
        DownloadSDK.saveTorrentInfo(infoHash, JSON.stringify(files));
      }
    } else {
      store.dispatch(
        DownloadAction.createTask({
          url: `file://${path}`,
          infoHash,
          selectSet: selectedIndexList,
          speedUp: true,
          hidden: false,
          successCallBack: (id, repeat) => {
            if (!repeat) {
              reporter.create({
                [REPORT_KEYS.from]: DataMap.from_add_bt,
                [REPORT_KEYS.type]: DataMap.type_download,
                [REPORT_KEYS.url]: `bt://${infoHash}`,
              });
            }
            DownloadSDK.saveTorrentInfo(infoHash, JSON.stringify(files));
          },
        }),
      );
    }
    this.props.onClose(true);
  };

  _renderEmpty = () => {
    const title = this.props.taskId >= 0 ? '任务已全部添加' : '无子任务';
    return <Text style={styles.emptyHint}>{title}</Text>;
  };

  _renderFileItem = data => {
    const file: BTFileInfo = data.item;
    const { selectedIndexList, selectAll } = this.state;
    const selected = selectAll || selectedIndexList.indexOf(file.index) >= 0;
    const iconColor = selected ? STYLE_CONSTANT.themeColor : STYLE_CONSTANT.seperatorColor;
    return (
      <TouchableHighlight underlayColor={STYLE_CONSTANT.checkedColor} onPress={() => this._updateSelectedFileStatus(file)}>
        <View style={styles.fileItemContainer}>
          <Image resizeMode="contain" style={styles.poster} source={getCommonPoster(file.name)} />
          <View style={styles.fileDetailContainer}>
            <Text style={styles.fileName} numberOfLines={2}>
              {file.name}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.fileSize}>{toReadableSize(Number(file.size))}</Text>
            </View>
          </View>
          <Icon name="check" color={iconColor} style={styles.selectedIcon} />
        </View>
      </TouchableHighlight>
    );
  };

  render() {
    const { avalibleStorage } = this.state;
    const { onClose, isParsing, torrentInfo } = this.props;
    const { selectedIndexList, selectAll } = this.state;
    const title = selectedIndexList.length > 0 ? `资源列表(${selectedIndexList.length})` : '请选择项目';
    return (
      <PopUpContainer onClose={onClose} containerStyle={{ paddingVertical: fitSize(10), paddingHorizontal: fitSize(15) }}>
        <View style={styles.headerContainer}>
          <Text style={styles.selectedCount}>{title}</Text>
          <Button type={ButtonType.clear} title={selectAll ? '取消全选' : '全选'} titleStyle={styles.selectAllTitle} onPress={this._selectAllFile} />
        </View>
        {isParsing && <Loading containerStyle={styles.loadingContainer} />}
        {isParsing || (
          <FlatList
            data={torrentInfo.files}
            renderItem={this._renderFileItem}
            extraData={this.state}
            keyExtractor={item => `${item.index}`}
            initialNumToRender={5}
            style={styles.listContainer}
            ListEmptyComponent={this._renderEmpty}
          />
        )}
        <Text style={styles.storageInfo}>{`预计占用${toReadableSize(this._getSelectFileSize())}，本机可用${toReadableSize(avalibleStorage)}`}</Text>
        <Button title="下 载" disabled={selectedIndexList.length === 0} containerStyle={styles.downloadContainer} onPress={this._startDownload} titleStyle={styles.buttonTitle} />
      </PopUpContainer>
    );
  }
}

let instance = null;
let successCallBack = null;

function close(downloaded) {
  if (successCallBack && downloaded) {
    successCallBack();
  }
  if (instance) {
    instance.destroy();
  }
}

async function show({ path, callback, files, taskId, extraDownloadIndexes }) {
  successCallBack = callback;
  if (instance) {
    instance.destroy();
  }
  if (files) {
    instance = new RootSiblings(<SelectFilePopUp isParsing={false} torrentInfo={{ files }} taskId={taskId} onClose={close} extraDownloadIndexes={extraDownloadIndexes} />);
    return;
  }
  let torrentInfo = null;
  try {
    const avalibleStorage = await DeviceInfo.getFreeDiskStorage();
    store.dispatch(CommonActions.updateStorageInfo(avalibleStorage));
  } catch (e) {
    console.log('get avalibleStorage error:', e);
  }
  instance = new RootSiblings(<SelectFilePopUp isParsing torrentInfo={torrentInfo} onClose={close} />);
  DownloadSDK.parseTorrent(path)
    .then(result => {
      torrentInfo = result;
      if (!torrentInfo.infoHash) {
        throw new DataError('种子解析失败');
      }
      torrentInfo.path = path;
      const infoHash = torrentInfo.infoHash.toUpperCase();
      const { tasks } = store.getState().Download;
      const downloadingBtTask = tasks.find(task => task.infoHash === infoHash && task.visible);
      let downloadingTaskId = -1;
      let downloadingIndexes = [];
      if (downloadingBtTask) {
        downloadingTaskId = downloadingBtTask.id;
        downloadingIndexes = downloadingBtTask.btSelectedSet;
        torrentInfo.files = torrentInfo.files.filter(file => !downloadingIndexes.includes(file.index));
      }
      console.log('parseTorrent', torrentInfo);
      instance.update(<SelectFilePopUp taskId={downloadingTaskId} isParsing={false} torrentInfo={torrentInfo} onClose={close} extraDownloadIndexes={downloadingIndexes} />);
    })
    .catch(() => {
      showToast('种子解析失败');
      close();
    });
}

DeviceEventEmitter.addListener('TORRENT_DOWNLOADED', show);
export default {
  show,
  close,
};
