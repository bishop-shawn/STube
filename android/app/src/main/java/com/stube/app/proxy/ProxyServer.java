package com.stube.app.proxy;

import android.util.Log;

import com.koushikdutta.async.http.Headers;
import com.koushikdutta.async.http.body.AsyncHttpRequestBody;
import com.koushikdutta.async.http.body.OctetStreamBody;
import com.koushikdutta.async.http.server.AsyncHttpServer;
import com.koushikdutta.async.http.server.AsyncHttpServerRequest;
import com.koushikdutta.async.http.server.AsyncHttpServerResponse;
import com.koushikdutta.async.http.server.HttpServerRequestCallback;
import com.oineve.ypoe.ProxyClient;
import com.oineve.ypoe.ProxyClient.HttpRequestParams;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ProxyServer {

    public final static String TAG = ProxyServer.class.getName();
    public final static String HOSTNAME = "127.0.0.3";
    public final static int PORT = 8888;

    private ProxyClient client;

    public ProxyServer() {
        client = ProxySingleton.getInstance();
        AsyncHttpServer server = new AsyncHttpServer();

        server.location(".*", new HttpServerRequestCallback() {
            @Override
            public void onRequest(AsyncHttpServerRequest request, AsyncHttpServerResponse response) {
                String method = request.getMethod();
                String url = request.getUrl();
                Headers headers = request.getHeaders();
                AsyncHttpRequestBody reqBody = request.getBody();
                byte[] body = null;
                if (reqBody instanceof OctetStreamBody) {
                    body = (byte[])reqBody.get();
                    Log.i(TAG, "Content-Type: " + headers.get("Content-Type"));
                } else{
                    Log.e(TAG, "Unsupported Content-Type: " + reqBody.getContentType());
                }

                String targetId = headers.get("Host");
                int separatorIndex = targetId.lastIndexOf(":");
                if (separatorIndex != -1) {
                    targetId = targetId.substring(0, separatorIndex);
                }

                URI uri = URI.create(url);
                String path = uri.getRawPath();
                if (uri.getRawQuery() != null) {

                    path += "?" + uri.getRawQuery();
                }
                request(targetId, method, path, headers.toString(), body, response);
            }
        });

        server.listen(HOSTNAME, PORT);
        Log.i(TAG, "listen to " + HOSTNAME + ":" + PORT);
    }

    private void request(String targetId, String method, String path, String header, byte[] body, AsyncHttpServerResponse response) {

        HttpRequestParams param = new HttpRequestParams();
        param.interfaceId = 0;
        param.targetId = targetId;
        param.method = method;
        param.version = "1.1";
        param.path = path;
        param.header = header;
        param.body = body;

        Log.i(TAG, "===proxy send===\ntargetId: " + targetId + "\nmethod: " + method + "\npath: " + path + "\nheader: " + header);
        client.sendHttpRequest(param, 10, false, new HandleResponse(path, response));
    }

    class HandleResponse implements ProxyClient.ResponseHandler {

        private AsyncHttpServerResponse serverResponse;
        private String path;

        public HandleResponse(String path, AsyncHttpServerResponse serverResponse) {
            this.path = path;
            this.serverResponse = serverResponse;
        }

        @Override
        public void responseCallback(ProxyClient.HttpResponseData response) {
            Log.i(TAG, "===proxy response===\npath: " + path + "\ncode: " + response.code + "\ndesc: " + response.desc + "\nstatusCode: " + response.statusCode + "\nheader: " + response.header);

            if (response.code == 0) {
                serverResponse.code(Integer.parseInt(response.statusCode));
                Pattern p = Pattern.compile("Content-Type:\\s*(.*)\\s", Pattern.CASE_INSENSITIVE);
                Matcher matcher = p.matcher(response.header);
                matcher.find();
                String contentType = matcher.group(1);
                serverResponse.send(contentType, response.body);
            } else {
                serverResponse.code(100 + response.code);
            }
        }
    }

}
