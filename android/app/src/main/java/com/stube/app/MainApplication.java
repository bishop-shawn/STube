package com.stube.app;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.github.yamill.orientation.OrientationPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.ninty.system.setting.SystemSettingPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.pilloxa.backgroundjob.BackgroundJobPackage;
import com.rnfs.RNFSPackage;
import com.stube.app.core.DownloaderPackage;
import com.stube.app.deviceInfo.RNDeviceInfo;
import com.stube.app.helper.BlackList;
import com.stube.app.helper.Config;
import com.stube.app.helper.HelperPackage;
import com.stube.app.notification.ReactNativePushNotificationPackage;
import com.stube.app.player.ReactAPlayerPackage;
import com.stube.app.proxy.ProxyPackage;
import com.stube.app.share.RNSharePackage;
import com.stube.app.share.ShareApplication;
import com.stube.app.toast.ToastPackage;
import com.stube.app.webview.RNCWebViewPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.flurry.android.FlurryAgent;

import org.devio.rn.splashscreen.SplashScreenReactPackage;

import java.util.Arrays;
import java.util.List;

import fr.greweb.reactnativeviewshot.RNViewShotPackage;
import io.realm.react.RealmReactPackage;
import ui.fileselector.RNFileSelectorPackage;

// import com.tencent.bugly.crashreport.CrashReport;

public class MainApplication extends Application implements ShareApplication, ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                    new MainReactPackage(),
                    new BackgroundJobPackage(),
                    new ReactNativePushNotificationPackage(),
                    new SystemSettingPackage(),
                    new RNSharePackage(),
                    new RNFileSelectorPackage(),
                    new RNViewShotPackage(),
                    new RNCWebViewPackage(),
                    new RealmReactPackage(),
                    new OrientationPackage(),
                    new ReactAPlayerPackage(),
                    new RNFSPackage(),
                    new RNDeviceInfo(),
                    new SplashScreenReactPackage(),
                    new VectorIconsPackage(),
                    new RNGestureHandlerPackage(),
                    new DownloaderPackage(),
                    new HelperPackage(),
                    new ToastPackage(),
                    new ProxyPackage(),
                    new ReactNativeConfigPackage()
            );
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

//    // get FLURRY_KEY from market
//    private String getFlurryKey(String market) {
//        switch(market) {
//            case "01": return BuildConfig.FLURRY_KEY01;
//            case "02": return BuildConfig.FLURRY_KEY02;
//            case "03": return BuildConfig.FLURRY_KEY03;
//            case "04": return BuildConfig.FLURRY_KEY04;
//            case "05": return BuildConfig.FLURRY_KEY05;
//            case "06": return BuildConfig.FLURRY_KEY06;
//            case "07": return BuildConfig.FLURRY_KEY07;
//            case "08": return BuildConfig.FLURRY_KEY08;
//            case "09": return BuildConfig.FLURRY_KEY09;
//            default: return BuildConfig.FLURRY_KEY;
//        }
//    }

    @Override
    public void onCreate() {
        super.onCreate();
        // CrashReport.initCrashReport(getApplicationContext(), "d9764b3f63", true);
        // String[] urls = {"http:"};
        // BlackList.init(this, urls);
        BlackList.init(this);
        Config.init(getApplicationContext());
        SoLoader.init(this, /* native exopackage */ false);
        if (!BuildConfig.DEBUG && BuildConfig.FLURRY_KEY != null) {
            new FlurryAgent.Builder()
            .withLogEnabled(true)
            .build(this, BuildConfig.FLURRY_KEY);
        }
        // Properties prop = System.getProperties();
        // prop.setProperty("proxySet", "true");
        // prop.setProperty("proxyHost", "localhost");
        // prop.setProperty("proxyPort", "8888");
    }

    @Override
    public String getFileProviderAuthority() {
        return BuildConfig.APPLICATION_ID + ".provider";
    }
}
