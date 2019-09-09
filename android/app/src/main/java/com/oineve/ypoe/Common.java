package com.oineve.ypoe;

public class Common {

    static {
        try {
            System.loadLibrary("common");
        } catch (UnsatisfiedLinkError var1) {

        } catch (SecurityException var2) {

        }
    }

    public static native String getSignature(String str);

}
