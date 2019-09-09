import { AsyncStorage } from 'react-native';
import fs from 'react-native-fs';

// use catchPath get ETag
// use tmpPath chche file
// copy file to downloadPath while tmpPath/filename download completed

const cachePath = `${fs.CachesDirectoryPath}/chche`;
const fileNames = {};
const dirKey = 'currentDirKey';
// switch path every time
const dirA = `${fs.CachesDirectoryPath}/a`;
const dirB = `${fs.CachesDirectoryPath}/b`;
const storage = {};

const saveValue = async (key, value) => {
  storage[key] = value;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Error saving data
  }
};

const getValue = async (key, defaultValue = null) => {
  if (storage[key]) {
    return storage[key];
  }
  try {
    storage[key] = JSON.parse(await AsyncStorage.getItem(key)) || defaultValue;
    return storage[key];
  } catch (error) {
    return defaultValue;
  }
};

export const getDir = async key => {
  const pathMap = await getValue(dirKey, {});
  return pathMap[key] || dirA;
};

export const getNewDir = async key => {
  const pathMap = await getValue(dirKey, {});
  return pathMap[key] === dirB ? dirA : dirB;
};

export const getDirSync = key => (storage[dirKey] || {})[key] || dirA;

export const clearETag = async key => {
  saveValue(key, null);
};

const changeDir = async key => {
  const pathMap = await getValue(dirKey, {});
  pathMap[key] = await getNewDir(key);
  saveValue(dirKey, pathMap);
};

const hasCache = async (url, key) => {
  const ETag = await getValue(key);
  if (ETag) {
    return new Promise(resolve => {
      fs.downloadFile({
        fromUrl: url,
        toFile: cachePath + fileNames[key],
        begin: res => {
          fs.stopDownload(res.jobId);
          resolve(res.headers.ETag === ETag);
        },
      }).promise.catch(() => {
        resolve(true);
      });
    });
  }
  return false;
};

const download = async (url, key, name) => {
  fileNames[key] = name;
  const filePath = (await getDir(key)) + fileNames[key];
  const fileNewPath = (await getNewDir(key)) + fileNames[key];
  if (!url) {
    console.log('downloadFileService url is empty');
    // if url is empty, use default assets.
    fs.copyFileAssets(name, fileNewPath);
    clearETag(key, null);
    changeDir(key);
    return null;
  }
  if ((await hasCache(url, key)) && (await fs.exists(filePath))) {
    console.log('downloadFileService has cache:', filePath);
    return filePath;
  }
  try {
    let cacheETag;
    const response = await fs.downloadFile({
      fromUrl: url,
      toFile: fileNewPath,
      begin: res => {
        // catch ETag
        cacheETag = res.headers.ETag;
        console.log('downloadFileService begin: ETag', cacheETag);
      },
    }).promise;
    if (response.statusCode !== 200 && response.statusCode !== 304) {
      console.log('downloadFileService  error: statusCode', response);
    } else {
      console.log('downloadFileService  end:', fileNewPath);
      // store ETag
      saveValue(key, cacheETag);
      changeDir(key);
      // use tmp path
      return fileNewPath;
    }
  } catch (e) {
    console.log('downloadFileService  error.', e);
  }
  return null;
};

export default {
  download,
};
