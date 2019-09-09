// @flow
import React, { Component, Children } from 'react';
import { ImageBackground, View, Text, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { fitSize, openUrl } from '../../util/baseUtil';
import { STYLE_CONSTANT } from '../../constant';
import PopUpContainer from '../popUpContainer';
import Button, { ButtonType } from '../button';

const height = STYLE_CONSTANT.screenHeight * 0.55;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: STYLE_CONSTANT.screenWidth * 0.76,
    height,
    marginBottom: fitSize(20),
  },
  ImageBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: fitSize(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    padding: fitSize(20),
    fontSize: fitSize(22),
    fontWeight: '400',
    color: STYLE_CONSTANT.themeColor,
  },
  body: {
    width: '100%',
    padding: fitSize(2),
    flex: 1,
  },
  link: {
    color: STYLE_CONSTANT.themeColor,
  },
  subTitle: {
    marginVertical: fitSize(10),
    fontSize: fitSize(15),
    color: STYLE_CONSTANT.themeColor,
  },
  content: {
    fontSize: fitSize(14),
    color: '#000000',
    marginHorizontal: fitSize(28),
  },
  button: {
    marginTop: fitSize(20),
    marginBottom: fitSize(20),
    width: fitSize(200),
    height: fitSize(45),
  },
});

type Props = {
  title: String,
  contents: String | String[],
  onClose: Function,
};

// the first page announcement.
export default class Announcement extends Component<Props> {
  _renderDetails = details => {
    const splitDetails = details.split(/(<[/]?a>)/);
    return Children.map(splitDetails, (item, index) => {
      if (item === '<a>' || item === '</a>') return null;
      if (index > 0 && splitDetails[index - 1] === '<a>') return <Text style={styles.link} onPress={() => { openUrl(item); }}>{item}</Text>;
      return item;
    });
  };

  _renderActivityBody = (timeRange, details) => (
      <View style={styles.body}>
        <Text style={[styles.subTitle, { marginTop: 0 }]}>—— 活动时间 ——</Text>
        <Text style={styles.content}>{timeRange}</Text>
        <Text style={styles.subTitle}>—— 活动详情 ——</Text>
        <ScrollView style={{ flex: 1 }}>
          <TouchableWithoutFeedback>
            <Text style={styles.content}>{this._renderDetails(details)}</Text>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
  );

  _renderOfficalBody = details => (
      <ScrollView style={styles.body}>
        <TouchableWithoutFeedback>
          <Text style={styles.content}>{this._renderDetails(details)}</Text>
        </TouchableWithoutFeedback>
      </ScrollView>
  );

  render() {
    const { title, contents, onClose } = this.props;
    return (
      <PopUpContainer containerStyle={styles.container} onClose={onClose} closeOnClickModal={false}>
        <View style={styles.ImageBackground}>
          {/* <ImageBackground resizeMode="stretch" source={require('../../resource/announcement_bg.png')} style={styles.ImageBackground}> */}
          <Text style={styles.title}>{title}</Text>
          {Array.isArray(contents) ? this._renderActivityBody(contents[0], contents[1]) : this._renderOfficalBody(contents)}
          <ImageBackground resizeMode="stretch" style={styles.button} source={{ uri: 'mipmap/announcement_button' }}>
            <Button containerStyle={{ width: '100%', height: '90%' }} titleStyle={{ fontSize: fitSize(18), color: '#fff' }} title="我知道了" type={ButtonType.clear} onPress={onClose} />
          </ImageBackground>
          {/* </ImageBackground> */}
        </View>
      </PopUpContainer>
    );
  }
}
