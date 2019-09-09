package com.stube.app.helper;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.oineve.ypoe.Common;
import com.stube.app.R;
import com.stube.app.BuildConfig;

import java.io.File;
import java.security.DigestException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;

public class HelperModule extends ReactContextBaseJavaModule {

    ReactApplicationContext reactContext;

    /* constructor */
    public HelperModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        /**
         * return the string name of the NativeModule which represents this class in
         * JavaScript In JS access this module through React.NativeModules.OpenSettings
         */
        return "NativeHelper";
    }

    @ReactMethod
    public void openNetworkSettings(Callback cb) {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null) {
            cb.invoke(false);
            return;
        }
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent();
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (Build.VERSION.SDK_INT >= 9) {
                intent.setAction("android.settings.APPLICATION_DETAILS_SETTINGS");
                intent.setData(Uri.fromParts("package", context.getPackageName(), null));
            } else if (Build.VERSION.SDK_INT <= 8) {
                intent.setAction(Intent.ACTION_VIEW);
                intent.setClassName("com.android.settings", "com.android.setting.InstalledAppDetails");
                intent.putExtra("com.android.settings.ApplicationPkgName", context.getPackageName());
            }
            context.startActivity(intent);
            cb.invoke(true);
        } catch (Exception e) {
            cb.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void hideApp() {
        Intent i = new Intent(Intent.ACTION_MAIN);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        i.addCategory(Intent.CATEGORY_HOME);
        this.reactContext.startActivity(i);
    }

    @ReactMethod
    public void getSignature(String str, Promise promise) {
        try {
            promise.resolve(Common.getSignature(str));
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(new DigestException("get signatrue failed"));
        }
    }

    @ReactMethod
    public void checkNoticficationPermission(Promise promise) {
        NotificationManagerCompat notification = NotificationManagerCompat.from(this.reactContext);
        boolean isEnabled = notification.areNotificationsEnabled();
        promise.resolve(isEnabled);
    }

    @Override
    public @Nullable
    Map<String, Object> getConstants() {
        HashMap<String, Object> constants = new HashMap<String, Object>();
        try {
            // app name
            constants.put("home_title", Config.getString("home_title"));
            // home ad config
            constants.put("launch_ad_image", Config.getString("launch_ad_image"));
            constants.put("launch_ad_link", Config.getString("launch_ad_link"));
            // ad video config
            constants.put("ad_video_url", Config.getString("ad_video_url"));
            constants.put("ad_video_link", Config.getString("ad_video_link"));
            // home webview config
            constants.put("home_urls", Config.getStringArray("home_urls"));
            // colors
            constants.put("color_theme", Config.getString("color_theme"));
            constants.put("color_header", Config.getString("color_header"));
            constants.put("color_header_text", Config.getString("color_header_text"));
            constants.put("color_bottom", Config.getString("color_bottom"));
            constants.put("color_bottom_text", Config.getString("color_bottom_text"));
            constants.put("color_bottom_text_active", Config.getString("color_bottom_text_active"));
            constants.put("market", BuildConfig.MARKET);
        } catch (Exception e) {
            Log.i("HelperModule", "app config parse error.");
            e.printStackTrace();
        }
        Resources res = this.reactContext.getResources();
        constants.put("app_name", res.getString(R.string.app_name));
        // app data root path
        String sdcard = Environment.getExternalStorageDirectory().getPath();
        String path = sdcard + "/" + this.reactContext.getPackageName();
        constants.put("data_path", path);
        return constants;
    }

    @ReactMethod
    public void inBlackList(String url, Promise promise) {
        promise.resolve(BlackList.containBlackWord(url));
    }

    @ReactMethod
    public void installApk(String path) {
        File file = new File(path);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Uri uri = FileProvider.getUriForFile(reactContext,
                    reactContext.getApplicationInfo().packageName + ".provider", file);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
        } else {
            intent.setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive");
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void getDownloadPath(Promise promise) {
        promise.resolve(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath());
    }

    @ReactMethod
    public void readDir(String directory, Promise promise) {
        try {
            File file = new File(directory);

            if (!file.exists())
                throw new Exception("Folder does not exist");

            File[] files = file.listFiles();

            WritableArray fileMaps = Arguments.createArray();

            for (File childFile : files) {
                WritableMap fileMap = Arguments.createMap();

                fileMap.putDouble("mtime", (double) childFile.lastModified() / 1000);
                fileMap.putString("name", childFile.getName());
                fileMap.putString("path", childFile.getAbsolutePath());
                fileMap.putDouble("size", new Long(childFile.length()).doubleValue());
                fileMap.putInt("type", childFile.isDirectory() ? 1 : 0);
                fileMap.putBoolean("isFile", !childFile.isDirectory());
                fileMaps.pushMap(fileMap);
            }
            promise.resolve(fileMaps);
        } catch (Exception ex) {
            ex.printStackTrace();
            promise.reject("readDir", ex);
        }
    }
}
