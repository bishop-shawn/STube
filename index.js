import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import notification from './src/util/notification';

notification.init();

global.URL = url => require('url').parse(url);

AppRegistry.registerComponent(appName, () => App);
