package com.stube.app.helper;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.ArrayList;

public class BlackList {

    public static ArrayList<String> blackList = new ArrayList<String>();
    public static String[] urls = {};

    public static void init(Context reactContext, String[] _urls) {
        urls = _urls;
        init(reactContext);
    }

    public static void init(Context reactContext) {
        try {
            AssetManager assetManager = reactContext.getAssets();
            BufferedReader bf = new BufferedReader(new InputStreamReader(assetManager.open("blacklist.txt")));
            String line;
            while ((line = bf.readLine()) != null) {
                blackList.add(line.toLowerCase());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static boolean shouldCheckUrl(String url) {
        if (url.length() > 1024) {
            return false;
        }
        if (urls.length == 0) {
            return true;
        }
        for (String word : urls) {
            if (url.indexOf(word) == 0) {
                return true;
            }
        }
        return false;
    }

    public static boolean containBlackWord(String url) {
        if (url == null) return false;
        try {
            url = URLDecoder.decode(url, "utf-8");
        } catch (UnsupportedEncodingException e) {
        }
        url = url.toLowerCase();

        if (shouldCheckUrl(url)) {
            Log.i("blacklist check url: ", url);
            for (String word : blackList) {
                Log.i("blacklist word: ", word);
                if (url.indexOf(word) != -1) {
                    return true;
                }
            }
        }
        return false;
    }
}
