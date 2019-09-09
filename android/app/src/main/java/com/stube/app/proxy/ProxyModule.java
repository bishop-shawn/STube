package com.stube.app.proxy;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableNativeMap;
import com.oineve.ypoe.ProxyClient;
import com.oineve.ypoe.ProxyClient.HttpRequestParams;

public class ProxyModule extends ReactContextBaseJavaModule {
    private static String TAG = "ProxyModule";
    private ProxyClient client;
    private boolean clientInited = false;

    public ProxyModule(ReactApplicationContext reactContext) {
        super(reactContext);
        client = ProxySingleton.getInstance();
        String persistPath = reactContext.getFilesDir().getAbsolutePath() + "/persist.data";
        if (0 != client.init(true, new HandleLog(), persistPath)) {
            Log.i(TAG, "init failed !!!");
            return;
        }
        clientInited = true;
    }

    @Override
    public String getName() {
        return "RNProxy";
    }

    @ReactMethod
    public void request(String targetId, String method, String path, String header, String body, int timeout, boolean isConcurrent, Promise promise) {
        if (!clientInited) {
            Log.w(TAG, "proxy request, client is not initial yet");
            promise.reject("100", "client is not initial yet");
            return;
        }

        HttpRequestParams param = new HttpRequestParams();
        param.interfaceId = 0;
        param.targetId = targetId;
        param.method = method;
        param.version = "1.1";
        param.path = path;
        param.header = header;
        param.body = body != null ? body.getBytes() : null;

        Log.i(TAG, "---proxy send---\ntargetId: " + targetId + "\nmethod: " + method + "\npath: " + path + "\nheader: " + header + "\nbody: " + body + "\ntimeout: " + timeout);
        client.sendHttpRequest(param, timeout, isConcurrent, new HandleResponse(path, promise));
    }

    private enum LogLevel {
        DEBUG,
        WARN,
        ERROR
    }

    class HandleLog implements ProxyClient.LogHandler {

        @Override
        public void logCallback(int level, String content) { // level: 0 DEBUG 1 WARN 2 ERROR
            Log.w(TAG, "[internal " + LogLevel.values()[level].name() + "] " + content);
        }
    }

    class HandleResponse implements ProxyClient.ResponseHandler {

        private Promise promise;
        private String path;

        public HandleResponse(String path, Promise promise) {
            this.path = path;
            this.promise = promise;
        }

        @Override
        public void responseCallback(ProxyClient.HttpResponseData response) {
            Log.i(TAG, "---proxy response-1-\npath: " + path + "\ncode: " + response.code + "\ndesc: " + response.desc);

            if (response.code == 0) {
                String body = new String(response.body);
                Log.i(TAG, "---proxy response-2-\nstatusCode: " + response.statusCode + "\nheader: " + response.header + "\nbody: " + body);
                WritableNativeMap result = new WritableNativeMap();
                result.putString("statusCode", response.statusCode);
                result.putString("body", body);
                promise.resolve(result);
            } else {
                String code = String.valueOf(100 + response.code);
                promise.reject(code, response.desc);
            }
        }
    }
}
