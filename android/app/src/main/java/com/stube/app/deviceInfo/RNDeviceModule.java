package com.stube.app.deviceInfo;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.KeyguardManager;
import android.app.UiModeManager;
import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.text.format.Formatter;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.DisplayCutout;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebSettings;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.lang.reflect.Method;
import java.math.BigInteger;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import javax.annotation.Nullable;

import androidx.annotation.RequiresApi;

public class RNDeviceModule extends ReactContextBaseJavaModule {

    private static final String NAVIGATION = "navigationBarBackground";
    String TAG = "RNDeviceModule";
    ReactApplicationContext reactContext;
    WifiInfo wifiInfo;
    DeviceType deviceType;

    public RNDeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);

        this.reactContext = reactContext;
        this.deviceType = getDeviceType(reactContext);
    }

    private static DeviceType getDeviceType(ReactApplicationContext reactContext) {
        // Detect TVs via ui mode (Android TVs) or system features (Fire TV).
        if (reactContext.getApplicationContext().getPackageManager().hasSystemFeature("amazon.hardware.fire_tv")) {
            return DeviceType.TV;
        }

        UiModeManager uiManager = (UiModeManager) reactContext.getSystemService(Context.UI_MODE_SERVICE);
        if (uiManager != null && uiManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
            return DeviceType.TV;
        }

        // Find the current window manager, if none is found we can't measure the device physical size.
        WindowManager windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
        if (windowManager == null) {
            return DeviceType.UNKNOWN;
        }

        // Get display metrics to see if we can differentiate handsets and tablets.
        // NOTE: for API level 16 the metrics will exclude window decor.
        DisplayMetrics metrics = new DisplayMetrics();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            windowManager.getDefaultDisplay().getRealMetrics(metrics);
        } else {
            windowManager.getDefaultDisplay().getMetrics(metrics);
        }

        // Calculate physical size.
        double widthInches = metrics.widthPixels / (double) metrics.xdpi;
        double heightInches = metrics.heightPixels / (double) metrics.ydpi;
        double diagonalSizeInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

        if (diagonalSizeInches >= 3.0 && diagonalSizeInches <= 6.9) {
            // Devices in a sane range for phones are considered to be Handsets.
            return DeviceType.HANDSET;
        } else if (diagonalSizeInches > 6.9 && diagonalSizeInches <= 18.0) {
            // Devices larger than handset and in a sane range for tablets are tablets.
            return DeviceType.TABLET;
        } else {
            // Otherwise, we don't know what device type we're on/
            return DeviceType.UNKNOWN;
        }
    }

    private static boolean checkShowNavigationBar(Activity activity) {
        if (activity == null) {
            return false;
        }

        ViewGroup vp = (ViewGroup) activity.getWindow().getDecorView();
        if (vp != null) {
            for (int i = 0; i < vp.getChildCount(); i++) {
                vp.getChildAt(i).getContext().getPackageName();
                if (vp.getChildAt(i).getId() != View.NO_ID && NAVIGATION.equals(activity.getResources().getResourceEntryName(vp.getChildAt(i).getId()))) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public String getName() {
        return "RNDeviceInfo";
    }

    private WifiInfo getWifiInfo() {
        if (this.wifiInfo == null) {
            WifiManager manager = (WifiManager) reactContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            this.wifiInfo = manager.getConnectionInfo();
        }
        return this.wifiInfo;
    }

    private String getCurrentLanguage() {
        Locale current;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            current = getReactApplicationContext().getResources().getConfiguration().getLocales().get(0);
        } else {
            current = getReactApplicationContext().getResources().getConfiguration().locale;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            return current.toLanguageTag();
        } else {
            StringBuilder builder = new StringBuilder();
            builder.append(current.getLanguage());
            if (current.getCountry() != null) {
                builder.append("-");
                builder.append(current.getCountry());
            }
            return builder.toString();
        }
    }

    private String getCurrentCountry() {
        Locale current;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            current = getReactApplicationContext().getResources().getConfiguration().getLocales().get(0);
        } else {
            current = getReactApplicationContext().getResources().getConfiguration().locale;
        }

        return current.getCountry();
    }

    private Boolean isEmulator() {
        return Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(Build.PRODUCT);
    }

    private Boolean isTablet() {
        return deviceType == DeviceType.TABLET;
    }

    private float fontScale() {
        return getReactApplicationContext().getResources().getConfiguration().fontScale;
    }

    private Boolean is24Hour() {
        return android.text.format.DateFormat.is24HourFormat(this.reactContext.getApplicationContext());
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    private boolean isHuaweiNotchScreen() {
        boolean isNotchScreen = false;
        try {
            ClassLoader cl = this.reactContext.getClassLoader();
            Class HwNotchSizeUtil = cl.loadClass("com.huawei.android.util.HwNotchSizeUtil");
            Method get = HwNotchSizeUtil.getMethod("hasNotchInScreen");
            isNotchScreen = (boolean) get.invoke(HwNotchSizeUtil);
        } catch (ClassNotFoundException e) {
            Log.i(TAG, "hasNotchInScreen ClassNotFoundException");
        } catch (NoSuchMethodException e) {
            Log.i(TAG, "hasNotchInScreen NoSuchMethodException");
        } catch (Exception e) {
            Log.i(TAG, "hasNotchInScreen Exception");
        } finally {
            return isNotchScreen;
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    private int getHuaweiNotchHeight() {
        int[] ret = new int[]{0, 0};
        try {
            ClassLoader cl = this.reactContext.getClassLoader();
            Class HwNotchSizeUtil = cl.loadClass("com.huawei.android.util.HwNotchSizeUtil");
            Method get = HwNotchSizeUtil.getMethod("getNotchSize");
            ret = (int[]) get.invoke(HwNotchSizeUtil);
        } catch (Exception e) {
            Log.i(TAG, "getHuaweiNotchHeight Exception");
        } finally {
            return ret[1];
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public boolean isXiaomiNotchScreen() {
        boolean ret = false;
        try {
            ClassLoader cl = this.reactContext.getClassLoader();
            Class SystemProperties = cl.loadClass("android.os.SystemProperties");
            Method get = SystemProperties.getMethod("getInt", String.class, int.class);
            ret = (Integer) get.invoke(SystemProperties, "ro.miui.notch", 0) == 1;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            return ret;
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public int getXiaomiNotchHeight() {
        int result = 0;
        int resourceId = this.reactContext.getResources().getIdentifier("notch_height", "dimen", "android");
        if (resourceId > 0) {
            result = this.reactContext.getResources().getDimensionPixelSize(resourceId);
        }
        return result;
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public boolean isOPPONotchScreen() {
        return this.reactContext.getPackageManager().hasSystemFeature("com.oppo.feature.screen.heteromorphism");
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public boolean isVivoNotchScreen() {
        boolean ret = false;
        try {
            ClassLoader classLoader = this.reactContext.getClassLoader();
            Class FtFeature = classLoader.loadClass("android.util.FtFeature");
            Method method = FtFeature.getMethod("isFeatureSupport", int.class);
            ret = (boolean) method.invoke(FtFeature, 0x00000020);
        } catch (ClassNotFoundException e) {
            Log.e("Notch", "hasNotchAtVivo ClassNotFoundException");
        } catch (NoSuchMethodException e) {
            Log.e("Notch", "hasNotchAtVivo NoSuchMethodException");
        } catch (Exception e) {
            Log.e("Notch", "hasNotchAtVivo Exception");
        } finally {
            return ret;
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public int getOPPOVIVONotchHeight() {
        int statusBarHeight = -1;
        int resourceId = this.reactContext.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            statusBarHeight = this.reactContext.getResources().getDimensionPixelSize(resourceId);
        }
        return statusBarHeight;
    }

    private boolean isAndroidPNotchScreen() {
        if (Build.VERSION.SDK_INT < 28) {
            return false;
        }
        Activity activity = getCurrentActivity();
        if (activity == null) {
            return false;
        }
        WindowInsets windowInsets = getCurrentActivity().getWindow().getDecorView().getRootWindowInsets();
        if (windowInsets == null) {
            return false;
        }
        DisplayCutout displayCutout = windowInsets.getDisplayCutout();
        if (displayCutout == null || displayCutout.getBoundingRects() == null) {
            return false;
        }
        return true;
    }

    public int getAndroidPNotchHeight() {
        if (Build.VERSION.SDK_INT < 28) {
            return 0;
        }
        int notchHeight = 0;
        Activity activity = getCurrentActivity();
        if (activity == null) {
            return 0;
        }
        WindowInsets windowInsets = activity.getWindow().getDecorView().getRootWindowInsets();
        if (windowInsets == null) {
            return 0;
        }

        DisplayCutout displayCutout = windowInsets.getDisplayCutout();
        if (displayCutout == null || displayCutout.getBoundingRects() == null) {
            return 0;
        }

        notchHeight = displayCutout.getSafeInsetTop();

        return notchHeight;
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    private void setNotchConstant(HashMap<String, Object> constant) {
        if (this.isHuaweiNotchScreen()) {
            constant.put("hasNotch", true);
            constant.put("notchHeight", this.getHuaweiNotchHeight());
        } else if (this.isOPPONotchScreen() || this.isVivoNotchScreen()) {
            constant.put("hasNotch", true);
            constant.put("notchHeight", this.getOPPOVIVONotchHeight());
        } else if (this.isXiaomiNotchScreen()) {
            constant.put("hasNotch", true);
            constant.put("notchHeight", this.getXiaomiNotchHeight());
        } else if (this.isAndroidPNotchScreen()) {
            constant.put("hasNotch", true);
            constant.put("notchHeight", this.getAndroidPNotchHeight());
        } else {
            constant.put("hasNotch", false);
            constant.put("notchHeight", 0);
        }
    }

    @ReactMethod
    public void isPinOrFingerprintSet(Callback callback) {
        KeyguardManager keyguardManager = (KeyguardManager) this.reactContext.getApplicationContext().getSystemService(Context.KEYGUARD_SERVICE); //api 16+
        callback.invoke(keyguardManager.isKeyguardSecure());
    }

    @ReactMethod
    public void getIpAddress(Promise p) {
        String ipAddress = Formatter.formatIpAddress(getWifiInfo().getIpAddress());
        p.resolve(ipAddress);
    }

    @ReactMethod
    public void getMacAddress(Promise p) {
        String macAddress = getWifiInfo().getMacAddress();

        String permission = "android.permission.INTERNET";
        int res = this.reactContext.checkCallingOrSelfPermission(permission);

        if (res == PackageManager.PERMISSION_GRANTED) {
            try {
                List<NetworkInterface> all = Collections.list(NetworkInterface.getNetworkInterfaces());
                for (NetworkInterface nif : all) {
                    if (!nif.getName().equalsIgnoreCase("wlan0")) continue;

                    byte[] macBytes = nif.getHardwareAddress();
                    if (macBytes == null) {
                        macAddress = "";
                    } else {

                        StringBuilder res1 = new StringBuilder();
                        for (byte b : macBytes) {
                            res1.append(String.format("%02X:", b));
                        }

                        if (res1.length() > 0) {
                            res1.deleteCharAt(res1.length() - 1);
                        }

                        macAddress = res1.toString();
                    }
                }
            } catch (Exception ex) {
            }
        }

        p.resolve(macAddress);
    }

    @ReactMethod
    public String getCarrier() {
        TelephonyManager telMgr = (TelephonyManager) this.reactContext.getSystemService(Context.TELEPHONY_SERVICE);
        return telMgr.getNetworkOperatorName();
    }

    @ReactMethod
    public BigInteger getTotalDiskCapacity() {
        try {
            StatFs root = new StatFs(Environment.getRootDirectory().getAbsolutePath());
            return BigInteger.valueOf(root.getBlockCountLong()).multiply(BigInteger.valueOf(root.getBlockSizeLong()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @ReactMethod
    public void getFreeDiskStorage(Promise promise) {
        try {
            StatFs external = new StatFs(Environment.getExternalStorageDirectory().getAbsolutePath());
            promise.resolve(BigInteger.valueOf(external.getAvailableBlocks()).multiply(BigInteger.valueOf(external.getBlockSize())).doubleValue());
            return;
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(TAG, "getFreeDiskStorage error");
        }
        promise.resolve(-1);
    }

    @ReactMethod
    public void isBatteryCharging(Promise p) {
        IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = this.reactContext.getApplicationContext().registerReceiver(null, ifilter);
        int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING;
        p.resolve(isCharging);
    }

    @ReactMethod
    public void getBatteryLevel(Promise p) {
        Intent batteryIntent = this.reactContext.getApplicationContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        float batteryLevel = level / (float) scale;
        p.resolve(batteryLevel);
    }

    @ReactMethod
    public void isAirPlaneMode(Promise p) {
        boolean isAirPlaneMode;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR1) {
            isAirPlaneMode = Settings.System.getInt(this.reactContext.getContentResolver(), Settings.System.AIRPLANE_MODE_ON, 0) != 0;
        } else {
            isAirPlaneMode = Settings.Global.getInt(this.reactContext.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
        }
        p.resolve(isAirPlaneMode);
    }

    public String getInstallReferrer() {
        SharedPreferences sharedPref = getReactApplicationContext().getSharedPreferences("react-native-device-info", Context.MODE_PRIVATE);
        return sharedPref.getString("installReferrer", null);
    }

    @Override
    public @Nullable
    Map<String, Object> getConstants() {
        HashMap<String, Object> constants = new HashMap<String, Object>();

        PackageManager packageManager = this.reactContext.getPackageManager();
        String packageName = this.reactContext.getPackageName();
        constants.put("appVersion", "not available");
        constants.put("appName", "not available");
        constants.put("buildVersion", "not available");
        constants.put("buildNumber", 0);

        try {
            PackageInfo packageInfo = packageManager.getPackageInfo(packageName, 0);
            PackageInfo info = packageManager.getPackageInfo(packageName, 0);
            String applicationName = this.reactContext.getApplicationInfo().loadLabel(this.reactContext.getPackageManager()).toString();
            constants.put("appVersion", info.versionName);
            constants.put("buildNumber", info.versionCode);
            constants.put("firstInstallTime", info.firstInstallTime);
            constants.put("lastUpdateTime", info.lastUpdateTime);
            constants.put("appName", applicationName);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

        String deviceName = "Unknown";

        String permission = "android.permission.BLUETOOTH";
        int res = this.reactContext.checkCallingOrSelfPermission(permission);
        if (res == PackageManager.PERMISSION_GRANTED) {
            try {
                BluetoothAdapter myDevice = BluetoothAdapter.getDefaultAdapter();
                if (myDevice != null) {
                    deviceName = myDevice.getName();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        int navigationBarHeight = 0;
        Resources rs = this.reactContext.getResources();
        final float scale = rs.getDisplayMetrics().density;
        int id = rs.getIdentifier("navigation_bar_height", "dimen", "android");
        if (id > 0) {
            navigationBarHeight = (int) (rs.getDimensionPixelSize(id) / scale + 0.5f);
        }
        constants.put("navigationBarHeight", navigationBarHeight);
        constants.put("showNavigationBar", checkShowNavigationBar(getCurrentActivity()));
        constants.put("hasNotch", false);
        constants.put("notchHeight", 0);
        if (Build.VERSION.SDK_INT >= 26) {
            this.setNotchConstant(constants);
        }
        constants.put("notchHeight", (int) ((Integer) constants.get("notchHeight") / scale + 0.5f));
        constants.put("serialNumber", Build.SERIAL);
        constants.put("deviceName", deviceName);
        constants.put("systemName", "Android");
        constants.put("systemVersion", Build.VERSION.RELEASE);
        constants.put("model", Build.MODEL);
        constants.put("brand", Build.BRAND);
        constants.put("deviceId", Build.BOARD);
        constants.put("apiLevel", Build.VERSION.SDK_INT);
        constants.put("deviceLocale", this.getCurrentLanguage());
        constants.put("deviceCountry", this.getCurrentCountry());
        constants.put("uniqueId", Settings.Secure.getString(this.reactContext.getContentResolver(), Settings.Secure.ANDROID_ID));
        constants.put("systemManufacturer", Build.MANUFACTURER);
        constants.put("bundleId", packageName);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            try {
                constants.put("userAgent", WebSettings.getDefaultUserAgent(this.reactContext));
            } catch (RuntimeException e) {
                constants.put("userAgent", System.getProperty("http.agent"));
            }
        }
        constants.put("timezone", TimeZone.getDefault().getID());
        constants.put("isEmulator", this.isEmulator());
        constants.put("isTablet", this.isTablet());
        constants.put("fontScale", this.fontScale());
        constants.put("is24Hour", this.is24Hour());
        if (getCurrentActivity() != null &&
                (getCurrentActivity().checkCallingOrSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED ||
                        getCurrentActivity().checkCallingOrSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED ||
                        getCurrentActivity().checkCallingOrSelfPermission("android.permission.READ_PHONE_NUMBERS") == PackageManager.PERMISSION_GRANTED)) {
            TelephonyManager telMgr = (TelephonyManager) this.reactContext.getApplicationContext().getSystemService(Context.TELEPHONY_SERVICE);
            constants.put("phoneNumber", telMgr.getLine1Number());
        }
        constants.put("carrier", this.getCarrier());
        constants.put("totalDiskCapacity", this.getTotalDiskCapacity());
        constants.put("installReferrer", this.getInstallReferrer());

        Runtime rt = Runtime.getRuntime();
        constants.put("maxMemory", rt.maxMemory());
        ActivityManager actMgr = (ActivityManager) this.reactContext.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
        actMgr.getMemoryInfo(memInfo);
        constants.put("totalMemory", memInfo.totalMem);
        constants.put("deviceType", deviceType.getValue());

        Set keys = constants.keySet();
        for (Iterator i = keys.iterator(); i.hasNext(); ) {
            String key = (String) i.next();
            Object value = constants.get(key);
            if (value != null) {
                Log.i(TAG, key + ": " + value.toString());
            } else {
                Log.i(TAG, key + ": null");
            }

        }
        return constants;
    }
}
