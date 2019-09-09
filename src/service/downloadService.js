// @flow
import DownloadSDK from '../sdk/downloadSDK';
import { convertTask, convertBtSubTask } from '../util/taskUtil';
import { showToast } from '../util/baseUtil';
import safeRequest from '../util/safeRequest';
import { DataError } from '../util/errors';

async function speedUpTask(url: string, taskId: string) {
  const info = '{}';
  const reqObj = JSON.parse(info);
  reqObj.url = url;
  const req = JSON.stringify(reqObj);
  let res = null;
  try {
    res = await safeRequest.post('/task/precommit', req, false);
  } catch (e) {
    if (e instanceof DataError) {
      showToast('预请求失败');
    }
    console.log('precommit failed:', e);
    return;
  }
  console.log('speedUpTask', JSON.stringify(res.if_acc));
  if (res.if_acc !== 0) {
    DownloadSDK.speedUpTask(taskId, info);
  }
}

const DownloadService = {
  fetchAllTasks: async () => {
    const originTasks = await DownloadSDK.getTasks();
    return originTasks.map(convertTask);
  },

  fetchBtSubTasks: async (taskId: string) => {
    let originTasks;
    try {
      originTasks = await DownloadSDK.getBtSubTasks(taskId);
    } catch (error) {
      throw error;
    }
    return originTasks.map(convertBtSubTask).sort((subTask1, subTask2) => subTask1.index - subTask2.index);
  },


  createTask: async (url: string, hidden: boolean = false, delay: boolean = true, fileName: string, speedUp: boolean = true, infoHash = null, selectSet = []) => {
    try {
      let taskId = '';
      if (infoHash) {
        taskId = await DownloadSDK.createBtTask(url, infoHash, selectSet, hidden, delay);
      } else {
        taskId = await DownloadSDK.createTask(url, hidden, delay, fileName);
      }
      if (speedUp) {
        speedUpTask(url, taskId);
      }
      return taskId;
    } catch (error) {
      throw error;
    }
  },

  pauseTasks: async (taskIds: string[]) => {
    try {
      const successCount = await DownloadSDK.pauseTasks(taskIds);
      return successCount === taskIds.length;
    } catch (error) {
      throw error;
    }
  },

  resumeTasks: async (taskIds: string[]) => {
    try {
      const successCount = await DownloadSDK.resumeTasks(taskIds);
      return successCount === taskIds.length;
    } catch (error) {
      throw error;
    }
  },

  restartTasks: async (taskIds: string[]) => {
    try {
      const successCount = await DownloadSDK.restartTasks(taskIds, true);
      return successCount === taskIds.length;
    } catch (error) {
      throw error;
    }
  },

  deleteTasks: async (deleteFileTaskIds: string[], notDeleteFileTaskIds: string[]) => {
    try {
      let successCount = 0;
      if (deleteFileTaskIds.length > 0) {
        successCount += await DownloadSDK.deleteTasks(deleteFileTaskIds, true);
      }
      if (notDeleteFileTaskIds.length > 0) {
        successCount += await DownloadSDK.deleteTasks(notDeleteFileTaskIds, false);
      }
      return successCount === deleteFileTaskIds.length + notDeleteFileTaskIds.length;
    } catch (error) {
      throw error;
    }
  },
};

export default DownloadService;
