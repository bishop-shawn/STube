// @flow
import React from 'react';
import { StyleSheet, Text, View, NativeModules, Linking } from 'react-native';
import RootSiblings from 'react-native-root-siblings';
import Button, { ButtonType } from './button';
import { fitSize, confirmAllPermission, showToast } from '../util/baseUtil';
import initUtil from '../util/initUtil';
import { STYLE_CONSTANT, IS_IOS } from '../constant';
import PopUpContainer from './popUpContainer';

const styles = StyleSheet.create({
  title: {
    width: '100%',
    padding: fitSize(20),
    color: STYLE_CONSTANT.fontBlackColor,
  },
  footerContainer: {
    flexDirection: 'row',
    height: fitSize(50),
  },
  rightContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
    borderRadius: 0,
  },
  leftContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: fitSize(50),
    borderRadius: 0,
  },
  buttonTitle: {
    fontSize: fitSize(16),
  },
});

let popUp = null;

type Props = {
  permissionStrings: [string],
  recheckPermission: Function,
  gotoAppSetting: Function,
};

const PermissionSettingPopUp = (props: Props) => (
  <PopUpContainer closeOnClickModal={false}>
    <Text style={styles.title}>
      本应用需要
      <Text style={{ color: STYLE_CONSTANT.themeColor }}>{props.permissionStrings.join('、')}</Text>
      权限，请前往设置
    </Text>
    <View style={styles.footerContainer}>
      <Button type={ButtonType.clear} containerStyle={styles.rightContainer} titleStyle={[styles.buttonTitle, { color: STYLE_CONSTANT.fontBlackColor }]} title="重试" onPress={props.recheckPermission} />
      <Button type={ButtonType.clear} containerStyle={styles.leftContainer} titleStyle={styles.buttonTitle} title="去设置" onPress={props.gotoAppSetting} />
    </View>
  </PopUpContainer>
);

function close() {
  if (popUp) {
    popUp.destroy();
  }
}

function update(_permissionStrings, _gotoAppSetting, _recheckPermission) {
  if (popUp) {
    popUp.update(<PermissionSettingPopUp permissionStrings={_permissionStrings} gotoAppSetting={_gotoAppSetting} recheckPermission={_recheckPermission} />);
  }
}

function gotoAppSetting() {
  if (IS_IOS) {
    Linking.openURL('app-settings:').catch(err => console.log('goto app-settings error', err));
  }
  NativeModules.NativeHelper.openNetworkSettings(data => {
    console.log('call back data', data);
  });
}

async function recheckPermission() {
  const permissionStrings = await confirmAllPermission();
  if (permissionStrings.length === 0) {
    initUtil.initApp();
    close();
  } else {
    update(permissionStrings, gotoAppSetting, recheckPermission);
    showToast('请前往设置修改访问权限');
  }
}

function show(permissionStrings) {
  popUp = new RootSiblings(<PermissionSettingPopUp permissionStrings={permissionStrings} recheckPermission={recheckPermission} gotoAppSetting={gotoAppSetting} />);
}

export default { show, close };
