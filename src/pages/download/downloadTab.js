// @flow
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { STYLE_CONSTANT } from '../../constant';
import Button, { ButtonType } from '../../components/button';
import { fitSize } from '../../util/baseUtil';

export const DOWNLOAD_TABS = {
  all: '全部',
  downloding: '下载中',
  completed: '已完成',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: STYLE_CONSTANT.appHeaderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: fitSize(38),
  },
  tabTitle: {
    fontSize: fitSize(16),
  },
});

type Props = {
  onTabPressed: Function,
  selectedTab: string,
};

const DownloadTab = (props: Props) => {
  const { onTabPressed, selectedTab } = props;
  const tabItems = Object.keys(DOWNLOAD_TABS).map(key => {
    const tabValue = DOWNLOAD_TABS[key];
    let titleStyle = [
      styles.tabTitle,
      {
        color: 'rgba(255,255,255,0.5)',
      },
    ];
    if (tabValue === selectedTab) {
      titleStyle = [
        styles.tabTitle,
        {
          color: STYLE_CONSTANT.appHeaderTextColor,
        },
      ];
    }
    return (
      <Button
        key={key}
        type={ButtonType.clear}
        title={tabValue}
        containerStyle={styles.button}
        titleStyle={titleStyle}
        onPress={() => {
          onTabPressed(tabValue);
        }}
      />
    );
  });
  return <View style={styles.container}>{tabItems}</View>;
};

export default DownloadTab;
