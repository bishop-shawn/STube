// @flow
import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { fitSize } from '../../util/baseUtil';
import { STYLE_CONSTANT } from '../../constant';
import Icon from '../../components/icon';

const styles = StyleSheet.create({
  tagGroup: {
    paddingHorizontal: fitSize(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: fitSize(36),
  },
  tagGroupTitle: {
    fontSize: fitSize(14),
    color: STYLE_CONSTANT.fontGrayColor,
  },
  tagGroupBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  tag: {
    paddingVertical: fitSize(3),
    paddingHorizontal: fitSize(8),
    fontSize: fitSize(14),
    borderWidth: 1,
    borderRadius: 3,
    marginRight: fitSize(10),
    marginBottom: fitSize(10),
  },
});

type Props = {
  title: String,
  onTagPress?: Function,
  tags?: [String],
  color?: String,
  showClean?: Boolean,
  loading?: Boolean,
  onClean?: Function,
};

type TagProps = {
  value: String,
  color?: String,
  onPress?: String,
};

export const Tag = (props: TagProps) => (
  <Text
    onPress={() => {
      props.onPress(props.value);
    }}
    numberOfLines={1}
    style={[
      styles.tag,
      {
        borderColor: props.color,
        color: props.color,
      },
    ]}
  >
    {props.value}
  </Text>
);

Tag.defaultProps = {
  color: STYLE_CONSTANT.themeColor,
  onPress: () => {},
};

const TagGroup = (props: Props) => {
  const { title, tags, color, showClean, loading, onClean, onTagPress } = props;
  return (
    <View style={styles.tagGroup}>
      <View style={styles.header}>
        <Text style={styles.tagGroupTitle}>{title}</Text>
        {showClean && <Icon style={{ left: fitSize(10), padding: fitSize(10) }} name="trash" size={fitSize(16)} onPress={onClean} />}
        {loading && <ActivityIndicator style={{ left: fitSize(10), padding: fitSize(10) }} size="small" color="gray" />}
      </View>
      <View style={styles.tagGroupBody}>
        {tags.map(value => (
          <Tag color={color} value={value} key={value} onPress={val => onTagPress(val)} />
        ))}
      </View>
    </View>
  );
};

TagGroup.defaultProps = {
  onTagPress: () => {},
  tags: [],
  color: STYLE_CONSTANT.themeColor,
  showClean: false,
  loading: false,
  onClean: () => {},
};

export default TagGroup;
