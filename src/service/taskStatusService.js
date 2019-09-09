import { AppState, DeviceEventEmitter } from 'react-native';
import { TASK_STATUS, ROUTE_NAMES, TASK_TYPE } from '../constant';
import reporter, { REPORT_KEYS } from '../util/reporter';
import notification from '../util/notification';
import { toReadableSize } from '../util/baseUtil';
import { getCategory } from '../util/taskUtil';
import navigationService from './navigationService';

const taskCountNotifyId = '65530';
const tasks = [];
// Record whether the task list is initialized and filter the first request
let inited = false;

const onTaskCreate = () => {
  // console.log('task created!');
};

const onTaskCompleted = task => {
  reporter.complete({
    [REPORT_KEYS.url]: task.url,
    [REPORT_KEYS.speed]: (task.fileSize / task.duration) * 1000,
  });
  if (task.type === TASK_TYPE.MAGNET && AppState.currentState === 'active') {
    DeviceEventEmitter.emit('TORRENT_DOWNLOADED', {
      path: task.path,
      callback: () => {
        navigationService.navigate(ROUTE_NAMES.download);
      },
    });
  } else {
    notification.message({
      id: `${task.id}`,
      title: `下载完成:${task.name}`,
      message: '立即查看',
      task,
    });
  }
};

const onTaskFailed = task => {
  notification.error({
    id: `${task.id}`,
    title: `下载失败:${task.name}`,
    message: '立即查看',
  });
};

const onTasks = updateTasks => {
  let size = 0;
  let progress = 0;
  let speed = 0;
  let runningCount = 0;
  updateTasks.forEach(task => {
    if (task.visible && task.status === TASK_STATUS.RUNNING) {
      size += task.fileSize;
      progress += task.currentBytes;
      speed += task.speed;
      runningCount += 1;
    }
  });
  if (runningCount === 0) {
    notification.cancel(taskCountNotifyId);
  } else {
    notification.message({
      id: taskCountNotifyId,
      progress: Math.floor((progress / size) * 1000),
      title: `${runningCount}个任务下载中`,
      message: `总速度：${toReadableSize(speed)}/s`,
      playSound: false,
      vibrate: false,
      ongoing: true,
      autoCancel: false,
      importance: 'low',
    });
  }
};

const compareStatus = (newTask, oldTask) => {
  if (oldTask.status !== newTask.status) {
    switch (newTask.status) {
      case TASK_STATUS.SUCCESS:
        onTaskCompleted(newTask);
        break;
      case TASK_STATUS.FAILED:
        onTaskFailed(newTask);
        break;
      default:
    }
  } else if (oldTask.progress < 0.01 && newTask.progress >= 0.01 && (getCategory(newTask.name) === 'video' || newTask.type === TASK_TYPE.BT)) {
    // Playable prompt (prompt once when download progress is 1% or greater)
    notification.message({
      id: `${newTask.id}`,
      title: `${newTask.name}`,
      message: '1个任务可以边下边播',
      rightButton: true,
      buttonTitle: '边下边播',
      largeIcon: 'video_icon',
      play: true,
      routeName: ROUTE_NAMES.downloadingPlayer,
      task: newTask,
    });
  }
};

const addTask = task => {
  // only handle visible task
  if (task.visible) {
    const oldTaskIndex = tasks.findIndex(item => item.id === task.id);
    const oldTask = tasks[oldTaskIndex];
    if (oldTask) {
      compareStatus(task, oldTask);
      tasks[oldTaskIndex] = task;
      return;
    }
    if (inited) {
      onTaskCreate(task);
    }
    tasks.push(task);
  }
};

export default {
  addTasks: updateTasks => {
    onTasks(updateTasks);
    updateTasks.forEach(task => addTask(task));
    inited = true;
  },
};
