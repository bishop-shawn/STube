package com.stube.app.toast;

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.stube.app.R;

public class CustomToast {

    private static TextView mText;
    private static Toast mToast;

    public static void show(final Activity activity, final String message) {
        if (activity == null) return;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (!activity.isFinishing()) {
                    if (mText == null || mToast == null) {
                        LayoutInflater inflater = activity.getLayoutInflater();
                        View layout = inflater.inflate(R.layout.toast_layout,
                                (ViewGroup) activity.findViewById(R.id.toast_layout_root));
                        mText = (TextView) layout.findViewById(R.id.text);

                        mToast = new Toast(activity);
                        mToast.setView(layout);
                    }
                    mText.setText(message);
                    mToast.show();
                }
            }
        });
    }

    public static void hide() {
        if (mToast != null) {
            mToast.cancel();
            mToast = null;
        }
    }
}
