// @flow
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PopUpContainer from './popUpContainer';
import { fitSize } from '../util/baseUtil';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT, ROUTE_NAMES } from '../constant';

const styles = StyleSheet.create({
  title: {
    fontSize: fitSize(15),
    lineHeight: fitSize(18),
    color: STYLE_CONSTANT.fontBlackColor,
    width: '100%',
    padding: fitSize(20),
    paddingBottom: 0,
  },
  content: {
    width: '100%',
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontGrayColor,
    paddingHorizontal: fitSize(20),
    marginTop: fitSize(10),
    marginBottom: fitSize(15),
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
  buttonTitle: {
    fontSize: fitSize(16),
  },
});

type Props = {
  navigation: Object,
  onClose: Function,
};

const InvitePopUp = (props: Props) => {
  const { onClose, navigation } = props;
  const onPromote = () => {
    navigation.navigate(ROUTE_NAMES.popularize);
    onClose();
  };
  return (
    <PopUpContainer onClose={onClose}>
      <Text style={styles.title}>今日免费次数已用完</Text>
      <Text style={styles.content}>邀请好友获得免费次数</Text>
      <View style={styles.footerContainer}>
        <Button type={ButtonType.clear} containerStyle={styles.rightContainer} titleStyle={[styles.buttonTitle, { color: STYLE_CONSTANT.fontBlackColor }]} title="分享推广" onPress={onPromote} />
      </View>
    </PopUpContainer>
  );
};

export default InvitePopUp;
