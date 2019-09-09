// @flow
import { AsyncStorage } from 'react-native';

const KEY = {
  MAX_DOWNLOADING_TASKS: 'max_downloading_tasks',
  FIRST_USE_APP: 'first_use_app',
  INVITED: 'invited',
  CURRENT_DOWNLOAD_PATH: 'current_download_path',
  ALL_DOWNLOAD_PATH: 'all_download_path',
  SHOW_GUIDE: 'show_guide',
  SHOW_ALL_TASKS: 'show_all_tasks',
  LAST_CLIPBOARD: 'last_clipboard',
};

const _updateAllDownloadPath = async (newPath: string) => {
  try {
    const currentAllPathStr = await AsyncStorage.getItem(KEY.ALL_DOWNLOAD_PATH);
    let currentAllPath = [];
    if (currentAllPathStr) {
      currentAllPath = currentAllPathStr.split('\n');
    }
    if (currentAllPath.indexOf(newPath) < 0) {
      currentAllPath.push(newPath);
    }
    await AsyncStorage.setItem(KEY.ALL_DOWNLOAD_PATH, currentAllPath.join('\n'));
  } catch (error) {
    console.error('An error occurred when updateAllDownloadPath', error);
  }
};

export default {
  saveFirstUseApp: async () => {
    try {
      await AsyncStorage.setItem(KEY.FIRST_USE_APP, 'true');
    } catch (error) {
      console.error('An error occurred when saveFirstUseApp', error);
    }
  },

  getFirstUseApp: async () => {
    try {
      const result = await AsyncStorage.getItem(KEY.FIRST_USE_APP);
      return result === null;
    } catch (error) {
      console.error('An error occurred when isFirstUseApp', error);
    }
    return true;
  },

  saveInvited: async () => {
    try {
      await AsyncStorage.setItem(KEY.INVITED, 'true');
    } catch (error) {
      console.error('An error occurred when saveInvited', error);
    }
  },

  getInvited: async () => {
    try {
      const result = await AsyncStorage.getItem(KEY.INVITED);
      return result !== null;
    } catch (error) {
      console.error('An error occurred when getInvited', error);
    }
    return false;
  },

  saveDownloadPath: async (path: string) => {
    try {
      await AsyncStorage.setItem(KEY.CURRENT_DOWNLOAD_PATH, path);
      await _updateAllDownloadPath(path);
    } catch (error) {
      console.error('An error occurred when saveDownloadPath', error);
    }
  },

  getDownloadPath: async () => {
    try {
      return await AsyncStorage.getItem(KEY.CURRENT_DOWNLOAD_PATH);
    } catch (error) {
      console.error('An error occurred when getDownloadPath', error);
    }
    return null;
  },

  getAllDownloadPaths: async () => {
    try {
      const currentAllPathStr = await AsyncStorage.getItem(KEY.ALL_DOWNLOAD_PATH);
      if (currentAllPathStr) {
        return currentAllPathStr.split('\n');
      }
    } catch (error) {
      console.error('An error occurred when getAllDownloadPath', error);
    }
    return [];
  },

  saveMaxDownloadingTasks: async count => {
    try {
      await AsyncStorage.setItem(KEY.MAX_DOWNLOADING_TASKS, `${count}`);
    } catch (error) {
      console.error('An error occurred when saveMaxDownloadingTasks', error);
    }
  },

  getMaxDownloadingTasks: async () => {
    try {
      const result = await AsyncStorage.getItem(KEY.MAX_DOWNLOADING_TASKS);
      return result ? Number(result) : 5;
    } catch (error) {
      console.error('An error occurred when getMaxDownloadingTasks', error);
    }
    return 5;
  },

  saveShowGuide: async () => {
    try {
      await AsyncStorage.setItem(KEY.SHOW_GUIDE, 'true');
    } catch (error) {
      console.error('An error occurred when saveHasShowGuide', error);
    }
  },

  getShowGuide: async () => {
    try {
      const result = await AsyncStorage.getItem(KEY.SHOW_GUIDE);
      return result === 'true';
    } catch (error) {
      console.error('An error occurred when getShowGuide', error);
    }
    return false;
  },

  saveLastClipboard: async (text) => {
    try {
      await AsyncStorage.setItem(KEY.LAST_CLIPBOARD, text);
    } catch (error) {
      console.error('An error occurred when saveHasShowGuide', error);
    }
  },

  getLastClipboard: async () => {
    try {
      const result = await AsyncStorage.getItem(KEY.LAST_CLIPBOARD);
      return result;
    } catch (error) {
      console.error('An error occurred when getShowGuide', error);
    }
    return null;
  },
};
