// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Icon from '../../components/icon';
import PageContainer from '../../components/pageContainer';
import Button, { ButtonType } from '../../components/button';
import DownloadSDK from '../../sdk/downloadSDK';
import { fitSize } from '../../util/baseUtil';
import storageService from '../../service/storageService';
import { STYLE_CONSTANT } from '../../constant';
import AppHeader from '../../components/appHeader';

const styles = StyleSheet.create({
  setttingItemContainer: {
    width: STYLE_CONSTANT.screenWidth,
    paddingHorizontal: fitSize(20),
    height: fitSize(60),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  setttingItemTitle: {
    fontSize: fitSize(13),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  maxDownloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  maxDownloadingCount: {
    fontSize: fitSize(14),
    paddingHorizontal: fitSize(16),
    color: STYLE_CONSTANT.themeColor,
  },
  maxDownloadingButtonContainer: {
    backgroundColor: 'rgba(48,114,243,0.1)',
    height: fitSize(22),
    borderRadius: 0,
    width: fitSize(30),
  },
});

type Props = {
  navigation: Object,
};

type State = {
  maxDownloading: number,
  backgroundDownload: boolean,
  maxDownloading: number,
};

export default class Setting extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      maxDownloading: 0,
    };
  }

  componentDidMount() {
    storageService.getMaxDownloadingTasks().then(maxDownloading => {
      this.setState({
        maxDownloading,
      });
    });
  }

  componentWillUnmount() {
    storageService.saveMaxDownloadingTasks(this.state.maxDownloading);
    DownloadSDK.setMaxDownloadLimit(this.state.maxDownloading);
  }

  _addMaxDownloading = () => {
    const { maxDownloading } = this.state;
    this.setState({
      maxDownloading: maxDownloading + 1,
    });
  };

  _minusMaxDownloading = () => {
    const { maxDownloading } = this.state;
    this.setState({
      maxDownloading: maxDownloading - 1,
    });
  };

  _renderMaxDownloadingTasks = () => {
    const { maxDownloading } = this.state;
    const disableAdd = maxDownloading >= 5;
    const disableMinus = maxDownloading <= 1;
    return (
      <View style={styles.setttingItemContainer}>
        <Text style={styles.setttingItemTitle}>同时最大下载任务数量</Text>
        <View style={styles.maxDownloadingContainer}>
          <Button
            type={ButtonType.clear}
            icon={{
              name: 'minus',
              color: disableMinus ? STYLE_CONSTANT.seperatorColor : STYLE_CONSTANT.themeColor,
              size: fitSize(15),
            }}
            onPress={this._minusMaxDownloading}
            disabled={disableMinus}
            containerStyle={styles.maxDownloadingButtonContainer}
          />
          <Text style={styles.maxDownloadingCount}>{maxDownloading}</Text>
          <Button
            type={ButtonType.clear}
            icon={{
              name: 'plus',
              color: disableAdd ? STYLE_CONSTANT.seperatorColor : STYLE_CONSTANT.themeColor,
              size: fitSize(15),
            }}
            onPress={this._addMaxDownloading}
            disabled={disableAdd}
            containerStyle={styles.maxDownloadingButtonContainer}
          />
        </View>
      </View>
    );
  };

  _renderDownloadPath = () => (
    <TouchableWithoutFeedback>
      <View style={styles.setttingItemContainer}>
        <Text style={styles.setttingItemTitle}>下载文件路径</Text>
        <Icon name="arrowright" color={STYLE_CONSTANT.seperatorColor} size={fitSize(25)} />
      </View>
    </TouchableWithoutFeedback>
  );

  render() {
    return (
      <PageContainer>
        <AppHeader title="设置" navigation={this.props.navigation} />
        {this._renderMaxDownloadingTasks()}
        {/** this._renderDownloadPath() */}
      </PageContainer>
    );
  }
}
