// @flow
import React, { Component } from 'react';
import { View, StyleSheet, SectionList, TouchableHighlight } from 'react-native';
import PageContainer from './pageContainer';
import Button, { ButtonType } from './button';
import { STYLE_CONSTANT, PAGE_APPEAR_STATUS } from '../constant';
import { fitSize } from '../util/baseUtil';
import AppHeader from './appHeader';
import Icon from './icon';

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: STYLE_CONSTANT.screenWidth,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: STYLE_CONSTANT.screenWidth,
    height: fitSize(50),
    backgroundColor: 'white',
    borderTopWidth: 0.7,
    borderColor: STYLE_CONSTANT.seperatorColor,
  },
  footerItemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSeperator: {
    backgroundColor: STYLE_CONSTANT.seperatorColor,
    width: fitSize(2),
    height: fitSize(35),
  },
  footerButtonTitle: {
    fontSize: fitSize(15),
    color: 'black',
  },
  selectedIcon: {
    position: 'absolute',
    top: fitSize(2),
    right: 0,
    height: '100%',
    fontSize: fitSize(18),
    paddingHorizontal: fitSize(15),
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

type Props = {
  navigation: Object,
  dataList: Object[],
  itemKey: string,
  initialNumToRender?: number,
  renderItem: Function,
  onDelete: Function,
  itemContainerStyle: Object,
  title: string,
  showEdit?: boolean,
  renderEmpty: Function,
  renderSectionHeader: Function,
  onItemPressed: Function,
};
type State = {
  isEditing: boolean,
  selectAll: boolean,
  selectedItems: number[],
  allItems: Object[],
  selection: Object[],
  pressedItem: Object,
};

export default class MultiSelectPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let allItems = [];
    props.dataList.forEach(section => {
      allItems = allItems.concat(section.data);
    });
    this.state = {
      isEditing: !props.showEdit,
      selectAll: false,
      selectedItems: [],
      selection: [],
      allItems,
      pressedItem: null,
    };
  }

  componentDidMount() {
    this._didFocusListener = this.props.navigation.addListener(PAGE_APPEAR_STATUS.didFocus, () => {
      this.setState({ pressedItem: null });
    });
  }

  componentWillUnmount() {
    this._didFocusListener.remove();
  }

  static getDerivedStateFromProps(props) {
    const { dataList } = props;
    let allItems = [];
    dataList.forEach(section => {
      allItems = allItems.concat(section.data);
    });
    return { allItems };
  }

  _goBack = () => {
    this.props.navigation.pop();
  };

  _updateSelectAllStatus = () => {
    if (this.state.selectAll) {
      this.setState({
        selectAll: false,
        selectedItems: [],
      });
      return;
    }
    const { itemKey } = this.props;
    const selectedItems = this.state.allItems.map(data => data[itemKey]);
    this.setState({
      selectAll: true,
      selectedItems,
    });
  };

  _updateEditStatus = () => {
    const { isEditing } = this.state;
    if (isEditing) {
      this.setState({
        isEditing: false,
        selectAll: false,
        selectedItems: [],
      });
    } else {
      this.setState({
        isEditing: true,
      });
    }
  };

  _updateSelectedItemStatus = (selectItem, item) => {
    const { selectedItems, selection, allItems } = this.state;
    const index = selectedItems.indexOf(selectItem);
    if (index >= 0) {
      selectedItems.splice(index, 1);
      selection.splice(index, 1);
    } else {
      selectedItems.push(selectItem);
      selection.push(item);
    }
    this.setState({
      selectAll: selectedItems.length === allItems.length,
      selectedItems,
    });
  };

  _onItemPressed = (selectItem, item, isEditing) => {
    if (isEditing) {
      this._updateSelectedItemStatus(selectItem, item);
    } else if (this.props.onItemPressed) {
      this.props.onItemPressed(item);
    }
  };

  _deleteItems = () => {
    this.props.onDelete(
      this.state.selectedItems,
      () => {
        this.setState({
          isEditing: !this.props.showEdit,
          selectAll: false,
          selectedItems: [],
        });
      },
      this.state.selection,
    );
  };

  _renderHeader = () => {
    const { isEditing, selectedItems, allItems } = this.state;
    let { title } = this.props;
    if (isEditing && allItems.length > 0) {
      title = selectedItems.length > 0 ? `已选择${selectedItems.length}个文件` : '请选择文件';
    }
    let rightButtons = [];
    if (this.props.showEdit && allItems.length > 0) {
      const rightText = isEditing ? '取消' : '编辑';
      rightButtons = [{ title: rightText, onPress: this._updateEditStatus }];
    }
    return <AppHeader title={title} navigation={this.props.navigation} rightButtons={rightButtons} />;
  };

  _renderListItem = data => {
    const { item } = data;
    const { selectAll, isEditing, selectedItems, pressedItem } = this.state;
    const itemValue = item[this.props.itemKey];
    const selected = selectAll || selectedItems.indexOf(itemValue) >= 0;
    const iconColor = selected ? STYLE_CONSTANT.themeColor : STYLE_CONSTANT.seperatorColor;
    const pressedStyle = pressedItem === itemValue ? { backgroundColor: STYLE_CONSTANT.checkedColor } : {};
    return isEditing ? (
      <TouchableHighlight
        underlayColor={STYLE_CONSTANT.checkedColor}
        onPress={() => {
          this._onItemPressed(itemValue, item, isEditing);
        }}
        style={this.props.itemContainerStyle}
      >
        <View style={styles.itemContainer}>
          {this.props.renderItem(item, isEditing)}
          <Icon name='check' color={iconColor} style={styles.selectedIcon} />
        </View>
      </TouchableHighlight>
    ) : (
      <TouchableHighlight
        underlayColor={STYLE_CONSTANT.checkedColor}
        onPress={() => {
          this.setState({ pressedItem: itemValue });
          this._onItemPressed(itemValue, item, isEditing);
        }}
      >
        <View style={[styles.itemContainer, this.props.itemContainerStyle, pressedStyle]}>{this.props.renderItem(item, isEditing)}</View>
      </TouchableHighlight>
    );
  };

  _renderFooter = () => {
    const { selectAll, selectedItems } = this.state;
    const disableDelete = selectedItems.length <= 0;
    const deleteTitleColor = disableDelete ? 'rgba(255,0,0,0.3)' : 'red';
    return (
      <View style={styles.footerContainer}>
        <Button
          type={ButtonType.clear}
          title={selectAll ? '取消全选' : '全选'}
          onPress={this._updateSelectAllStatus}
          titleStyle={styles.footerButtonTitle}
          containerStyle={styles.footerItemContainer}
        />
        <View style={styles.footerSeperator} />
        <Button
          type={ButtonType.clear}
          title="删除"
          disabled={disableDelete}
          titleStyle={[
            styles.footerButtonTitle,
            {
              color: deleteTitleColor,
            },
          ]}
          onPress={this._deleteItems}
          containerStyle={styles.footerItemContainer}
        />
      </View>
    );
  };

  render() {
    const { dataList, initialNumToRender, renderEmpty, itemKey, renderSectionHeader } = this.props;
    return (
      <PageContainer>
        {this._renderHeader()}
        <SectionList
          contentContainerStyle={this.state.allItems.length > 0 ? {} : { flex: 1 }}
          style={styles.list}
          sections={dataList}
          renderItem={this._renderListItem}
          keyExtractor={item => item[itemKey]}
          extraData={this.state}
          initialNumToRender={initialNumToRender}
          ListEmptyComponent={renderEmpty}
          renderSectionHeader={renderSectionHeader}
        />
        {this.state.isEditing && this.state.allItems.length > 0 && this._renderFooter()}
      </PageContainer>
    );
  }
}

MultiSelectPage.defaultProps = {
  showEdit: true,
  initialNumToRender: 7,
};
