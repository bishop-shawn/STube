package com.stube.app.share.social;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;

/**
 * Created by disenodosbbcl on 23-07-16.
 */
public abstract class SingleShareIntent extends ShareIntent {

    protected String playStoreURL = null;
    protected String appStoreURL = null;

    public SingleShareIntent(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    public void open(ReadableMap options) throws ActivityNotFoundException {
        System.out.println(getPackage());
        //  check if package is installed
        if (getPackage() != null || getDefaultWebLink() != null || getPlayStoreLink() != null) {
            if (this.isPackageInstalled(getPackage(), reactContext)) {
                System.out.println("INSTALLED");
                this.getIntent().setPackage(getPackage());
                super.open(options);
            } else {
                System.out.println("NOT INSTALLED");
                String url = "";
                if (getDefaultWebLink() != null) {
                    url = getDefaultWebLink()
                            .replace("{url}", this.urlEncode(options.getString("url")))
                            .replace("{message}", this.urlEncode(options.getString("message")));
                } else if (getPlayStoreLink() != null) {
                    url = getPlayStoreLink();
                } else {
                    //  TODO
                }
                //  open web intent
                this.setIntent(new Intent(new Intent("android.intent.action.VIEW", Uri.parse(url))));
            }
        }
        //  configure default
        super.open(options);
    }

    protected void openIntentChooser() throws ActivityNotFoundException {
        this.getIntent().setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        this.reactContext.startActivity(this.getIntent());
    }
}
