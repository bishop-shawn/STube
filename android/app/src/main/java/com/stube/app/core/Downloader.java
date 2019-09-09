package com.stube.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Environment;
import android.util.Log;

import com.xunlei.download.DownloadManager;

import java.io.File;

public class Downloader {
    public static final String TAG = Downloader.class.getSimpleName();
    public static final String PATH_DOWNLOADLIB_DB_FILE = "downloads.db";

    public static DownloadManager initDownloadSDK(Context appContext, String path) {
        DownloadManager mDownloadManager;
        if (Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState())) {
            File dbDir = new File(path);
            boolean exists = true;
            if (!dbDir.exists() || !dbDir.isDirectory()) {
                exists = dbDir.mkdirs();
            }
            if (!exists) {
                Log.e(TAG, "DownloadSDK: Can not make database directory: " + path);
            }

            File dbFile = new File(dbDir, PATH_DOWNLOADLIB_DB_FILE);
            String dbPath = dbFile.getAbsolutePath();
            SharedPreferences preferences = appContext.getSharedPreferences("DownloadManager", 0);
            preferences.edit().putString("db_path", dbPath).apply();
            Log.i(TAG, "DownloadSDK: set db_path = " + dbPath);

            mDownloadManager = DownloadManager.getInstanceFor(appContext, null, dbFile);
            Log.i(TAG, "DownloadSDK: init sdk with db path " + PATH_DOWNLOADLIB_DB_FILE);
        } else {
            mDownloadManager = DownloadManager.getInstanceFor(appContext);
            Log.i(TAG, "DownloadSDK: init sdk with db path null");
        }
        return mDownloadManager;
    }
}
