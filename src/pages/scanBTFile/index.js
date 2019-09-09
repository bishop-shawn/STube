// @flow
import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import RNFS from 'react-native-fs';
import { fitSize, confirmWritePermission, isTorrent } from '../../util/baseUtil';
import { IS_IOS, PAGE_APPEAR_STATUS, ReadDirItem, STYLE_CONSTANT } from '../../constant';
import PageContainer from '../../components/pageContainer';
import Button from '../../components/button';
import BTFile from '../../model/BTFile';
import BTList from './btList';
import selectFilePopUper from '../../components/selectFilePopUper';
import AppHeader from '../../components/appHeader';

const styles = StyleSheet.create({
  accessingHint: {
    marginTop: '40%',
    textAlign: 'center',
    fontSize: fitSize(16),
    color: 'black',
    width: '100%',
  },
  scanningContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: '40%',
  },
  scannedCount: {
    textAlign: 'center',
    fontSize: fitSize(14),
    color: 'black',
  },
  scanningPath: {
    textAlign: 'center',
    fontSize: fitSize(10),
    color: 'black',
    width: '85%',
  },
  cancelContainer: {
    width: '65%',
    height: fitSize(40),
    borderRadius: 6,
    backgroundColor: 'rgba(48,114,243,0.1)',
    marginTop: fitSize(220),
  },
  cancelTitle: {
    color: STYLE_CONSTANT.themeColor,
    fontSize: fitSize(16),
  },
});

type Props = {
  navigation: Object,
};
type State = {
  isScanning: boolean,
  scannedBTCount: number,
  scanningPath: string,
  readAccessGranted: boolean,
  scannedBTFiles: BTFile[],
  showSelectFilePopUp: boolean,
  isParsing: boolean,
};

class ScanBTFile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isScanning: false,
      scannedBTCount: 0,
      scanningPath: '',
      readAccessGranted: false,
      scannedBTFiles: [],
    };
    this._torrentInfo = null;
  }

  componentDidMount() {
    this.viewDidAppear = this.props.navigation.addListener(PAGE_APPEAR_STATUS.didFocus, this._checkAccessAndScanBT);
  }

  componentWillUnmount() {
    this.viewDidAppear.remove();
  }

  _checkAccessAndScanBT = async () => {
    const granted = await confirmWritePermission();
    if (granted) {
      this.setState({
        readAccessGranted: true,
        isScanning: true,
        scannedBTCount: 0,
        scannedBTFiles: [],
      });
      const scannedBTFiles = [];
      if (IS_IOS) {
        // TODO
        await this._scanBTFile(RNFS.LibraryDirectoryPath, scannedBTFiles);
        await this._scanBTFile(RNFS.DocumentDirectoryPath, scannedBTFiles);
        await this._scanBTFile(RNFS.MainBundlePath, scannedBTFiles);
      } else {
        await this._scanBTFile('/storage/emulated/0/', scannedBTFiles);
      }
      this.setState({
        isScanning: false,
        scanningPath: '',
        scannedBTFiles,
      });
    }
  };

  _scanBTFile = async (dirpath: string, scannedBTFiles: BTFile[]) => {
    if (!this.state.isScanning) {
      return;
    }
    this.setState({
      scanningPath: dirpath,
    });
    try {
      const dirItems: ReadDirItem[] = await RNFS.readDir(dirpath);
      for (let i = 0, len = dirItems.length; i < len; i += 1) {
        const dirItem = dirItems[i];
        if (dirItem.isFile() && isTorrent(dirItem.name)) {
          const { scannedBTCount } = this.state;
          this.setState({
            scannedBTCount: scannedBTCount + 1,
          });
          scannedBTFiles.push(new BTFile(dirItem.name, dirItem.path));
        } else if (dirItem.isDirectory()) {
          await this._scanBTFile(dirItem.path, scannedBTFiles);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  _startParseBTFile = (btFile: BTFile) => {
    selectFilePopUper.show({ path: btFile.path });
  };

  _renderScanningStatus = () => {
    const { scannedBTCount, scanningPath } = this.state;
    return (
      <View style={styles.scanningContainer}>
        <Text style={styles.scannedCount} numberOfLines={1}>{`已扫描到${scannedBTCount}个种子`}</Text>
        <Text style={styles.scanningPath} numberOfLines={1}>{`正在扫描: ${scanningPath}`}</Text>
        <Button
          title="取 消"
          containerStyle={styles.cancelContainer}
          titleStyle={styles.cancelTitle}
          onPress={() => {
            this.setState({
              isScanning: false,
            });
          }}
        />
      </View>
    );
  };

  render() {
    const { isScanning, readAccessGranted, scannedBTFiles } = this.state;
    const scanCompleted = readAccessGranted && !isScanning;
    return (
      <PageContainer>
        <AppHeader title="添加BT任务" navigation={this.props.navigation} rightButtons={scanCompleted ? [{ icon: 'refresh', onPress: this._checkAccessAndScanBT }] : null} />
        {isScanning && this._renderScanningStatus()}
        {!readAccessGranted && <Text style={styles.accessingHint}>正在确认读取文件权限</Text>}
        {scanCompleted && <BTList BTFiles={scannedBTFiles} onItemSelected={this._startParseBTFile} />}
      </PageContainer>
    );
  }
}

export default connect()(ScanBTFile);
