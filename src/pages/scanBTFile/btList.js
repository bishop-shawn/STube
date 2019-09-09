// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Image, Text, FlatList, TouchableHighlight } from 'react-native';
import { connect } from 'react-redux';
import BTFile from '../../model/BTFile';
import { fitSize } from '../../util/baseUtil';
import { STYLE_CONSTANT } from '../../constant';

const styles = StyleSheet.create({
  BTContainer: {
    flexDirection: 'row',
    height: fitSize(65),
    borderBottomWidth: 1,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  BTIcon: {
    marginTop: fitSize(10),
    height: fitSize(35),
    width: fitSize(35),
    marginLeft: fitSize(10),
  },
  BTDetailContainer: {
    flex: 1,
    marginLeft: fitSize(6),
    marginRight: fitSize(10),
    marginTop: fitSize(10),
  },
  BTName: {
    includeFontPadding: false,
    fontSize: fitSize(15),
    color: STYLE_CONSTANT.fontBlackColor,
    marginBottom: fitSize(5),
    width: '100%',
  },
  BTPath: {
    fontSize: fitSize(10),
    color: STYLE_CONSTANT.fontGrayColor,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
  },
  emptyIcon: {
    marginTop: '50%',
    width: fitSize(60),
    height: fitSize(75),
  },
  emptyHint: {
    color: STYLE_CONSTANT.fontGrayColor,
    marginTop: 35,
    fontSize: 20,
  },
});

type Props = {
  BTFiles: BTFile[],
  onItemSelected: Function,
};

class BTList extends Component<Props> {
  _renderBTItem = (data: Object) => {
    const btFile: BTFile = data.item;
    return (
      <TouchableHighlight
        underlayColor={STYLE_CONSTANT.checkedColor}
        onPress={() => {
          this.props.onItemSelected(btFile);
        }}
      >
        <View style={styles.BTContainer}>
          <Image style={styles.BTIcon} source={require('../../resource/BT_folder.png')} />
          <View style={styles.BTDetailContainer}>
            <Text style={styles.BTName} numberOfLines={1} ellipsizeMode="middle">
              {btFile.name}
            </Text>
            <Text style={styles.BTPath} numberOfLines={2}>
              {btFile.path}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  };

  _renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image style={styles.emptyIcon} source={require('../../resource/no_BT.png')} />
      <Text style={styles.emptyHint}>无种子文件</Text>
    </View>
  );

  render() {
    const { BTFiles } = this.props;
    return <FlatList data={BTFiles} renderItem={this._renderBTItem} extraData={BTFiles} keyExtractor={item => item.path + item.name} initialNumToRender={8} ListEmptyComponent={this._renderEmpty} />;
  }
}

export default connect()(BTList);
