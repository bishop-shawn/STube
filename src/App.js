// @flow
import React, { Component } from 'react';
import { NetInfo } from 'react-native';
import { createAppContainer, createBottomTabNavigator, createStackNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import PermissionSettingPopUp from './components/permissionSettingPopUp';
import TabIcon from './components/tabIcon';
import { CONNECTION_STATUS, ROUTE_NAMES, STYLE_CONSTANT, TASK_STATUS } from './constant';
import AddNewLink from './pages/addTaskLink';
import AppQRCode from './pages/appQRCode';
import Download from './pages/download';
import DownloadRecords from './pages/downloadRecords';
import DownloadSetting from './pages/downloadSetting';
import Home from './pages/homeWebview';
import Mine from './pages/mine';
import Popularize from './pages/popularize';
import PopularizeHistory from './pages/popularizeHistory';
import ScanBTFile from './pages/scanBTFile';
import Search from './pages/search';
import StackSearch from './pages/search/stackPage';
import Start from './pages/start';
import DownloadingPlayer from './pages/downloadingPlayer';
import WatchRecords from './pages/watchRecords';
import WebEntry from './pages/webEntry';
import Setting from './pages/setting';
import VodPlayer from './pages/vodPlayer';
import CommonAction from './redux/actions/common';
import store from './redux/store';
import DownloadSDK from './sdk/downloadSDK';
import navigationService from './service/navigationService';
import { confirmAllPermission, fitSize, showToast } from './util/baseUtil';
import initUtil from './util/initUtil';
import notification from './util/notification';
import reporter, { DataMap, REPORT_KEYS } from './util/reporter';
import transition from './util/transitions';

global.showAllTasks = false;

const handleConnectivityChange = async connectionInfo => {
  const { type } = connectionInfo;
  store.dispatch(CommonAction.updateConnectionStatus(type));
  global.connectionInfo = type;

  // when switching from wifi to cellular, there will be a transition state of 'none'
  setTimeout(async () => {
    const info = await NetInfo.getConnectionInfo();
    if (info.type === CONNECTION_STATUS.unknown || info.type === CONNECTION_STATUS.none) {
      showToast('无网络连接');
    }
  }, 3000);
};
NetInfo.addEventListener('connectionChange', handleConnectivityChange);

const MainPages = [
  {
    name: ROUTE_NAMES.home,
    screen: Home,
    iconFocused: { uri: 'mipmap/tab_home_light' },
    iconNotFocused: { uri: 'mipmap/tab_home_dark' },
    title: '首页',
  },
  {
    name: ROUTE_NAMES.search,
    screen: Search,
    iconFocused: { uri: 'mipmap/tab_search_light' },
    iconNotFocused: { uri: 'mipmap/tab_search_dark' },
    title: '搜索',
  },
  {
    name: ROUTE_NAMES.download,
    screen: Download,
    iconFocused: { uri: 'mipmap/tab_download_light' },
    iconNotFocused: { uri: 'mipmap/tab_download_dark' },
    title: '下载',
  },
  {
    name: ROUTE_NAMES.mine,
    screen: Mine,
    iconFocused: { uri: 'mipmap/tab_mine_light' },
    iconNotFocused: { uri: 'mipmap/tab_mine_dark' },
    title: '我的',
  },
];
const MainPageRouteConfigs = {};

MainPages.forEach(page => {
  MainPageRouteConfigs[page.name] = {
    screen: createStackNavigator({ [page.name]: page.screen }),
    navigationOptions: {
      // eslint-disable-next-line react/display-name
      tabBarIcon: obj => {
        const { focused } = obj;
        return <TabIcon image={focused ? page.iconFocused : page.iconNotFocused} showBadge={page.name === ROUTE_NAMES.download && !focused} />;
      },
      title: page.title,
      tabBarOnPress: ({ navigation, defaultHandler }) => {
        const { state } = navigation;
        const route = state.routes[state.index];
        if (route.params && route.params.onPress) {
          route.params.onPress();
        }
        if (!navigation.isFocused()) {
          let details = '';
          switch (state.routeName) {
            case ROUTE_NAMES.search:
              details = '搜索';
              break;
            case ROUTE_NAMES.download:
              details = '下载';
              break;
            case ROUTE_NAMES.mine:
              details = '我的';
              break;
            default:
              details = '首页';
          }
          reporter.access({
            [REPORT_KEYS.from]: DataMap.from_bottom_tab,
            [REPORT_KEYS.details]: details,
          });
        }
        defaultHandler();
      },
    },
  };
});

const MainPageNavigatorConfig = {
  initialRouteName: ROUTE_NAMES.home,
  order: MainPages.map(page => page.name),
  tabBarOptions: {
    style: { borderTopWidth: 0.7, backgroundColor: STYLE_CONSTANT.appBottomColor, borderTopColor: STYLE_CONSTANT.themeColor, height: fitSize(54) },
    labelStyle: { fontSize: fitSize(11) },
    activeTintColor: STYLE_CONSTANT.appBottomTextActiveColor,
    inactiveTintColor: STYLE_CONSTANT.appBottomTextColor,
  },
};

const Main = createBottomTabNavigator(MainPageRouteConfigs, MainPageNavigatorConfig);

const TransitionConfiguration = () => ({
  // Define scene interpolation, eq. custom transition
  screenInterpolator: sceneProps => {
    const { position, scene } = sceneProps;
    const { index, route } = scene;
    const params = route.params || {};
    return transition(params.transition)(index, position);
  },
});

const AppNavigator = createStackNavigator(
  {
    [ROUTE_NAMES.main]: {
      screen: Main,
      navigationOptions: {
        header: null,
      },
    },
    [ROUTE_NAMES.start]: Start,
    [ROUTE_NAMES.watchRecords]: WatchRecords,
    [ROUTE_NAMES.addNewLink]: AddNewLink,
    [ROUTE_NAMES.scanBTFile]: ScanBTFile,
    [ROUTE_NAMES.downloadingPlayer]: DownloadingPlayer,
    [ROUTE_NAMES.downloadRecords]: DownloadRecords,
    [ROUTE_NAMES.downloadSetting]: DownloadSetting,
    [ROUTE_NAMES.popularize]: Popularize,
    [ROUTE_NAMES.appQRCode]: AppQRCode,
    [ROUTE_NAMES.webEntry]: WebEntry,
    [ROUTE_NAMES.popularizeHistory]: PopularizeHistory,
    [ROUTE_NAMES.stackSearch]: StackSearch,
    [ROUTE_NAMES.setting]: Setting,
    [ROUTE_NAMES.vodPlayer]: VodPlayer,
  },
  {
    initialRouteName: ROUTE_NAMES.start,
    defaultNavigationOptions: {
      header: null,
    },
    transitionConfig: TransitionConfiguration,
  },
);

const stopTasks = () => {
  // pause all tasks before exit
  const { tasks } = store.getState().Download;
  const ids = [];
  tasks.forEach(task => {
    if (task.status === TASK_STATUS.RUNNING) {
      ids.push(task.id);
    }
  });
  if (ids.length > 0) {
    DownloadSDK.pauseTasks(ids);
  }
  return 0;
};

const App = createAppContainer(AppNavigator);

export default class MainApp extends Component {
  async componentDidMount() {
    console.log('MainApp componentDidMount');
    const permissionStrings = await confirmAllPermission();
    if (permissionStrings.length > 0) {
      PermissionSettingPopUp.show(permissionStrings);
      return;
    }
    initUtil.initApp();
  }

  componentWillUnmount() {
    notification.cancel();
    // required, Make sure that tasks will not run slient.
    stopTasks();
    console.log('MainApp componentWillUnmount');
  }

  render() {
    return (
      <Provider store={store}>
        <App
          ref={navigatorRef => {
            navigationService.setTopLevelNavigator(navigatorRef);
          }}
        />
      </Provider>
    );
  }
}
