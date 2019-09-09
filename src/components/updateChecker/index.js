// @flow
import React, { Component } from 'react';
import { Text, StyleSheet, ScrollView, TouchableWithoutFeedback, NativeModules, ImageBackground } from 'react-native';
import RootSiblings from 'react-native-root-siblings';
import Button, { ButtonType } from '../button';
import DownloadSDK from '../../sdk/downloadSDK';
import PopUpContainer from '../popUpContainer';
import { STYLE_CONSTANT, TASK_STATUS } from '../../constant';
import { fitSize, showToast, toReadableSize, compareVersion } from '../../util/baseUtil';
import UpdatingModal from './updatingModal';
import store from '../../redux/store';
import DownloadAction from '../../redux/actions/download';
import request from '../../util/request';
import DeviceInfo from '../../util/deviceInfo';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    width: STYLE_CONSTANT.screenWidth * 0.8,
    height: ((STYLE_CONSTANT.screenWidth * 0.8) / 766) * 1087, // Scale of original image 766：1087
    padding: fitSize(30),
    paddingTop: STYLE_CONSTANT.screenWidth * 0.8 * 0.55,
  },
  des: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(12),
    paddingBottom: fitSize(5),
  },
  updateInfoWrapper: {
    height: fitSize(200),
    marginBottom: fitSize(10),
  },
  updateInfo: {
    color: STYLE_CONSTANT.fontBlackColor,
    fontSize: fitSize(16),
  },
  button: {
    width: '100%',
    padding: fitSize(20),
    height: fitSize(40),
  },
});

type Props = {
  version?: String,
  info?: String,
  url: String,
  canClose?: Boolean,
  onClose: Function,
  fileSize: Number,
};

class UpdateModal extends Component<Props> {
  static defaultProps = {
    version: '0.0.1',
    info: '没什么特别的',
    canClose: true,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      updating: false,
      progress: 0,
    };
  }

  _onClose = () => {
    if (this.props.canClose) {
      this.props.onClose();
    }
  };

  _update = (needCheck = true) => {
    // create update task.
    store.dispatch(
      DownloadAction.createTask({
        url: this.props.url,
        hidden: true,
        speedUp: false,
        successCallBack: async (id, repeat) => {
          // if repeat, delete and redownload.
          if (needCheck && repeat) {
            await DownloadSDK.deleteTasks([id], true);
            setTimeout(() => {
              this._update(false);
            }, 1000);
          } else {
            DownloadSDK.speedUpTask(id, '{}');
            this._changeProgress(id);
            this.setState({
              updating: true,
            });
          }
        },
      }),
    );
  };

  _changeProgress = id => {
    setTimeout(() => {
      const updateTask = store.getState().Download.tasks.find(task => task.id === id);
      const progress = updateTask ? updateTask.progress : 0;
      this.setState({ progress });

      if (!updateTask) {
        this._changeProgress(id);
        return;
      }
      if (updateTask.status === TASK_STATUS.SUCCESS) {
        NativeModules.NativeHelper.installApk(updateTask.path);
        return;
      }
      if (updateTask.status === TASK_STATUS.PAUSED) {
        store.dispatch(DownloadAction.resumeTasks([id]));
      } else if (updateTask.status === TASK_STATUS.FAILED) {
        store.dispatch(DownloadAction.restartTasks([id]));
      }
      this._changeProgress(id);
    }, 1000);
  };

  render() {
    const { version, info, canClose, fileSize } = this.props;
    return this.state.updating ? (
      <UpdatingModal
        progress={this.state.progress}
        onClose={() => {
          this.setState({
            updating: false,
          });
          this.props.onClose();
        }}
      />
    ) : (
      <PopUpContainer containerStyle={styles.container} onClose={this._onClose} closeOnClickModal={canClose}>
        <ImageBackground source={{ uri: 'mipmap/update_background' }} style={styles.backgroundImage}>
          <Text style={styles.des}>{`当前版本: ${DeviceInfo.getVersion()}`}</Text>
          <Text style={styles.des}>{`新版本: ${version},  大小：${toReadableSize(fileSize)}`}</Text>
          <ScrollView style={styles.updateInfoWrapper}>
            <TouchableWithoutFeedback>
              <Text style={styles.updateInfo}>{info}</Text>
            </TouchableWithoutFeedback>
          </ScrollView>
          <Button title="立即升级" containerStyle={styles.button} onPress={this._update} titleStyle={{ fontSize: fitSize(16) }} />
          {canClose && <Button title="暂不升级" type={ButtonType.clear} containerStyle={styles.button} onPress={this._onClose} titleStyle={{ fontSize: fitSize(16) }} />}
        </ImageBackground>
      </PopUpContainer>
    );
  }
}

let updataModalInstance = null;
let onCloseHandler = null;
let result = null;

function close() {
  if (updataModalInstance) {
    updataModalInstance.destroy();
    updataModalInstance = null;
    // eslint-disable-next-line no-unused-expressions
    onCloseHandler && onCloseHandler();
    onCloseHandler = null;
  }
}

function toast(data, flag) {
  if (!flag) {
    showToast(data);
  }
}

function init() {
  if (!result) {
    result = request.post('device/checkin');
    result.catch(() => {});
  }
  return result;
}

async function check(slient, config) {
  onCloseHandler = config && config.onClose;
  toast('正在检测', slient);
  try {
    const res = await init();
    result = null;
    global.calledCheckin = true;
    if (res.upgrade.mode === 0) {
      toast('当前已是最新版本', slient);
    } else {
      const { url, msg, mode, version, fileSize } = res.upgrade;
      if (compareVersion(DeviceInfo.getVersion(), version)) {
        updataModalInstance = new RootSiblings(<UpdateModal url={url} info={msg} version={version} canClose={mode !== 2} fileSize={fileSize} onClose={close} />);
        return;
      }
      toast('当前已是最新版本', slient);
    }
  } catch (e) {
    toast('获取版本失败', slient);
  }
  // eslint-disable-next-line no-unused-expressions
  onCloseHandler && onCloseHandler();
  onCloseHandler = null;
}

export default {
  init,
  check,
  close,
};
