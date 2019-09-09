// @flow
import { NativeModules, AsyncStorage } from 'react-native';
import fs from 'react-native-fs';
import request from '../util/request';
import downloadFileService, { getDir, getDirSync, clearETag } from './downloadFileService';

type Config = {
  homeUrls: String[],
  adImageUrl: String,
  adImagelink: String,
  adVideoUrl: String,
  adVideoLink: String,
};

const { NativeHelper } = NativeModules;
const assets = {
  adImageName: 'start.png',
  adVideoName: 'ad.mp4',
  playerAd: 'playerAd.png',
  searchAd: 'searchAd.png',
  mineAd: 'mineAd.png',
};
const keys = {
  video: 'adVideo',
  image: 'adImage',
  playerAd: 'playerAd',
  searchAd: 'searchAd',
  mineAd: 'mineAd',
};
const getImageDownloadPath = async () => (await getDir(keys.image)) + assets.adImageName;
const getVideoDownloadPath = async () => (await getDir(keys.video)) + assets.adVideoName;
const localConfig = {
  homeUrls: NativeHelper.home_urls,
  adImageUrl: NativeHelper.launch_ad_image,
  adImagelink: NativeHelper.launch_ad_link,
  adVideoUrl: NativeHelper.ad_video_url,
  adVideoLink: NativeHelper.ad_video_link,
};

const storageKey = 'configService';
const events = {};
const eventDatas = {};
let config = null;

const setConfig = async (value: Config) => {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    // Error saving data
  }
};

const readConfig = async () => {
  try {
    return JSON.parse(await AsyncStorage.getItem(storageKey));
  } catch (error) {
    return null;
  }
};

const getHomeUrls = urls => {
  const filteredUrls = Array.isArray(urls) ? urls.filter(url => url) : [];
  if (filteredUrls.length > 0) {
    return filteredUrls;
  }
  return localConfig.homeUrls;
};

const requestConfig = async () => {
  try {
    const remoteConfig = await Promise.race([
      request.get('/get/config'),
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('request timeout')), 1500);
      }),
    ]);
    // if remote is empty, use local config
    return {
      homeUrls: getHomeUrls(remoteConfig.home_urls),
      adImageUrl: remoteConfig.launch_ad_image || localConfig.adImageUrl,
      adVideoUrl: remoteConfig.ad_video_url || localConfig.adVideoUrl,
      adImagelink: remoteConfig.launch_ad_link || localConfig.adImagelink,
      adVideoLink: remoteConfig.ad_video_link || localConfig.adVideoLink,
      searchAdUrl: remoteConfig.search_ad_image,
      mineAdUrl: remoteConfig.mine_ad_image,
      playerAdUrl: remoteConfig.player_ad_image,
      searchAdLink: remoteConfig.search_ad_link,
      mineAdLink: remoteConfig.mine_ad_link,
      playerAdLink: remoteConfig.player_ad_link,
    };
  } catch (e) {
    return null;
  }
};

const getBase64 = async path => {
  try {
    const data = await fs.readFile(path, 'base64');
    return `data:image/png;base64,${data}`;
  } catch (e) {
    return null;
  }
};

const dispatchDownloadResult = async (key, path, link) => {
  const base64 = await getBase64(path);
  if (typeof events[key] === 'function') {
    events[key](path, link, base64);
    events[key] = null;
  } else {
    eventDatas[key] = { path, link, base64 };
  }
};

const init = async () => {
  const imageDownloadPath = await getImageDownloadPath();
  const videoDownloadPath = await getVideoDownloadPath();
  config = await readConfig();
  if (!config) {
    // copy default config
    setConfig(localConfig);
    config = localConfig;
  }
  // copy default assets
  if (!(await fs.exists(imageDownloadPath))) {
    // clear storage cache
    clearETag(keys.image);
    fs.copyFileAssets(assets.adImageName, imageDownloadPath);
  }
  if (!(await fs.exists(videoDownloadPath))) {
    clearETag(keys.video);
    fs.copyFileAssets(assets.adVideoName, videoDownloadPath);
  }
  const remoteConfig = await requestConfig();
  if (remoteConfig) {
    setConfig(remoteConfig);
    config = remoteConfig;
  }
  downloadFileService.download(config.adImageUrl, keys.image, assets.adImageName).then(async path => {
    dispatchDownloadResult(keys.image, path, config.adImagelink);
  });
  downloadFileService.download(config.adVideoUrl, keys.video, assets.adVideoName).then(async path => {
    dispatchDownloadResult(keys.video, path, config.adVideoLink);
  });
  downloadFileService.download(config.searchAdUrl, keys.searchAd, assets.searchAd).then(path => {
    dispatchDownloadResult(keys.searchAd, path, config.searchAdLink);
  });
  downloadFileService.download(config.playerAdUrl, keys.playerAd, assets.playerAd).then(path => {
    dispatchDownloadResult(keys.playerAd, path, config.playerAdLink);
  });
  downloadFileService.download(config.mineAdUrl, keys.mineAd, assets.mineAd).then(path => {
    dispatchDownloadResult(keys.mineAd, path, config.mineAdLink);
  });
};

const reset = async () => {
  const imageDownloadPath = await getImageDownloadPath();
  const videoDownloadPath = await getVideoDownloadPath();
  // clear cache
  clearETag(keys.image);
  clearETag(keys.video);
  // copy default assets
  fs.copyFileAssets(assets.adImageName, imageDownloadPath);
  fs.copyFileAssets(assets.adVideoName, videoDownloadPath);
};

export default {
  init,
  reset,
  keys,
  getConfigSync: () => Object.assign({}, config, {
    imagePath: getDirSync(keys.image) + assets.adImageName,
    videoPath: getDirSync(keys.video) + assets.adVideoName,
  }),
  getConfig: async () => {
    const storageCOnfig = await readConfig();
    const imagePath = await getImageDownloadPath();
    const videoPath = await getVideoDownloadPath();
    return Object.assign({}, storageCOnfig, {
      imagePath,
      videoPath,
    });
  },
  once: (key, cb) => {
    if (eventDatas[key]) {
      cb(eventDatas[key].path, eventDatas[key].link, eventDatas[key].base64);
    } else {
      events[key] = cb;
    }
  },
};
