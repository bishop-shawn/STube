// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ImageBackground, StatusBar } from 'react-native';
import PageContainer from '../../components/pageContainer';
import DeviceInfo from '../../util/deviceInfo';
import AppHeader from '../../components/appHeader';
import { STYLE_CONSTANT, ROUTE_NAMES } from '../../constant';
import { fitSize, showToast } from '../../util/baseUtil';
import safeRequest from '../../util/safeRequest';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';
import configService from '../../service/configService';
import AdComponent from '../../components/adComponent';
import Button, { ButtonType } from '../../components/button';

const styles = StyleSheet.create({
  accountInfoContainer: {
    margin: fitSize(15),
    width: STYLE_CONSTANT.screenWidth - fitSize(15) * 2,
    height: (STYLE_CONSTANT.screenWidth - fitSize(15) * 2) / 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  accountInfo: {
    margin: fitSize(3),
    color: 'white',
    fontSize: fitSize(14),
  },
  actionsContainer: {
    marginHorizontal: fitSize(5),
    width: STYLE_CONSTANT.screenWidth - fitSize(5) * 2,
    height: ((STYLE_CONSTANT.screenWidth - fitSize(5) * 2) * 27) / 68,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: fitSize(20),
  },
  action: {
    flexDirection: 'column',
    width: '18%',
    height: '50%',
    justifyContent: 'space-around',
  },
});

type Props = {
  navigation: Object,
};

export default class Mine extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      refreshing: false,
      taskTotal: 0,
      taskRest: 0,
      inviteCount: 0,
      adBase64: null,
      adLink: null,
      leftSeconds: 0,
    };
    this._lastCheckTime = 0;
    this._didFocusListener = null;
  }

  componentDidMount() {
    this._didFocusListener = this.props.navigation.addListener('didFocus', () => {
      this._refresh();
    });
    configService.once(configService.keys.mineAd, (path, link, base64) => {
      this.setState({
        adBase64: base64,
        adLink: link,
      });
    });
  }

  componentWillUnmount() {
    this._didFocusListener.remove();
  }

  _refresh = () => {
    this.setState({
      refreshing: true,
    });
    this._getData().finally(() => {
      this.setState({
        refreshing: false,
      });
    });
  };

  _getData = () => {
    const p1 = safeRequest.post('/get/device/quota').then(data => {
      this.setState({
        taskTotal: data.task_total,
        taskRest: data.task_total - data.task_used,
        leftSeconds: data.left_seconds,
      });
    });
    const p2 = safeRequest.post('/get/deviceinfo').then(data => {
      this.setState({
        inviteCount: data.invite_count,
      });
    });
    return Promise.all([p1, p2]).catch(() => {
      showToast('数据异常');
    });
  };

  _gotoSetting = () => {
    this.props.navigation.navigate(ROUTE_NAMES.setting);
  };

  _renderAccountInfoItem = (title, content) => (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.accountInfo}>{title}</Text>
      <Text style={styles.accountInfo}>{content}</Text>
    </View>
  );

  _renderAccountInfo = () => {
    const { taskTotal, taskRest, inviteCount } = this.state;
    const leftTimes = `${taskRest}/${taskTotal}`;
    return (
      <ImageBackground style={styles.accountInfoContainer} source={{ uri: 'mipmap/account_info' }}>
        {this._renderAccountInfoItem(inviteCount, '邀请人数')}
        {this._renderAccountInfoItem(leftTimes, '剩余次数')}
      </ImageBackground>
    );
  };

  _renderItem = (img, title, onPress) => (
    <Button
      containerStyle={styles.action}
      title={title}
      titleStyle={{ color: STYLE_CONSTANT.fontBlackColor }}
      image={img}
      imageStyle={{ width: fitSize(25), height: fitSize(25) }}
      onPress={onPress}
      type={ButtonType.clear}
    />
  );

  _renderBody = () => (
    <ImageBackground style={styles.actionsContainer} source={require('../../resource/actionsContainer.png')}>
      {this._renderItem({ uri: 'mipmap/promote' }, '分享推广', () => {
        reporter.access({
          [REPORT_KEYS.from]: DataMap.from_mine,
          [REPORT_KEYS.details]: '分享推广',
        });
        this.props.navigation.navigate(ROUTE_NAMES.popularize);
      })}
      {this._renderItem({ uri: 'mipmap/watch_history' }, '播放记录', () => {
        this.props.navigation.navigate(ROUTE_NAMES.watchRecords);
      })}
    </ImageBackground>
  );

  render() {
    const { adBase64, adLink } = this.state;
    return (
      <PageContainer>
        <AppHeader title="我的" showGoBack={false} rightButtons={[{ icon: 'setting', onPress: this._gotoSetting }]} />
        <ScrollView
          contentContainerStyle={{ minHeight: STYLE_CONSTANT.screenHeight - fitSize(106) - (DeviceInfo.getNotchHeight() > 0 ? 0 : StatusBar.currentHeight) }}
          refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._refresh} colors={[STYLE_CONSTANT.themeColor]} />}
        >
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              {this._renderAccountInfo()}
              {this._renderBody()}
            </View>
            <AdComponent base64={adBase64} link={adLink} />
          </View>
        </ScrollView>
      </PageContainer>
    );
  }
}
