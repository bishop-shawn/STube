// @flow
import { Linking, PermissionsAndroid, Dimensions, NativeModules } from 'react-native';
import { ReadDirItem } from '../constant';
import storageService from '../service/storageService';

const { NativeHelper, NativeToast } = NativeModules;

const { height, width } = Dimensions.get('window');
const scale = Math.min(width / 360, height / 640);
const readAbleSizeReg = /(B|KB|MB|GB|TB|PB|K|M|G|T)[ ]*$/;

const _convertNumber = val => {
  const re = parseFloat(val);
  return isNaN(re) ? 0 : re;
};

const fitSize = (num: number) => num * scale;

const openUrl = (url: string) => {
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        console.log(`Can't handle url: ${url}`);
      } else {
        Linking.openURL(url);
      }
    })
    .catch(err => console.error('An error occurred', err));
};

const numberToFixedString = (data: number) => (data > 9 ? `${data}` : `0${data}`);

const secondToUnitString = (second: number) => {
  if (second < 0) {
    return '未知';
  }
  if (second < 60) {
    return `${Math.floor(second)}s`;
  }
  if (second < 3600) {
    return `${Math.floor(second / 60)}m ${Math.floor(second % 60)}s`;
  }
  const h = Math.floor(second / 3600);
  const m = Math.floor((second % 3600) / 60);
  return `${h}h ${m}m`;
};

const secondToString = (second: number) => {
  if (second < 60) {
    return `00:${numberToFixedString(Math.floor(second))}`;
  }
  if (second < 3600) {
    return `${numberToFixedString(Math.floor(second / 60))}:${numberToFixedString(Math.floor(second % 60))}`;
  }
  const h = Math.floor(second / 3600);
  const m = Math.floor((second % 3600) / 60);
  const s = Math.floor((second % 3600) % 60);
  return `${numberToFixedString(h)}:${numberToFixedString(m)}:${numberToFixedString(s)}`;
};

const toReadableSize = (size, placeholder = '-') => {
  if (readAbleSizeReg.test(size)) return size;
  if (isNaN(size) || size < 0) return placeholder;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  let value = Number(size);
  while (value >= 1000 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return Number(value.toFixed(2)) + units[i];
};

const showToast = (msg: string) => {
  NativeToast.hide();
  setTimeout(() => {
    NativeToast.show(msg);
  });
};

const isTorrent = (fileName: string) => {
  if (fileName.startsWith('.')) {
    return false;
  }
  const dotPosition = fileName.lastIndexOf('.');
  const fileType = dotPosition > -1 ? fileName.substring(fileName.lastIndexOf('.')) : '';
  return fileType === '.torrent';
};

const confirmWritePermission = async () => {
  try {
    const hasGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (hasGranted) {
      return true;
    }
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
  } catch (err) {
    console.log(err);
  }
  return false;
};

const confirmAllPermission = async () => {
  const permissionStrings = ['存储', '电话'];
  const requetPermissions = [PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE];
  const needRequestPermissions = [];
  const needPermissionStrings = [];
  for (let i = 0, len = requetPermissions.length; i < len; i += 1) {
    const hasGranted = await PermissionsAndroid.check(requetPermissions[i]);
    if (!hasGranted) {
      needRequestPermissions.push(requetPermissions[i]);
      needPermissionStrings.push(permissionStrings[i]);
    }
  }
  try {
    const grantedObj = await PermissionsAndroid.requestMultiple(needRequestPermissions);
    const returnPermissionStrings = [];
    // console.log('---p1---', grantedObj);
    needRequestPermissions.forEach((permission: string, i: number) => {
      if (grantedObj[permission] !== PermissionsAndroid.RESULTS.GRANTED) {
        returnPermissionStrings.push(needPermissionStrings[i]);
      }
    });

    return returnPermissionStrings;
  } catch (err) {
    console.log(err);
  }
  return permissionStrings;
};

const calculateFileSize = async (dirpath: string) => {
  let currentSize = 0;
  try {
    const dirItems: ReadDirItem[] = await NativeHelper.readDir(dirpath);

    for (let i = 0, len = dirItems.length; i < len; i += 1) {
      const dirItem: ReadDirItem = dirItems[i];
      if (dirItem.isFile) {
        currentSize += Number(dirItem.size);
      } else {
        currentSize += await calculateFileSize(dirItem.path);
      }
    }
  } catch (error) {
    console.log('calculateFileSize error');
  }
  return currentSize;
};

const getUsedStorage = async () => {
  let usedStorage = 0;
  const allPaths: string[] = await storageService.getAllDownloadPaths();
  try {
    for (let i = 0, len = allPaths.length; i < len; i += 1) {
      usedStorage += await calculateFileSize(allPaths[i]);
    }
  } catch (error) {
    console.log('getUsedStorage', error);
  }
  return usedStorage;
};

const toPercentString = num => {
  if (isNaN(num) || num > 1 || num < 0) {
    return '0%';
  }
  return `${(num * 100).toFixed(2) * 100 / 100}%`;
};

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const compareVersion = (curVer, newVer) => {
  const curArr = curVer.split('.');
  const newArr = newVer.split('.');
  const length = Math.max(curArr.length, newArr.length);
  for (let i = 0; i < length; i += 1) {
    const newNum = _convertNumber(newArr[i]);
    const curNum = _convertNumber(curArr[i]);
    if (newNum === curNum) {
      continue;
    } else {
      return newNum > curNum;
    }
  }
  return false;
};

const uuid = () => {
  const s = [];
  const hexDigits = '0123456789abcdef';
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-';

  return s.join('');
};

const infoHashToMagnet = infoHash => (infoHash ? `magnet:?xt=urn:btih:${infoHash.toUpperCase()}` : '');

export {
  fitSize,
  openUrl,
  numberToFixedString,
  secondToUnitString,
  secondToString,
  toReadableSize,
  showToast,
  isTorrent,
  confirmWritePermission,
  confirmAllPermission,
  calculateFileSize,
  getUsedStorage,
  toPercentString,
  sleep,
  compareVersion,
  uuid,
  infoHashToMagnet,
};
