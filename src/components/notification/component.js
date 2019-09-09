// @flow
const { NativeModules, DeviceEventEmitter } = require('react-native');

const { RNPushNotification } = NativeModules;
const _notifHandlers = new Map();

const DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
const NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';
const REMOTE_FETCH_EVENT = 'remoteFetch';
const NOTIF_RECEIVED = 'notificationActionReceived';

const NotificationsComponent = function () {

};

NotificationsComponent.prototype.getInitialNotification = function () {
  return RNPushNotification.getInitialNotification()
    .then((notification) => {
      if (notification && notification.dataJSON) {
        return JSON.parse(notification.dataJSON);
      }
      return null;
    });
};

NotificationsComponent.prototype.requestPermissions = function (senderID: string) {
  RNPushNotification.requestPermissions(senderID);
};

NotificationsComponent.prototype.subscribeToTopic = function (topic: string) {
  RNPushNotification.subscribeToTopic(topic);
};

NotificationsComponent.prototype.cancelLocalNotifications = function (details: Object) {
  RNPushNotification.cancelLocalNotifications(details);
};

NotificationsComponent.prototype.clearLocalNotification = function (details: Object) {
  RNPushNotification.clearLocalNotification(details);
};

NotificationsComponent.prototype.cancelAllLocalNotifications = function () {
  RNPushNotification.cancelAllLocalNotifications();
};

NotificationsComponent.prototype.presentLocalNotification = function (details: Object) {
  if (!RNPushNotification.presentLocalNotification) return;
  RNPushNotification.presentLocalNotification(details);
};

NotificationsComponent.prototype.scheduleLocalNotification = function (details: Object) {
  RNPushNotification.scheduleLocalNotification(details);
};

NotificationsComponent.prototype.setApplicationIconBadgeNumber = function (number: number) {
  if (!RNPushNotification.setApplicationIconBadgeNumber) {
    return;
  }
  RNPushNotification.setApplicationIconBadgeNumber(number);
};

NotificationsComponent.prototype.abandonPermissions = function () {
  /* Void */
};

NotificationsComponent.prototype.checkPermissions = function (callback: Function) {
  RNPushNotification.checkPermissions().then(alert => callback({ alert }));
};

NotificationsComponent.prototype.addEventListener = function (type: string, handler: Function) {
  let listener;
  if (type === 'notification') {
    listener = DeviceEventEmitter.addListener(
      DEVICE_NOTIF_EVENT,
      (notifData) => {
        const data = JSON.parse(notifData.dataJSON);
        handler(data);
      },
    );
  } else if (type === 'cancel') {
    listener = DeviceEventEmitter.addListener(
      NOTIF_RECEIVED,
      (notifData) => {
        const data = JSON.parse(notifData.dataJSON);
        handler(data);
      },
    );
  } else if (type === 'register') {
    listener = DeviceEventEmitter.addListener(
      NOTIF_REGISTER_EVENT,
      (registrationInfo) => {
        handler(registrationInfo.deviceToken);
      },
    );
  } else if (type === 'remoteFetch') {
    listener = DeviceEventEmitter.addListener(
      REMOTE_FETCH_EVENT,
      (notifData) => {
        const notificationData = JSON.parse(notifData.dataJSON);
        handler(notificationData);
      },
    );
  }

  _notifHandlers.set(type, listener);
};

NotificationsComponent.prototype.removeEventListener = function (type: string, handler: Function) {
  const listener = _notifHandlers.get(type);
  if (!listener) {
    return;
  }
  listener.remove();
  _notifHandlers.delete(type);
};

NotificationsComponent.prototype.registerNotificationActions = function (details: Object) {
  RNPushNotification.registerNotificationActions(details);
};

NotificationsComponent.prototype.clearAllNotifications = function () {
  RNPushNotification.clearAllNotifications();
};

module.exports = {
  state: false,
  component: new NotificationsComponent(),
};
