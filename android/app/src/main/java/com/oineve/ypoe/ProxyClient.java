package com.oineve.ypoe;

public class ProxyClient {
    static {
        System.loadLibrary("nettle");
        System.loadLibrary("hogweed");
        System.loadLibrary("gmp");
        System.loadLibrary("gnutls");
        System.loadLibrary("proxyclient");
    }

    static public class HttpRequestParams {
        public int interfaceId;
        public String targetId;
        public String path;
        public String version;
        public String method;
        public String header;
        public byte[] body;
    }

    static public class HttpResponseData {
        // code : 1:param serialized failed; 2:no hosts for service;
        // 3:handle http request time out;4:send to remote failed; 5:parse response
        // failed
        public int code;
        public String desc;
        public String statusCode;
        public String header;
        public byte[] body;
    }

    public interface ResponseHandler {
        void responseCallback(HttpResponseData response);
    }

    public interface LogHandler {
        void logCallback(int level, String content);
    }

    public native int init(boolean isEnableLog, LogHandler logHandler, String persistFile);

    public native int sendHttpRequest(HttpRequestParams param, int timeout, boolean isConcurrent,
                                      ResponseHandler handler);
}
