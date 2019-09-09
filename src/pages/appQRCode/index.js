// @flow
import React, { Component } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Clipboard, CameraRoll, ScrollView, NativeModules } from 'react-native';
import ViewShot from 'react-native-view-shot';
import QRCode from '../../components/QRCode';
import PageContainer from '../../components/pageContainer';
import AppHeader from '../../components/appHeader';
import Button from '../../components/button';
import { STYLE_CONSTANT, CHANNEL, DEVICE_INFO, MARKET } from '../../constant';
import { fitSize, showToast } from '../../util/baseUtil';
import request from '../../util/request';

const { NativeHelper } = NativeModules;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: fitSize(20),
    marginVertical: fitSize(50),
    paddingHorizontal: fitSize(40),
    paddingTop: fitSize(60),
    paddingBottom: fitSize(20),
    borderRadius: fitSize(5),
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowRadius: fitSize(5),
    elevation: 2,
  },
  title: {
    fontSize: fitSize(16),
    paddingBottom: fitSize(15),
    color: STYLE_CONSTANT.fontBlackColor,
    textAlign: 'center',
  },
  inviteCodeTitle: {
    color: STYLE_CONSTANT.fontBlackColor,
    marginTop: fitSize(20),
  },
  inviteCode: {
    width: fitSize(200),
    padding: fitSize(2),
    marginTop: fitSize(7),
    backgroundColor: '#f2f7ff',
    fontSize: fitSize(30),
    color: STYLE_CONSTANT.themeColor,
    textAlign: 'center',
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: fitSize(20),
  },
  button: {
    padding: fitSize(20),
    width: '47%',
  },
});

type Props = {
  navigation: Object,
};

export default class AppQRCode extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.state = {
      inviteCode: '------',
      inviteUrl: null, // have to be null
    };
    this.viewShot = null;
  }

  componentDidMount() {
    request
      .post('/get/deviceinfo')
      .then(data => {
        this.setState({
          inviteCode: data.invite_code,
          inviteUrl: data.invite_url,
          inviteMsg: data.invite_msg,
        });
      })
      .catch(() => {});
  }

  _saveQRCode = () => {
    this.viewShot.capture().then(uri => {
      CameraRoll.saveToCameraRoll(uri);
      showToast('二维码已保存到相册');
    });
  };

  render() {
    const inviteUrl = this.state.inviteUrl ? `${this.state.inviteUrl}?invitecode=${this.state.inviteCode}&appid=${CHANNEL}&market=${MARKET}&deviceid=${DEVICE_INFO.ID}` : null;
    return (
      <PageContainer>
        <AppHeader navigation={this.props.navigation} />
        <ScrollView>
          <ViewShot
            ref={ref => {
              this.viewShot = ref;
            }}
            options={{ format: 'jpg', quality: 0.9 }}
          >
            <View style={styles.container}>
              <Text style={styles.title}>扫码下载 {NativeHelper.app_name} APP</Text>
              <View style={{ width: fitSize(160), height: fitSize(160), overflow: 'hidden' }}>
                {inviteUrl && <QRCode value={inviteUrl} size={fitSize(160)} bgColor="#000" fgColor="white" />}
              </View>
              <Text style={styles.inviteCodeTitle}>您的邀请码</Text>
              <TouchableWithoutFeedback
                onLongPress={() => {
                  Clipboard.setString(this.state.inviteCode);
                  showToast('邀请码复制成功');
                }}
              >
                <Text style={styles.inviteCode}>{this.state.inviteCode}</Text>
              </TouchableWithoutFeedback>
            </View>
          </ViewShot>
          <View style={styles.buttonWrapper}>
            <Button title="保存二维码" containerStyle={styles.button} onPress={this._saveQRCode} titleStyle={{ fontSize: fitSize(15) }} />
            <Button
              title="复制推广链接"
              containerStyle={styles.button}
              onPress={() => {
                Clipboard.setString(this.state.inviteMsg);
                showToast('已复制');
              }}
              titleStyle={{ fontSize: fitSize(15) }}
            />
          </View>
        </ScrollView>
      </PageContainer>
    );
  }
}
