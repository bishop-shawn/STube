package com.stube.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Environment;

public class PreferencesUtil {

    public static final String EXTRA_SPEED_UP = "extra_speed_up";
    public static final String EXTRA_STORAGE = "extra_storage";
    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_SYNCHRO_LXTASK2SERVER = "extra_synchro_lxtask2server";
    public static final String DEFAULT_STORAGE = Environment
            .getExternalStorageDirectory().getPath();
    public static final String DEFAULT_URL_NAME = "download_url.txt";
    private static final String PREF_NAME = "config_xunlei_sdk";
    private static final int MODE_MULTI_PROCESS = 0x0004;

    private static SharedPreferences getPreferences(Context context) {
        SharedPreferences body = context.getSharedPreferences(PREF_NAME,
                Context.MODE_PRIVATE);
        return body;
    }

    public static void setXunleiSpeedUp(Context context, boolean spdy) {
        SharedPreferences pref = getPreferences(context);
        pref.edit().putBoolean(EXTRA_SPEED_UP, spdy).commit();
    }

    public static boolean isXunleiSpeedUp(Context context) {
        SharedPreferences pref = getPreferences(context);
        return pref.getBoolean(EXTRA_SPEED_UP, true);
    }


    public static void setSynchroLXTask2Server(Context context, boolean sync) {
        SharedPreferences pref = getPreferences(context);
        pref.edit().putBoolean(EXTRA_SYNCHRO_LXTASK2SERVER, sync).commit();
    }

    public static boolean isSynchroLXTask2Server(Context context) {
        SharedPreferences pref = getPreferences(context);
        return pref.getBoolean(EXTRA_SYNCHRO_LXTASK2SERVER, true);
    }

    public static void setDownloadStorage(Context context, String storage) {
        SharedPreferences pref = getPreferences(context);
        pref.edit().putString(EXTRA_STORAGE, storage).commit();
    }

    public static String getDownloadStorage(Context context) {
        SharedPreferences pref = getPreferences(context);
        return pref.getString(EXTRA_STORAGE, DEFAULT_STORAGE);
    }

    public static void setDownloadUrl(Context context, String name) {
        SharedPreferences pref = getPreferences(context);
        pref.edit().putString(EXTRA_URL, name).commit();
    }

    public static String getDownloadUrl(Context context) {
        SharedPreferences pref = getPreferences(context);
        return pref.getString(EXTRA_URL, DEFAULT_URL_NAME);
    }
}
