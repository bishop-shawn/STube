import { NativeModules, Dimensions } from 'react-native';

const { RNDeviceInfo } = NativeModules;

export default {
  getNotchHeight() {
    return RNDeviceInfo.notchHeight;
  },
  getUniqueID() {
    return RNDeviceInfo.uniqueId;
  },
  getInstanceID() {
    return RNDeviceInfo.instanceId;
  },
  getSerialNumber() {
    return RNDeviceInfo.serialNumber;
  },
  getIPAddress() {
    return RNDeviceInfo.getIpAddress();
  },
  getMACAddress() {
    return RNDeviceInfo.getMacAddress();
  },
  getDeviceId() {
    return RNDeviceInfo.deviceId;
  },
  getManufacturer() {
    return RNDeviceInfo.systemManufacturer;
  },
  getModel() {
    return RNDeviceInfo.model;
  },
  getBrand() {
    return RNDeviceInfo.brand;
  },
  getSystemName() {
    return RNDeviceInfo.systemName;
  },
  getSystemVersion() {
    return RNDeviceInfo.systemVersion;
  },
  getAPILevel() {
    return RNDeviceInfo.apiLevel;
  },
  getBundleId() {
    return RNDeviceInfo.bundleId;
  },
  getApplicationName() {
    return RNDeviceInfo.appName;
  },
  getBuildNumber() {
    return RNDeviceInfo.buildNumber;
  },
  getVersion() {
    return RNDeviceInfo.appVersion;
  },
  getReadableVersion() {
    return `${RNDeviceInfo.appVersion}.${RNDeviceInfo.buildNumber}`;
  },
  getDeviceName() {
    return RNDeviceInfo.deviceName;
  },
  getUserAgent() {
    return RNDeviceInfo.userAgent;
  },
  getDeviceLocale() {
    return RNDeviceInfo.deviceLocale;
  },
  getDeviceCountry() {
    return RNDeviceInfo.deviceCountry;
  },
  getTimezone() {
    return RNDeviceInfo.timezone;
  },
  getFontScale() {
    return RNDeviceInfo.fontScale;
  },
  isEmulator() {
    return RNDeviceInfo.isEmulator;
  },
  isTablet() {
    return RNDeviceInfo.isTablet;
  },
  is24Hour() {
    return RNDeviceInfo.is24Hour;
  },
  isPinOrFingerprintSet() {
    return RNDeviceInfo.isPinOrFingerprintSet;
  },
  getFirstInstallTime() {
    return RNDeviceInfo.firstInstallTime;
  },
  getInstallReferrer() {
    return RNDeviceInfo.installReferrer;
  },
  getLastUpdateTime() {
    return RNDeviceInfo.lastUpdateTime;
  },
  getPhoneNumber() {
    return RNDeviceInfo.phoneNumber;
  },
  getCarrier() {
    return RNDeviceInfo.carrier;
  },
  getTotalMemory() {
    return RNDeviceInfo.totalMemory;
  },
  getMaxMemory() {
    return RNDeviceInfo.maxMemory;
  },
  getTotalDiskCapacity() {
    return RNDeviceInfo.totalDiskCapacity;
  },
  async getFreeDiskStorage() {
    try {
      const value = await RNDeviceInfo.getFreeDiskStorage();
      return value;
    } catch (error) {
      console.log('getFreeDiskStorage error: ', error);
    }
    return -1;
  },
  getBatteryLevel() {
    return RNDeviceInfo.getBatteryLevel();
  },
  isBatteryCharging() {
    return RNDeviceInfo.isBatteryCharging();
  },
  isLandscape() {
    const { height, width } = Dimensions.get('window');
    return width >= height;
  },
  isAirPlaneMode() {
    return RNDeviceInfo.isAirPlaneMode();
  },
  getDeviceType() {
    return RNDeviceInfo.deviceType;
  },
  getNavigationBarHeight() {
    return RNDeviceInfo.navigationBarHeight;
  },
  isShowNavigationBar() {
    return RNDeviceInfo.showNavigationBar;
  },
};
