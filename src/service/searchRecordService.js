import { AsyncStorage } from 'react-native';

const key = 'search_history';
let tags = [];

const _storeData = async jsonStr => {
  try {
    await AsyncStorage.setItem(key, jsonStr);
  } catch (error) {
    // Error saving data
  }
};

const _retrieveData = async () => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
    return '[]';
  } catch (error) {
    return '[]';
  }
};

const getAll = async () => {
  const data = await _retrieveData();
  tags = JSON.parse(data);
  return tags;
};

const getAllSync = () => tags;

const addSearchRecord = async value => {
  value = value.trim();
  const data = await getAll();
  // remove exist data
  const index = data.indexOf(value);
  if (index !== -1) {
    data.splice(index, 1);
  } else if (data.length >= 10) {
    data.pop();
  }
  // unshift new data
  data.unshift(value);
  // storage
  _storeData(JSON.stringify(data));
  return data;
};

const clear = () => {
  tags = [];
  _storeData('[]');
};

export default {
  getAll,
  getAllSync,
  addSearchRecord,
  clear,
};
