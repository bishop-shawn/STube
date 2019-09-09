package com.stube.app.helper;

import android.content.Context;
import android.content.res.AssetManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class Config {
    public static JSONObject json;

    public static void init(Context reactContext) {
        if (json == null) {
            try {
                AssetManager assetManager = reactContext.getAssets();
                // BufferedRead
                BufferedReader bf = new BufferedReader(new InputStreamReader(assetManager.open("config.json")));
                String jsonString = "";
                String line;
                while ((line = bf.readLine()) != null) {
                    jsonString += line;
                }
                json = new JSONObject(jsonString);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static String getString(String name) {
        if (json != null) {
            try {
                return json.getString(name);
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        }
        return null;
    }

    public static List getStringArray(String name) {
        if (json != null) {
            try {
                List stringList = new ArrayList();
                JSONArray arrayJson = (JSONArray) json.get(name);
                if (arrayJson != null || arrayJson.length() != 0) {
                    for (int i = 0; i < arrayJson.length(); i++) {
                        stringList.add(arrayJson.getString(i));
                    }
                }
                return stringList;
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        }
        return null;
    }

}
