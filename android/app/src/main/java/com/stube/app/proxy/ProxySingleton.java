package com.stube.app.proxy;

import com.oineve.ypoe.ProxyClient;

public class ProxySingleton {
    private static ProxyClient instance;

    private ProxySingleton() {

    }

    public static synchronized ProxyClient getInstance() {
        if (instance == null) {
            instance = new ProxyClient();
        }
        return instance;
    }
}
