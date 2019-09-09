package com.stube.app.toast;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ToastModule extends ReactContextBaseJavaModule {

    public ToastModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "NativeToast";
    }

    @ReactMethod
    public void show(String message) {
        CustomToast.show(getCurrentActivity(), message);
    }

    @ReactMethod
    public void hide() {
        CustomToast.hide();
    }
}
