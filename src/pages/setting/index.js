// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import AppHeader from '../../components/appHeader';
import updateChecker from '../../components/updateChecker';
import { fitSize, showToast } from '../../util/baseUtil';
import { STYLE_CONSTANT } from '../../constant';
import PageContainer from '../../components/pageContainer';
import DeviceInfo from '../../util/deviceInfo';

const styles = StyleSheet.create({
  pressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: fitSize(15),
    marginHorizontal: fitSize(15),
    borderBottomWidth: fitSize(1),
    borderColor: STYLE_CONSTANT.seperatorColor,
    alignItems: 'center',
  },
  pressItemTitle: {
    color: STYLE_CONSTANT.fontBlackColor,
    fontSize: fitSize(14),
  },
  pressItemMsg: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(12),
  },
});

type Props = {
  navigation: Object,
};
type State = {};

export default class Setting extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  _checkUpdate = () => {
    const timstamp = Date.now();
    if (timstamp - this._lastCheckTime < 2000) {
      showToast('当前已是最新版本');
      return;
    }
    this._lastCheckTime = timstamp;
    updateChecker.check();
  };

  _renderItem = (title, onPress, msg) => (
    <TouchableHighlight underlayColor={STYLE_CONSTANT.checkedColor} onPress={onPress}>
      <View style={styles.pressItem}>
        <Text style={styles.pressItemTitle}>{title}</Text>
        <Text style={styles.pressItemMsg}>{msg}</Text>
      </View>
    </TouchableHighlight>
  );

  render() {
    return (
      <PageContainer>
        <AppHeader navigation={this.props.navigation} title="设置" />
        {this._renderItem('检查版本', this._checkUpdate, DeviceInfo.getVersion())}
      </PageContainer>
    );
  }
}
