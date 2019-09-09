package com.stube.app.core;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import com.dht.vod.VodSDK;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.stube.app.helper.Config;
import com.stube.app.proxy.ProxyServer;
import com.xunlei.download.DownloadManager;
import com.xunlei.download.DownloadManager.DownloadManagerException;
import com.xunlei.download.DownloadManager.Request;
import com.xunlei.download.Downloads;
import com.xunlei.download.TorrentParser;
import com.xunlei.download.TorrentParser.ParseResult;
import com.xunlei.downloadlib.parameter.TorrentFileInfo;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;

public class DownloaderModule extends ReactContextBaseJavaModule {

    private static final String TAG = DownloaderModule.class.getSimpleName();
    private static final String XL_ORIGIN = "STube_Android";
    private ReactApplicationContext reactContext;
    private Context mContext;
    private DownloadManager mDownloadManager;
    private File mDownloadFolder;
    private File mTorrentInfoFolder;
    private ContentResolver mResolver;

    public DownloaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        mContext = reactContext.getApplicationContext();
    }

    private boolean isFileExist(String filePath) {
        if (filePath == null || filePath == "") {
            return false;
        }
        File file = new File(filePath);
        return file.exists();
    }

    private boolean isInited() {
        return mDownloadManager != null && mDownloadManager.isDownloadlibSDKInit();
    }

    @Override
    public String getName() {
        return "Downloader";
    }

    @ReactMethod
    public synchronized void init(String path, Promise promise) {
        if (mDownloadManager == null) {
            mDownloadManager = Downloader.initDownloadSDK(mContext, path);
            mDownloadManager.setProperty(DownloadManager.Property.PROP_PRODUCT_ID, "0");
        }
        if (mResolver == null) {
            mResolver = mContext.getContentResolver();
        }
        if (mDownloadFolder == null) {
            // read download dir from config
            String downloadPath = Config.getString("local_storage");
            if (downloadPath == null || downloadPath.length() == 0) {
                downloadPath = "STubeDownload";
            }
            String storagePath = PreferencesUtil.getDownloadStorage(mContext);
            mDownloadFolder = new File(storagePath, downloadPath);
            if (!mDownloadFolder.exists()) {
                mDownloadFolder.mkdirs();
            }
        }
        if (mTorrentInfoFolder == null) {
            String sdcard = Environment.getExternalStorageDirectory().getPath();
            String torrentInfoPath = sdcard + "/" + this.reactContext.getPackageName() + "/torrentInfo/";
            mTorrentInfoFolder = new File(torrentInfoPath);
            if (!mTorrentInfoFolder.exists()) {
                mTorrentInfoFolder.mkdirs();
            }
        }
        promise.resolve(mDownloadFolder.getAbsolutePath());
    }

    @ReactMethod
    public void isInited(Promise promise) {
        boolean re = isInited();
        promise.resolve(re);
    }

    @ReactMethod
    public void initProxy(Promise promise) {
        boolean re = mDownloadManager.setProxy(ProxyServer.HOSTNAME, ProxyServer.PORT);
        Log.i(TAG, "init setProxy: " + re);
        promise.resolve(re);
    }

    @ReactMethod
    public void parseTorrent(String filePath, Promise promise) {
        TorrentParserListener listener = new TorrentParserListener(promise);
        TorrentParser parser = new TorrentParser(mContext, listener);
        try {
            parser.parse(new File(filePath));
        } catch (IllegalArgumentException e) {
            promise.reject("1010", "parse torrent file failed");
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void createTask(String url, boolean hidden, boolean delay, String fileName, Promise promise) {
        if (!isInited()) {
            Log.w(TAG, "createTask: DownloadSDK is not initialized");
            promise.reject("1001", "DownloadSDK is not initialized");
            return;
        }
        Request request = new Request(Uri.parse(url));
        if (fileName != null) {
            request.setTitle(fileName);
        }
        request.setAllowedOverRoaming(true);
        request.setAllowedNetworkTypes(Request.NETWORK_WIFI | Request.NETWORK_MOBILE);
        request.setAllowedAutoResume(false);
        request.setNotificationVisibility(Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationUri(mDownloadFolder.getAbsolutePath(), "");
        request.setDownloadSpdy(true);
        request.setVisibleInDownloadsUi(!hidden);
        request.setDownloadTaskXLOrigin(XL_ORIGIN);
        request.setDownloadDelay(delay);
        request.allowScanningByMediaScanner();
        request.setCustomFlags(1l);
        long id = mDownloadManager.enqueue(request);

        if (id != -1) {
            promise.resolve(id + "");
        } else {
            promise.reject("1002", "create download task failed");
        }
    }

    @ReactMethod
    public void createBtTask(String url, String infoHash, ReadableArray selectSet, boolean hidden, boolean delay,
                             Promise promise) {
        if (!isInited()) {
            Log.w(TAG, "createBtTask: DownloadSDK is not initialized");
            promise.reject("1001", "DownloadSDK is not initialized");
            return;
        }
        Request request = new Request(Uri.parse(url));
        request.setAllowedOverRoaming(true);
        request.setAllowedNetworkTypes(Request.NETWORK_WIFI | Request.NETWORK_MOBILE);
        request.setAllowedAutoResume(false);
        request.setNotificationVisibility(Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationUri(mDownloadFolder.getAbsolutePath(), null);
        request.setDownloadSpdy(true);
        int size = selectSet.size();
        long[] set = new long[size];
        for (int i = 0; i < size; i++) {
            set[i] = (int) selectSet.getInt(i);
        }
        request.setBtSelectSet(set);
        request.setBtInfoHash(infoHash);
        request.setVisibleInDownloadsUi(!hidden);
        request.setNotificationVisibility(Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDownloadTaskXLOrigin(XL_ORIGIN);
        request.setDownloadDelay(delay);
        request.allowScanningByMediaScanner();
        request.setCustomFlags(1l);
        long id = mDownloadManager.enqueue(request);

        if (id != -1) {
            promise.resolve(id + "");
        } else {
            promise.reject("1003", "create bt task failed");
        }
    }

    @ReactMethod
    public void getTasks(Promise promise) {
        WritableNativeArray tasks = new WritableNativeArray();
        if (!isInited()) {
            Log.w(TAG, "getTasks: DownloadSDK is not initialized");
            promise.resolve(tasks);
            return;
        }
        int flags = DownloadManager.STATUS_SUCCESSFUL | DownloadManager.STATUS_FAILED | DownloadManager.STATUS_PAUSED
                | DownloadManager.STATUS_RUNNING | DownloadManager.STATUS_PENDING;

        String[] projection = {"_id", "uri", "_data", "status", "title", "task_type", "total_bytes", "download_speed", "download_duration",
                "current_bytes", "is_dcdn_speedup", "is_visible_in_downloads_ui", "etag", "bt_select_set"};
        DownloadManager.Query query = new DownloadManager.Query();
//        query.setProjection(projection);
        query.setFilterByStatus(flags);
        query.orderBy(DownloadManager.COLUMN_ID, DownloadManager.Query.ORDER_DESCENDING);
        Cursor cursor = null;
        try {
//            cursor = mDownloadManager.query(query);
            cursor = mResolver.query(mDownloadManager.getDownloadUri(), projection, query.getSelection(), query.getSelectionArgs(), query.getSortOrder());
            if (cursor != null && cursor.getCount() > 0) {
                while (cursor.moveToNext()) {
                    WritableNativeMap map = new WritableNativeMap();
                    String[] names = cursor.getColumnNames();
                    for (int i = 0; i < names.length; i++) {
                        String key = names[i];
                        String value = cursor.getString(i);
                        if (key.equals(Downloads.Impl._DATA)) {
                            String isExist = isFileExist(value) ? "1" : "0";
                            map.putString("file_exist", isExist);
                        }
                        map.putString(key, value);
                    }
                    tasks.pushMap(map);
                }
            }
        } catch (Exception e) {
            Log.i(TAG, e.toString());
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
        promise.resolve(tasks);
    }

    @ReactMethod
    public void addBtSubTasks(String taskId, ReadableArray indexes, Promise promise) {
        int result = 0;
        int length = indexes.size();
        long[] idxes = new long[length];
        for (int i = 0; i < length; i++) {
            idxes[i] = indexes.getInt(i);
        }
        try {
            result = mDownloadManager.selectBtSubTask(Long.parseLong(taskId), idxes);
        } catch (Exception e) {
            Log.i(TAG, e.toString());
        }
        promise.resolve(result);
    }

    @ReactMethod
    public void getBtSubTasks(String taskId, Promise promise) {
        WritableNativeArray tasks = new WritableNativeArray();

        String[] columns = {"_id", "status", "title", "bt_sub_index", "_data", "total_bytes", "current_bytes", "download_speed"};
        String selection = "bt_parent_id = ?";
        String[] selectionArgs = {taskId};

        Cursor cursor = null;
        try {
            cursor = mResolver.query(mDownloadManager.getBtSubTaskUri(), columns, selection, selectionArgs, null);
            if (cursor.getCount() > 0) {
                while (cursor.moveToNext()) {
                    WritableNativeMap map = new WritableNativeMap();
                    String[] names = cursor.getColumnNames();
                    for (int i = 0; i < names.length; i++) {
                        String key = names[i];
                        String value = cursor.getString(i);
                        if (key.equals(Downloads.Impl._DATA)) {
                            String isExist = isFileExist(value) ? "1" : "0";
                            map.putString("file_exist", isExist);
                        }
                        map.putString(key, value);
                    }
                    tasks.pushMap(map);
                }
            }
        } catch (Exception e) {
            Log.i(TAG, e.toString());
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
        promise.resolve(tasks);
    }

    @ReactMethod
    public void renameTask(String taskId, String newName, Promise promise) {
        ContentValues values = new ContentValues();
        values.put(Downloads.Impl.COLUMN_TITLE, newName);
        String whereClause = Downloads.Impl._ID + " = ? ";
        String[] whereArgs = {taskId};
        int count = 0;
        try {
            count = mResolver.update(mDownloadManager.getDownloadUri(Long.parseLong(taskId)), values, whereClause, whereArgs);
        } catch (Exception e) {
            e.printStackTrace();
        }
        promise.resolve(count);
    }

    @ReactMethod
    public void deleteTasks(ReadableArray taskIds, boolean isForce, Promise promise) {
        int length = taskIds.size();
        long[] ids = new long[length];
        for (int i = 0; i < length; i++) {
            ids[i] = Long.parseLong(taskIds.getString(i));
        }
        int count = mDownloadManager.remove(!isForce, ids);
        promise.resolve(count);
    }

    @ReactMethod
    public void pauseTasks(ReadableArray taskIds, Promise promise) {
        int length = taskIds.size();
        long[] ids = new long[length];
        for (int i = 0; i < length; i++) {
            ids[i] = Long.parseLong(taskIds.getString(i));
        }
        int count = mDownloadManager.pauseDownload(ids);
        promise.resolve(count);
    }

    @ReactMethod
    public void resumeTasks(ReadableArray taskIds, Promise promise) {
        int length = taskIds.size();
        long[] ids = new long[length];
        for (int i = 0; i < length; i++) {
            ids[i] = Long.parseLong(taskIds.getString(i));
        }
        int count = mDownloadManager.resumeDownload(ids);
        promise.resolve(count);
    }

    @ReactMethod
    public void restartTasks(ReadableArray taskIds, boolean force, Promise promise) {
        int length = taskIds.size();
        long[] ids = new long[length];
        for (int i = 0; i < length; i++) {
            ids[i] = Long.parseLong(taskIds.getString(i));
        }
        int count = mDownloadManager.restartDownload(force, ids);
        promise.resolve(count);
    }

    @ReactMethod
    public void speedUpTask(String taskId, String info, Promise promise) {
        mDownloadManager.confirmCheck(Long.parseLong(taskId), info);
        promise.resolve(true);
    }

    /**
     * @param path file path
     */
    @ReactMethod
    public void getPlayUrl(String path, Promise promise) {
        String url = null;
        try {
            url = mDownloadManager.getPlayUrl(path);
        } catch (DownloadManagerException e) {
            promise.reject(e.getFinalStatus() + "");
        }
        promise.resolve(url);
    }

    /**
     * @param taskId
     * @param index  BT subTask index, not BT, index == -1.
     */
    @ReactMethod
    public void setPlayTask(String taskId, String index, Promise promise) {
        int result = mDownloadManager.setPlayTask(Long.parseLong(taskId), Long.parseLong(index));
        promise.resolve(result);
    }

    @ReactMethod
    public void setSpeedLimit(int maxDownlaodSpeedInKB, int maxUploadSpeedInKB, Promise promise) {
        long mds = maxDownlaodSpeedInKB;
        long mus = maxUploadSpeedInKB;
        boolean result = mDownloadManager.setSpeedLimit(mds, mus);
        promise.resolve(result);
    }

    @ReactMethod
    public void setMaxDownloadLimit(int num, Promise promise) {
        int result = mDownloadManager.setRecommandMaxConcurrentDownloads(num);
        promise.resolve(result);
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        String id = mDownloadManager.getPeerId();
        promise.resolve(id);
    }

    @ReactMethod
    public void setHideTaskVisible(String taskId) {
        mDownloadManager.setHideTaskVisible(Long.parseLong(taskId));
    }

    @ReactMethod
    public void saveTorrentInfo(String infoHash, String torrentInfo, Promise promise) {
        String path = mTorrentInfoFolder.getAbsolutePath() + "/" + infoHash.toUpperCase() + ".json";
        File file = new File(path);
        if (file.exists()) {
            promise.resolve(true);
            return;
        }
        try {
            FileOutputStream outputStream = new FileOutputStream(file);
            outputStream.write(torrentInfo.getBytes());
            outputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void getTorrentInfo(String infoHash, Promise promise) {
        String path = mTorrentInfoFolder.getAbsolutePath() + "/" + infoHash.toUpperCase() + ".json";
        File file = new File(path);
        if (!file.exists()) {
            promise.resolve(null);
            return;
        }
        StringBuffer sb = new StringBuffer();
        try {
            BufferedReader bufferedReader = new BufferedReader(new FileReader(file));
            String readLine;
            while ((readLine = bufferedReader.readLine()) != null) {
                sb.append(readLine);
            }
            bufferedReader.close();
            promise.resolve(sb.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void deleteTorrentInfo(ReadableArray infoHashes) {
        int length = infoHashes.size();
        String path;
        for (int i = 0; i < length; i++) {
            path = mTorrentInfoFolder.getAbsolutePath() + "/" + infoHashes.getString(i).toUpperCase() + ".json";
            File file = new File(path);
            if (file.exists()) {
                file.delete();
            }
        }
    }

    @ReactMethod
    public void initDHT(Promise promise) {
//        VodSDK.setLogEnable(1);
        int re = VodSDK.init();
        Log.i(TAG, "init dht: " + re);
        promise.resolve(re);
    }

    public class TorrentParserListener implements TorrentParser.OnTorrentParserListener {

        private Promise promise;

        public TorrentParserListener(Promise promise) {
            this.promise = promise;
        }

        @Override
        public void onTorrentParseBegin() {

        }

        @Override
        public void onTorrentParseCompleted(ParseResult result) {
            if (result.code == ParseResult.Code.NO_ERROR) {
                WritableNativeMap info = new WritableNativeMap();
                info.putString("baseFolder", result.torrentInfo.mMultiFileBaseFolder);
                info.putString("infoHash", result.torrentInfo.mInfoHash);
                info.putInt("fileCount", result.torrentInfo.mFileCount);
                info.putBoolean("multiFile", result.torrentInfo.mIsMultiFiles);
                long totalSize = 0l;
                WritableNativeArray fileInfos = new WritableNativeArray();
                for (int i = 0; i < result.torrentInfo.mSubFileInfo.length; i++) {
                    TorrentFileInfo fileInfo = result.torrentInfo.mSubFileInfo[i];
                    WritableNativeMap item = new WritableNativeMap();
                    item.putString("name", fileInfo.mFileName);
                    item.putString("size", Long.toString(fileInfo.mFileSize));
                    item.putInt("index", fileInfo.mFileIndex);
                    totalSize += fileInfo.mFileSize;
                    fileInfos.pushMap(item);
                }
                info.putString("totalSize", Long.toString(totalSize));
                info.putArray("files", fileInfos);
                promise.resolve(info);
            } else {
                promise.reject(result.code.toString(), "Parse torrent failed!");
            }
        }
    }
}
