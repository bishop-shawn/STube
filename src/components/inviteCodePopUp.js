// @flow
import React, { Component } from 'react';
import { Text, StyleSheet, ImageBackground, Image } from 'react-native';
import PopUpContainer from './popUpContainer';
import Input from './input';
import Button, { ButtonType } from './button';
import { fitSize, showToast } from '../util/baseUtil';
import safeRequest from '../util/safeRequest';
import { STYLE_CONSTANT } from '../constant';
import storageService from '../service/storageService';
import { DataError } from '../util/errors';

const backgroundWidth = fitSize(300);
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: backgroundWidth,
    marginBottom: fitSize(69),
  },
  backgroundImage: {
    width: '100%',
    height: backgroundWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    top: fitSize(10),
    right: fitSize(10),
  },
  // walfare: {
  //   color: STYLE_CONSTANT.fontBlackColor,
  //   fontSize: fitSize(26),
  // },
  walfareIcon: {
    height: fitSize(80),
    width: fitSize(80),
  },
  walfareDetail: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(11),
    width: '73%',
    marginTop: fitSize(7),
    textAlign: 'center',
  },
  inputContainer: {
    width: '75%',
    marginTop: fitSize(15),
    marginBottom: fitSize(40),
  },
  input: {
    fontSize: fitSize(16),
    height: fitSize(40),
    borderRadius: 5,
    borderColor: STYLE_CONSTANT.fontGrayColor,
    padding: 0,
  },
  errorMsg: {
    fontSize: fitSize(14),
    textAlign: 'center',
  },
  accept: {
    width: '75%',
    backgroundColor: STYLE_CONSTANT.themeColor,
    height: fitSize(40),
    borderRadius: 5,
  },
  acceptTitle: {
    fontSize: fitSize(16),
  },
});

type Props = {
  onClose: Function,
};
type State = {
  inputError: string,
  inviteCode: string,
};

export default class InviteCodePopUp extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      inputError: null,
      inviteCode: '',
    };
  }

  _updateInviteCode = (value: string) => {
    const inviteCode = value.replace(/[^\d\w]/g, '');
    if (inviteCode.length > 0) {
      this.setState({ inputError: null });
    }
    this.setState({
      inviteCode,
    });
  };

  _acceptInviteCode = async () => {
    const { inviteCode } = this.state;
    if (inviteCode.length > 0) {
      try {
        await safeRequest.post('/apply/invitation', JSON.stringify({ invite_code: inviteCode }));
        this.props.onClose();
        showToast('接受邀请成功，获得奖励');
        storageService.saveInvited();
      } catch (e) {
        if (e instanceof DataError) {
          if (e.message === '108') {
            showToast('您已经兑换过邀请码');
          } else {
            showToast('邀请码错误');
          }
        }
      }
    } else {
      this.setState({ inputError: '邀请码不能为空' });
    }
  };

  render() {
    const { onClose } = this.props;
    return (
      <PopUpContainer onClose={onClose} containerStyle={styles.container} closeOnClickModal={false}>
        <ImageBackground resizeMode="stretch" source={{ uri: 'mipmap/welfare_background' }} style={styles.backgroundImage}>
          <Button icon={{ name: 'close', size: fitSize(28), color: STYLE_CONSTANT.themeColor }} onPress={onClose} type={ButtonType.clear} containerStyle={styles.close} />
          {/* <Text style={styles.walfare}>福利</Text> */}
          <Image style={styles.walfareIcon} resizeMode="contain" source={{ uri: 'mipmap/welfare_title' }} />
          <Text style={styles.walfareDetail}>填写邀请码，每日次数永久+1，可用于观影或高速下载</Text>
          <Input
            errorMsg={this.state.inputError}
            errorMsgStyle={styles.errorMsg}
            placeholder="请输入邀请码"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            onChangeText={this._updateInviteCode}
            value={this.state.inviteCode}
          />
          <Button title="接 受" containerStyle={styles.accept} onPress={this._acceptInviteCode} titleStyle={styles.acceptTitle} />
        </ImageBackground>
      </PopUpContainer>
    );
  }
}
