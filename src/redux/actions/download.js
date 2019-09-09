// @flow
import ActionType from '../actionType';
import downloadService from '../../service/downloadService';
import DownloadTask from '../../model/downloadTask';
import { showToast } from '../../util/baseUtil';
import DownloadSDK from '../../sdk/downloadSDK';
import { CONNECTION_STATUS, TASK_STATUS } from '../../constant';
import taskStatusService from '../../service/taskStatusService';
import { isMagnet } from '../../util/taskUtil';

const TAG = 'downloadAction Error: ';
let clearSubTaskId = null;
let startFetchTimer = false;
function fetchTasks() {
  return dispatch => {
    dispatch({ type: ActionType.FETCH_ALL_TASKS_ING });
    downloadService
      .fetchAllTasks()
      .then((data: DownloadTask[]) => {
        taskStatusService.addTasks(data);
        dispatch({ type: ActionType.FETCH_ALL_TASKS_DONE, data });
        if (!startFetchTimer) {
          setInterval(() => {
            dispatch(fetchTasks());
          }, 1000);
          startFetchTimer = true;
        }
      })
      .catch(error => {
        console.log(TAG, error);
        dispatch({ type: ActionType.FETCH_ALL_TASKS_ERROR, data: '请求下载列表失败' });
      });
  };
}

function fetchBtSubTasks(taskId: string) {
  clearSubTaskId = null;
  return dispatch => {
    dispatch({ type: ActionType.FETCH_SUBTASK_ING });
    downloadService
      .fetchBtSubTasks(taskId)
      .then(subtasks => {
        if (taskId === clearSubTaskId) {
          return;
        }
        dispatch({ type: ActionType.FETACH_SUBTASK_DNOE, data: subtasks });
      })
      .catch(error => {
        console.log(TAG, error);
        dispatch({ type: ActionType.FETCH_SUBTASK_ERROR, data: '请求子任务失败' });
      });
  };
}

function clearBtSubTasks(taskId: String) {
  clearSubTaskId = taskId;
  return { type: ActionType.CLEAR_SUBTASK };
}

type CreateTaskParam = {
  url: string,
  infoHash: string,
  selectSet: number[],
  hidden: boolean,
  fileName: string,
  speedUp: boolean,
  successCallBack: Function,
};

function createTask({ url, infoHash, selectSet, hidden, fileName, speedUp, successCallBack }: CreateTaskParam) {
  const callSuccess = (taskId: string, repeat: boolean) => {
    if (successCallBack) {
      successCallBack(taskId, repeat);
    }
  };

  return async (dispatch, getState) => {
    let downloadingTask = null;
    const { tasks } = getState().Download;
    if (isMagnet(url)) {
      downloadingTask = tasks.find(task => task.url.indexOf(url) >= 0 || url.indexOf(task.url) >= 0);
    } else {
      downloadingTask = tasks.find(task => task.url === url || (infoHash && task.infoHash === infoHash));
    }
    if (downloadingTask) {
      if (hidden) {
        callSuccess(downloadingTask.id, true);
        return;
      }
      if (downloadingTask.visible) {
        showToast('下载任务已存在');
        return;
      }
      await DownloadSDK.deleteTasks([downloadingTask.id], true);
    }
    const delay = getState().Common.connectionType === CONNECTION_STATUS.cellular;
    downloadService
      .createTask(url, hidden, delay, fileName, speedUp, infoHash, selectSet)
      .then((taskId: string) => {
        if (!hidden) {
          showToast('创建下载成功');
          dispatch(fetchTasks());
        }
        callSuccess(taskId, false);
      })
      .catch(() => {
        if (!hidden) {
          showToast('创建下载失败');
        }
        dispatch({ type: ActionType.CREATE_TASK_ERROR, data: '创建下载失败' });
      });
  };
}

function pauseTasks(taskIds: string[]) {
  return dispatch => {
    downloadService
      .pauseTasks(taskIds)
      .then((success: boolean) => {
        if (success) {
          dispatch(fetchTasks());
        }
      })
      .catch(error => {
        console.log(TAG, error);
      });
  };
}

function resumeTasks(taskIds: string[]) {
  return (dispatch, getState) => {
    const { connectionType } = getState().Common;
    if (connectionType === CONNECTION_STATUS.unknown || connectionType === CONNECTION_STATUS.none) {
      showToast('无网络连接');
      return;
    }
    downloadService
      .resumeTasks(taskIds)
      .then((success: boolean) => {
        if (success) {
          dispatch(fetchTasks());
        }
      })
      .catch(error => {
        console.log(TAG, error);
      });
  };
}

function restartTasks(taskIds: string[]) {
  return (dispatch, getState) => {
    const { connectionType } = getState().Common;
    if (connectionType === CONNECTION_STATUS.unknown || connectionType === CONNECTION_STATUS.none) {
      showToast('无网络连接');
      return;
    }
    downloadService
      .restartTasks(taskIds)
      .then((success: boolean) => {
        if (success) {
          dispatch(fetchTasks());
        }
      })
      .catch(error => {
        console.log(TAG, error);
      });
  };
}

function deleteTasks(taskIds: string[], deleteFile: boolean) {
  return (dispatch, getState) => {
    let deleteFileTaskIds = [];
    let notDeleteFileTaskIds = [];
    if (deleteFile) {
      deleteFileTaskIds = taskIds;
    } else {
      const tasks = getState().Download.tasks.filter(task => taskIds.indexOf(task.id) >= 0);
      notDeleteFileTaskIds = tasks.filter((task: DownloadTask) => task.status === TASK_STATUS.SUCCESS).map(task => task.id);
      deleteFileTaskIds = taskIds.filter(taskId => notDeleteFileTaskIds.indexOf(taskId) === -1);
    }
    downloadService
      .deleteTasks(deleteFileTaskIds, notDeleteFileTaskIds)
      .then((success: boolean) => {
        if (success) {
          dispatch(fetchTasks());
        }
      })
      .catch(error => {
        console.log(TAG, error);
      });
  };
}

export default {
  fetchTasks,
  createTask,
  pauseTasks,
  resumeTasks,
  restartTasks,
  deleteTasks,
  fetchBtSubTasks,
  clearBtSubTasks,
};
