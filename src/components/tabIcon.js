// @flow
import React, { Component } from 'react';
import { StyleSheet, Text, ImageBackground } from 'react-native';
import { connect } from 'react-redux';
import { fitSize } from '../util/baseUtil';
import { STYLE_CONSTANT, TASK_STATUS } from '../constant';
import DownloadTask from '../model/downloadTask';

const styles = StyleSheet.create({
  image: {
    width: fitSize(22),
    height: fitSize(22),
  },
  badge: {
    position: 'absolute',
    top: -fitSize(4),
    right: -fitSize(4),
    fontSize: fitSize(8),
    color: STYLE_CONSTANT.themeColor,
    width: fitSize(10),
    height: fitSize(10),
    borderRadius: fitSize(5),
    borderColor: STYLE_CONSTANT.themeColor,
    borderWidth: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    backgroundColor: 'white',
  },
});

type Props = {
  image: Object,
  showBadge: Boolean,
  tasks: DownloadTask[],
};
class TabIcon extends Component<Props> {
  render() {
    const { image, showBadge, tasks } = this.props;
    let badgeCount = 0;
    if (showBadge) {
      badgeCount = tasks.filter(task => task.status === TASK_STATUS.RUNNING).length;
    }
    return (
      <ImageBackground resizeMode="contain" source={image} style={styles.image}>
        {badgeCount > 0 && <Text style={styles.badge}>{badgeCount}</Text>}
      </ImageBackground>
    );
  }
}

const mapStateToProps = state => {
  const { tasks } = state.Download;
  return { tasks };
};

export default connect(mapStateToProps)(TabIcon);
