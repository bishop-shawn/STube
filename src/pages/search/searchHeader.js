// @flow
import React, { Component } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import AppHeader from '../../components/appHeader';
import { STYLE_CONSTANT } from '../../constant';
import { fitSize } from '../../util/baseUtil';
import Icon from '../../components/icon';
import Button, { ButtonType } from '../../components/button';

const innerHeight = fitSize(35);

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: STYLE_CONSTANT.screenWidth - fitSize(75),
  },
  // searchIcon: {
  //   width: fitSize(25),
  //   height: fitSize(25),
  // },
  inputOutStyle: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputStyle: {
    height: innerHeight,
    color: '#fff',
    fontSize: fitSize(15),
    textAlignVertical: 'center',
    textAlign: 'left',
    paddingLeft: 0,
    paddingRight: fitSize(10),
    paddingVertical: 0,
    borderWidth: 0,
    flex: 1,
  },
  icon: {
    height: innerHeight,
    paddingHorizontal: fitSize(10),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  inputClear: {
    padding: fitSize(5),
    color: '#fff',
  },
});

type Props = {
  editAble?: Boolean,
  autoFocus?: Boolean,
  value?: String,
  onChangeText?: Function,
  onSearch?: Function,
  onLeftPress?: Function,
  onPress?: Function,
  onClear?: Function,
  onBack?: Function,
};

export default class SearchHeader extends Component<Props> {
  static defaultProps = {
    editAble: false,
    autoFocus: true,
    onLeftPress: () => {},
    onChangeText: () => {},
    onSearch: () => {},
    onPress: () => {},
    onClear: () => {},
    onBack: () => {},
  };

  _renderInput = () => {
    const { editAble, autoFocus, value, onChangeText, onSearch, onPress } = this.props;
    return (
      <View style={styles.inputOutStyle}>
        {editAble ? (
          <TextInput
            autoFocus={autoFocus}
            value={value}
            placeholder="请输入片名"
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            style={styles.inputStyle}
            returnKeyType="search"
            onSubmitEditing={() => {
              onSearch();
            }}
            onChangeText={onChangeText}
            // onBlur={this._shouldReturn}
          />
        ) : (
          <Text onPress={onPress} style={[styles.inputStyle, { color: 'rgba(255, 255, 255, 0.7)' }]}>
            请输入片名
          </Text>
        )}
      </View>
    );
  };

  render() {
    const { editAble, value, onLeftPress, onClear, onBack } = this.props;
    return (
      <AppHeader
        showGoBack={false}
        leftComponent={
          <View style={styles.searchContainer}>
            <Button
              icon={{
                name: 'search',
                size: fitSize(18),
                color: STYLE_CONSTANT.appHeaderTextColor,
              }}
              containerStyle={styles.icon}
              onPress={onLeftPress}
              type={ButtonType.clear}
            />

            {this._renderInput()}
            {editAble && value ? <Icon name="close" size={fitSize(16)} style={styles.inputClear} onPress={onClear} /> : null}
          </View>
        }
        rightButtons={[
          {
            title: editAble ? '取消' : '搜索',
            onPress: onBack,
          },
        ]}
      />
    );
  }
}
