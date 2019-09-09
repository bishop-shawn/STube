// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import Icon from '../../components/icon';
import Button, { ButtonType } from '../../components/button';
import { STYLE_CONSTANT } from '../../constant';
import { fitSize, toReadableSize } from '../../util/baseUtil';
import configService from '../../service/configService';
import AdComponent from '../../components/adComponent';
import { getCategory } from '../../util/taskUtil';

const styles = StyleSheet.create({
  container: {
    marginTop: fitSize(10),
    flex: 1,
    paddingHorizontal: fitSize(10),
  },
  videoName: {
    fontSize: fitSize(14),
    color: STYLE_CONSTANT.fontBlackColor,
    includeFontPadding: false,
  },
  videoSize: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(11),
    paddingVertical: fitSize(3),
  },
  linesMenu: {
    flexDirection: 'row',
    marginTop: fitSize(10),
  },
  linesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: fitSize(10),
  },
  lineItem: {
    width: '48%',
    height: fitSize(20),
  },
  fileListTitle: {
    marginTop: fitSize(12),
    fontSize: fitSize(13),
    color: STYLE_CONSTANT.fontBlackColor,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fileItemTitle: {
    backgroundColor: STYLE_CONSTANT.itemBackgroundColor,
    flex: 1,
    padding: fitSize(10),
  },
  fileItemHeader: {
    flexDirection: 'row',
  },
  poster: {
    justifyContent: 'center',
    alignItems: 'center',
    width: fitSize(32),
    height: fitSize(32),
    borderRadius: 4,
  },
});

type Props = {
  name: String,
  fileSize: Number,
  fileList: Object[],
  onVideoItemPressed: Function,
  playingVideo: Object,
  currentLine: Number,
  allLines: [],
  onSwitchLine: Function
};

type State = {
  adBase64: String,
  adLink: String,
  expandLineInfo: Boolean,
};

export default class VideoInfo extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      adBase64: null,
      adLink: null,
      expandLineInfo: false,
    };
  }

  componentDidMount() {
    configService.once(configService.keys.playerAd, (path, link, base64) => {
      this.setState({
        adBase64: base64,
        adLink: link,
      });
    });
  }

  _renderLineMemu = () => (
    <TouchableOpacity
      onPress={() => {
        this.setState({ expandLineInfo: !this.state.expandLineInfo });
      }}
    >
      <View style={styles.linesMenu}>
        <Icon color={STYLE_CONSTANT.fontBlackColor} name="line" style={{ marginRight: fitSize(5), textAlignVertical: 'center', includeFontPadding: false }} />
        <Text>{`线路${this.props.currentLine}`}</Text>
        <Icon
          name="play"
          iconStyle={{ marginRight: 0 }}
          style={{ includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center', width: fitSize(20), transform: [{ rotateZ: this.state.expandLineInfo ? '90deg' : '-90deg' }] }}
        />
      </View>
    </TouchableOpacity>
  );

  _renderLineItem = () => {
    const { expandLineInfo } = this.state;
    const { currentLine, allLines, onSwitchLine } = this.props;
    if (!expandLineInfo) {
      return null;
    }
    return (
      <View style={styles.linesContainer}>
        {allLines.map(line => {
          const type = line === currentLine ? ButtonType.solid : ButtonType.outline;
          return (
            <Button
              key={line}
              type={type}
              containerStyle={styles.lineItem}
              onPress={() => {
                onSwitchLine(line);
              }}
              title={`线路${line}`}
            />
          );
        })}
      </View>
    );
  };

  _renderItem = data => {
    const fileItem = data.item;
    const containerStyle = this.props.playingVideo && this.props.playingVideo.index === fileItem.index ? { backgroundColor: STYLE_CONSTANT.checkedColor } : {};
    return (
      <TouchableOpacity
        onPress={() => {
          this.props.onVideoItemPressed(fileItem);
        }}
        style={{ marginTop: fitSize(5) }}
      >
        <View style={[styles.fileItemTitle, containerStyle]}>
          <View style={styles.fileItemHeader}>
            <Image source={fileItem.poster} style={styles.poster} resizeMode="contain" />
            <Text style={[styles.videoName, { paddingLeft: fitSize(15) }]} numberOfLines={2}>
              {fileItem.name}
            </Text>
          </View>
          <Text style={[styles.videoSize, { marginLeft: fitSize(47) }]}>{toReadableSize(fileItem.fileSize)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  _renderFiles = () => {
    if (this.props.fileList.length === 0) {
      return null;
    }
    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.fileListTitle}>{`共${this.props.fileList.length}个文件`}</Text>
        <FlatList data={this.props.fileList} renderItem={this._renderItem} keyExtractor={item => `${item.index}`} extraData={this.props.playingVideo}/>
      </View>
    );
  };

  render() {
    const { name, fileSize } = this.props;
    const { adBase64, adLink } = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.videoName} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.videoSize}>{toReadableSize(fileSize)}</Text>
        {this._renderLineMemu()}
        {this._renderLineItem()}
        <AdComponent style={{ marginLeft: -fitSize(10), marginTop: fitSize(15) }} base64={adBase64} link={adLink} />
        {this._renderFiles()}
      </View>
    );
  }
}
