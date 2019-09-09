import { AppState } from 'react-native';
import BackgroundJob from 'react-native-background-job';
import store from '../redux/store';
import downloadActions from '../redux/actions/download';
import { DEVICE_INFO } from '../constant';

const jobs = {
  fetchTasks: 'fetchTasks',
};

const fetchTasksJob = {
  jobKey: jobs.fetchTasks,
  job: () => {
    if (DEVICE_INFO.ID && AppState.currentState !== 'active') {
      store.dispatch(downloadActions.fetchTasks());
      console.log('background task: Fetch tasks in background!');
    }
  },
};

BackgroundJob.register(fetchTasksJob);

const fetchTasksSchedule = {
  jobKey: jobs.fetchTasks,
  period: 3000,
  exact: true,
  allowWhileIdle: true,
  // requiresDeviceIdle: true,
  allowExecutionInForeground: true,
  notificationText: '下载状态更新中',
  notificationTitle: '下载状态更新',
};

export default {
  run: () => {
    store.dispatch(downloadActions.fetchTasks());
    BackgroundJob.schedule(fetchTasksSchedule);
  },
  destroy: () => {
    BackgroundJob.cancel({ jobKey: jobs.fetchTasks });
  },
};
