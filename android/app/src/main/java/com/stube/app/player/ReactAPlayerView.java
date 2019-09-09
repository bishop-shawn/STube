package com.stube.app.player;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Matrix;
import android.os.Build;
import android.os.Handler;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.widget.MediaController;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
public class ReactAPlayerView extends APlayerView implements
        AMediaPlayer.OnPreparedListener,
        AMediaPlayer.OnErrorListener,
        AMediaPlayer.OnBufferingUpdateListener,
        AMediaPlayer.OnSeekCompleteListener,
        AMediaPlayer.OnCompletionListener,
        AMediaPlayer.OnInfoListener,
        LifecycleEventListener,
        MediaController.MediaPlayerControl {

    public static final String EVENT_PROP_FAST_FORWARD = "canPlayFastForward";
    public static final String EVENT_PROP_SLOW_FORWARD = "canPlaySlowForward";
    public static final String EVENT_PROP_SLOW_REVERSE = "canPlaySlowReverse";
    public static final String EVENT_PROP_REVERSE = "canPlayReverse";
    public static final String EVENT_PROP_STEP_FORWARD = "canStepForward";
    public static final String EVENT_PROP_STEP_BACKWARD = "canStepBackward";
    public static final String EVENT_PROP_DURATION = "duration";
    public static final String EVENT_PROP_PLAYABLE_DURATION = "playableDuration";
    public static final String EVENT_PROP_SEEKABLE_DURATION = "seekableDuration";
    public static final String EVENT_PROP_CURRENT_TIME = "currentTime";
    public static final String READ_POSITION = "readPosition";
    public static final String EVENT_PROP_SEEK_TIME = "seekTime";
    public static final String EVENT_PROP_BUFFER_POSITION = "bufferPosition";
    public static final String EVENT_PROP_NATURALSIZE = "naturalSize";
    public static final String EVENT_PROP_WIDTH = "width";
    public static final String EVENT_PROP_HEIGHT = "height";
    public static final String EVENT_PROP_ORIENTATION = "orientation";
    public static final String EVENT_PROP_METADATA = "metadata";
    public static final String EVENT_PROP_TARGET = "target";
    public static final String EVENT_PROP_METADATA_IDENTIFIER = "identifier";
    public static final String EVENT_PROP_METADATA_VALUE = "value";
    public static final String EVENT_PROP_ERROR = "error";
    public static final String EVENT_PROP_WHAT = "what";
    public static final String EVENT_PROP_EXTRA = "extra";
    private static final String TAG = ReactAPlayerView.class.getSimpleName();
    private ThemedReactContext mThemedReactContext;
    private RCTEventEmitter mEventEmitter;
    private Handler mProgressUpdateHandler = new Handler();
    private Runnable mProgressUpdateRunnable = null;
    private Handler videoControlHandler = new Handler();
    private MediaController mediaController;
    private String mSrcUriString = null;
    private String mSrcType = "mp4";
    private ReadableMap mRequestHeaders = null;
    private boolean mSrcIsNetwork = false;
    private boolean mSrcIsAsset = false;
    private ScalableType mResizeMode = ScalableType.LEFT_TOP;
    private boolean mRepeat = false;
    private boolean mPaused = false;
    private boolean mMuted = false;
    private float mVolume = 1.0f;
    private float mStereoPan = 0.0f;
    private float mProgressUpdateInterval = 250.0f;
    private float mRate = 1.0f;
    private float mActiveRate = 1.0f;
    private long mSeekTime = 0;
    private boolean mPlayInBackground = false;
    private boolean mBackgroundPaused = false;
    private boolean mIsFullscreen = false;
    private int mMainVer = 0;
    private int mPatchVer = 0;
    private boolean mMediaPlayerValid = false; // True if mMediaPlayer is in prepared, started, paused or completed state.
    private int mVideoDuration = 0;
    private int mVideoBufferedDuration = 0;
    private boolean isCompleted = false;
    private boolean mUseNativeControls = false;
    public ReactAPlayerView(ThemedReactContext themedReactContext) {
        super(themedReactContext);

        mThemedReactContext = themedReactContext;
        mEventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);
        themedReactContext.addLifecycleEventListener(this);

        initializeMediaPlayerIfNeeded();
        setSurfaceTextureListener(this);

        mProgressUpdateRunnable = new Runnable() {
            @Override
            public void run() {

                if (mMediaPlayerValid && !isCompleted && !mPaused && !mBackgroundPaused) {
                    WritableMap event = Arguments.createMap();
                    event.putDouble(READ_POSITION, mMediaPlayer.getBufferPosition() / 1000.0);
                    event.putDouble(EVENT_PROP_CURRENT_TIME, mMediaPlayer.getCurrentPosition() / 1000.0);
                    event.putDouble(EVENT_PROP_PLAYABLE_DURATION, mVideoBufferedDuration / 1000.0); //TODO:mBufferUpdateRunnable
                    event.putDouble(EVENT_PROP_SEEKABLE_DURATION, mVideoDuration / 1000.0);
//                    event.putDouble(EVENT_PROP_BUFFER_POSITION, mMediaPlayer.getBufferPosition() / 1000.0);
//                    mMediaPlayer.printBufferInfo();
                    mEventEmitter.receiveEvent(getId(), Events.EVENT_PROGRESS.toString(), event);

                    // Check for update after an interval
                    mProgressUpdateHandler.postDelayed(mProgressUpdateRunnable, Math.round(mProgressUpdateInterval));
                }
            }
        };
    }

    /**
     * toStringMap converts a {@link ReadableMap} into a HashMap.
     *
     * @param readableMap The ReadableMap to be conveted.
     * @return A HashMap containing the data that was in the ReadableMap.
     * @see 'Adapted from https://github.com/artemyarulin/react-native-eval/blob/master/android/src/main/java/com/evaluator/react/ConversionUtil.java'
     */
    public static Map<String, String> toStringMap(@Nullable ReadableMap readableMap) {
        Map<String, String> result = new HashMap<>();
        if (readableMap == null)
            return result;

        com.facebook.react.bridge.ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            result.put(key, readableMap.getString(key));
        }

        return result;
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (mUseNativeControls) {
            initializeMediaControllerIfNeeded();
            mediaController.show();
        }

        return super.onTouchEvent(event);
    }

    @Override
    @SuppressLint("DrawAllocation")
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);

        if (!changed || !mMediaPlayerValid) {
            return;
        }

        int videoWidth = getVideoWidth();
        int videoHeight = getVideoHeight();

        if (videoWidth == 0 || videoHeight == 0) {
            return;
        }

        Size viewSize = new Size(getWidth(), getHeight());
        Size videoSize = new Size(videoWidth, videoHeight);
        ScaleManager scaleManager = new ScaleManager(viewSize, videoSize);
        Matrix matrix = scaleManager.getScaleMatrix(mScalableType);
        if (matrix != null) {
            setTransform(matrix);
        }
    }

    private void initializeMediaPlayerIfNeeded() {
        if (mMediaPlayer == null) {
            mMediaPlayerValid = false;
            mMediaPlayer = new AMediaPlayer();
            mMediaPlayer.setScreenOnWhilePlaying(true);
            mMediaPlayer.setOnVideoSizeChangedListener(this);
            mMediaPlayer.setOnErrorListener(this);
            mMediaPlayer.setOnPreparedListener(this);
            mMediaPlayer.setOnBufferingUpdateListener(this);
            mMediaPlayer.setOnSeekCompleteListener(this);
            mMediaPlayer.setOnCompletionListener(this);
            mMediaPlayer.setOnInfoListener(this);
//            if (Build.VERSION.SDK_INT >= 23) {
//                mMediaPlayer.setOnTimedMetaDataAvailableListener(new TimedMetaDataAvailableListener());
//            }
        }
    }

    private void initializeMediaControllerIfNeeded() {
        if (mediaController == null) {
            mediaController = new MediaController(this.getContext());
        }
    }

    public void cleanupMediaPlayerResources() {
        if (mediaController != null) {
            mediaController.hide();
        }
        if (mMediaPlayer != null) {
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
//                mMediaPlayer.setOnTimedMetaDataAvailableListener(null);
//            }
            mMediaPlayerValid = false;
            release();
        }
        if (mIsFullscreen) {
            setFullscreen(false);
        }
        if (mThemedReactContext != null) {
            mThemedReactContext.removeLifecycleEventListener(this);
            mThemedReactContext = null;
        }
    }

    public void setSrc(final String uriString, final String type, final boolean isNetwork, final boolean isAsset, final ReadableMap requestHeaders) {
        setSrc(uriString, type, isNetwork, isAsset, requestHeaders, 0, 0);
    }

    public void setSrc(final String uriString, final String type, final boolean isNetwork, final boolean isAsset, final ReadableMap requestHeaders, final int expansionMainVersion, final int expansionPatchVersion) {

        mSrcUriString = uriString;
        mSrcType = type;
        mSrcIsNetwork = isNetwork;
        mSrcIsAsset = isAsset;
        mRequestHeaders = requestHeaders;
        mMainVer = expansionMainVersion;
        mPatchVer = expansionPatchVersion;


        mMediaPlayerValid = false;
        mVideoDuration = 0;
        mVideoBufferedDuration = 0;

        initializeMediaPlayerIfNeeded();

        try {
            if (isNetwork || isAsset) {
                setDataSource(uriString);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }

        WritableMap src = Arguments.createMap();

        WritableMap wRequestHeaders = Arguments.createMap();
        wRequestHeaders.merge(mRequestHeaders);

        src.putString(ReactAPlayerViewManager.PROP_SRC_URI, uriString);
        src.putString(ReactAPlayerViewManager.PROP_SRC_TYPE, type);
        src.putMap(ReactAPlayerViewManager.PROP_SRC_HEADERS, wRequestHeaders);
        src.putBoolean(ReactAPlayerViewManager.PROP_SRC_IS_NETWORK, isNetwork);
        if (mMainVer > 0) {
            src.putInt(ReactAPlayerViewManager.PROP_SRC_MAINVER, mMainVer);
            if (mPatchVer > 0) {
                src.putInt(ReactAPlayerViewManager.PROP_SRC_PATCHVER, mPatchVer);
            }
        }
        WritableMap event = Arguments.createMap();
        event.putMap(ReactAPlayerViewManager.PROP_SRC, src);
        mEventEmitter.receiveEvent(getId(), Events.EVENT_LOAD_START.toString(), event);
        isCompleted = false;

        try {
            prepareAsync(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setResizeModeModifier(final ScalableType resizeMode) {
        mResizeMode = resizeMode;

        if (mMediaPlayerValid) {
            setScalableType(resizeMode);
            invalidate();
        }
    }

    public void setRepeatModifier(final boolean repeat) {

        mRepeat = repeat;

        if (mMediaPlayerValid) {
            setLooping(repeat);
        }
    }

    public void setPausedModifier(final boolean paused) {
        mPaused = paused;

        if (!mMediaPlayerValid) {
            return;
        }

        if (mPaused) {
            if (mMediaPlayer.isPlaying()) {
                pause();
            }
        } else {
            if (!mMediaPlayer.isPlaying()) {
                start();
                // Setting the rate unpauses, so we have to wait for an unpause
//                if (mRate != mActiveRate) {
//                    setRateModifier(mRate);
//                }

                // Also Start the Progress Update Handler
                mProgressUpdateHandler.post(mProgressUpdateRunnable);
            }
        }
        setKeepScreenOn(!mPaused);
    }

    // reduces the volume based on stereoPan
    private float calulateRelativeVolume() {
        float relativeVolume = (mVolume * (1 - Math.abs(mStereoPan)));
        // only one decimal allowed
        BigDecimal roundRelativeVolume = new BigDecimal(relativeVolume).setScale(1, BigDecimal.ROUND_HALF_UP);
        return roundRelativeVolume.floatValue();
    }

    public void setMutedModifier(final boolean muted) {
        mMuted = muted;

        if (!mMediaPlayerValid) {
            return;
        }

        if (mMuted) {
            setVolume(0, 0);
        } else if (mStereoPan < 0) {
            // louder on the left channel
            setVolume(mVolume, calulateRelativeVolume());
        } else if (mStereoPan > 0) {
            // louder on the right channel
            setVolume(calulateRelativeVolume(), mVolume);
        } else {
            // same volume on both channels
            setVolume(mVolume, mVolume);
        }
    }

    public void setVolumeModifier(final float volume) {
        mVolume = volume;
        setMutedModifier(mMuted);
    }

    public void setStereoPan(final float stereoPan) {
        mStereoPan = stereoPan;
        setMutedModifier(mMuted);
    }

    public void setProgressUpdateInterval(final float progressUpdateInterval) {
        mProgressUpdateInterval = progressUpdateInterval;
    }

//    public void setRateModifier(final float rate) {
//        mRate = rate;
//
//        if (mMediaPlayerValid) {
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
//                if (!mPaused) { // Applying the rate while paused will cause the video to start
//                    /* Per https://stackoverflow.com/questions/39442522/setplaybackparams-causes-illegalstateexception
//                     * Some devices throw an IllegalStateException if you set the rate without first calling reset()
//                     * TODO: Call reset() then reinitialize the player
//                     */
//                    try {
//                        mMediaPlayer.setPlaybackParams(mMediaPlayer.getPlaybackParams().setSpeed(rate));
//                        mActiveRate = rate;
//                    } catch (Exception e) {
//                        Log.e(ReactAPlayerViewManager.REACT_CLASS, "Unable to set rate, unsupported on this device");
//                    }
//                }
//            } else {
//                Log.e(ReactAPlayerViewManager.REACT_CLASS, "Setting playback rate is not yet supported on Android versions below 6.0");
//            }
//        }
//    }

    public void setFullscreen(boolean isFullscreen) {
        if (isFullscreen == mIsFullscreen) {
            return; // Avoid generating events when nothing is changing
        }
        mIsFullscreen = isFullscreen;

        Activity activity = mThemedReactContext.getCurrentActivity();
        if (activity == null) {
            return;
        }
        Window window = activity.getWindow();
        View decorView = window.getDecorView();
        int uiOptions;
        if (mIsFullscreen) {
            if (Build.VERSION.SDK_INT >= 19) { // 4.4+
                uiOptions = SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | SYSTEM_UI_FLAG_FULLSCREEN;
            } else {
                uiOptions = SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | SYSTEM_UI_FLAG_FULLSCREEN;
            }
            mEventEmitter.receiveEvent(getId(), Events.EVENT_FULLSCREEN_WILL_PRESENT.toString(), null);
            decorView.setSystemUiVisibility(uiOptions);
            mEventEmitter.receiveEvent(getId(), Events.EVENT_FULLSCREEN_DID_PRESENT.toString(), null);
        } else {
            uiOptions = View.SYSTEM_UI_FLAG_VISIBLE;
            mEventEmitter.receiveEvent(getId(), Events.EVENT_FULLSCREEN_WILL_DISMISS.toString(), null);
            decorView.setSystemUiVisibility(uiOptions);
            mEventEmitter.receiveEvent(getId(), Events.EVENT_FULLSCREEN_DID_DISMISS.toString(), null);
        }
    }

    public void applyModifiers() {
        setResizeModeModifier(mResizeMode);
        setRepeatModifier(mRepeat);
        setPausedModifier(mPaused);
        setMutedModifier(mMuted);
        setProgressUpdateInterval(mProgressUpdateInterval);
//        setRateModifier(mRate);
    }

    public void setPlayInBackground(final boolean playInBackground) {

        mPlayInBackground = playInBackground;
    }

    public void setControls(boolean controls) {
        this.mUseNativeControls = controls;
    }

    @Override
    public void onPrepared(AMediaPlayer mp) {

        mMediaPlayerValid = true;
        mVideoDuration = mp.getDuration();

        WritableMap naturalSize = Arguments.createMap();
        naturalSize.putInt(EVENT_PROP_WIDTH, mp.getVideoWidth());
        naturalSize.putInt(EVENT_PROP_HEIGHT, mp.getVideoHeight());
        if (mp.getVideoWidth() > mp.getVideoHeight())
            naturalSize.putString(EVENT_PROP_ORIENTATION, "landscape");
        else
            naturalSize.putString(EVENT_PROP_ORIENTATION, "portrait");

        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_DURATION, mVideoDuration / 1000.0);
        event.putDouble(EVENT_PROP_CURRENT_TIME, mp.getCurrentPosition() / 1000.0);
        event.putMap(EVENT_PROP_NATURALSIZE, naturalSize);
        // TODO: Actually check if you can.
        event.putBoolean(EVENT_PROP_FAST_FORWARD, true);
        event.putBoolean(EVENT_PROP_SLOW_FORWARD, true);
        event.putBoolean(EVENT_PROP_SLOW_REVERSE, true);
        event.putBoolean(EVENT_PROP_REVERSE, true);
        event.putBoolean(EVENT_PROP_FAST_FORWARD, true);
        event.putBoolean(EVENT_PROP_STEP_BACKWARD, true);
        event.putBoolean(EVENT_PROP_STEP_FORWARD, true);
        mEventEmitter.receiveEvent(getId(), Events.EVENT_LOAD.toString(), event);

        applyModifiers();

        if (mUseNativeControls) {
            initializeMediaControllerIfNeeded();
            mediaController.setMediaPlayer(this);
            mediaController.setAnchorView(this);

            videoControlHandler.post(new Runnable() {
                @Override
                public void run() {
                    mediaController.setEnabled(true);
                    mediaController.show();
                }
            });
        }

//        selectTimedMetadataTrack(mp);
    }

    @Override
    public boolean onError(AMediaPlayer mp, int what, int extra) {

        WritableMap error = Arguments.createMap();
        error.putInt(EVENT_PROP_WHAT, what);
        error.putInt(EVENT_PROP_EXTRA, extra);
        WritableMap event = Arguments.createMap();
        event.putMap(EVENT_PROP_ERROR, error);
        mEventEmitter.receiveEvent(getId(), Events.EVENT_ERROR.toString(), event);
        return true;
    }

    @Override
    public boolean onInfo(AMediaPlayer mp, int what, int extra) {
        switch (what) {
            case AMediaPlayer.MEDIA_INFO_BUFFERING_START:
                mEventEmitter.receiveEvent(getId(), Events.EVENT_STALLED.toString(), Arguments.createMap());
                break;
            case AMediaPlayer.MEDIA_INFO_BUFFERING_END:
                mEventEmitter.receiveEvent(getId(), Events.EVENT_RESUME.toString(), Arguments.createMap());
                break;
            case AMediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START:
                mEventEmitter.receiveEvent(getId(), Events.EVENT_READY_FOR_DISPLAY.toString(), Arguments.createMap());
                break;

            default:
        }
        return false;
    }

    @Override
    public void onBufferingUpdate(AMediaPlayer mp, int percent) {
//        selectTimedMetadataTrack(mp);
        mVideoBufferedDuration = (int) Math.round((double) (mVideoDuration * percent) / 100.0);
    }

    public void onSeekComplete(AMediaPlayer mp) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_CURRENT_TIME, getCurrentPosition() / 1000.0);
        event.putDouble(EVENT_PROP_SEEK_TIME, mSeekTime / 1000.0);
        mEventEmitter.receiveEvent(getId(), Events.EVENT_SEEK.toString(), event);
        mSeekTime = 0;
    }

    @Override
    public void seekTo(int msec) {
        if (mMediaPlayerValid) {
            mSeekTime = msec;
            super.seekTo(msec);
            if (isCompleted && mVideoDuration != 0 && msec < mVideoDuration) {
                isCompleted = false;
            }
        }
    }

    @Override
    public int getBufferPercentage() {
        return 0;
    }

    @Override
    public boolean canPause() {
        return true;
    }

    @Override
    public boolean canSeekBackward() {
        return true;
    }

    @Override
    public boolean canSeekForward() {
        return true;
    }

    @Override
    public int getAudioSessionId() {
        return 0;
    }

    @Override
    public void onCompletion(AMediaPlayer mp) {
        isCompleted = true;
        mEventEmitter.receiveEvent(getId(), Events.EVENT_END.toString(), null);
        if (!mRepeat) {
            setKeepScreenOn(false);
        }
    }

    // This is not fully tested and does not work for all forms of timed metadata
//    @TargetApi(23) // 6.0
//    public class TimedMetaDataAvailableListener
//            implements AMediaPlayer.OnTimedMetaDataAvailableListener
//    {
//        public void onTimedMetaDataAvailable(AMediaPlayer mp, TimedMetaData data) {
//            WritableMap event = Arguments.createMap();
//
//            try {
//                String rawMeta  = new String(data.getMetaData(), "UTF-8");
//                WritableMap id3 = Arguments.createMap();
//
//                id3.putString(EVENT_PROP_METADATA_VALUE, rawMeta.substring(rawMeta.lastIndexOf("\u0003") + 1));
//                id3.putString(EVENT_PROP_METADATA_IDENTIFIER, "id3/TDEN");
//
//                WritableArray metadata = new WritableNativeArray();
//
//                metadata.pushMap(id3);
//
//                event.putArray(EVENT_PROP_METADATA, metadata);
//                event.putDouble(EVENT_PROP_TARGET, getId());
//            } catch (UnsupportedEncodingException e) {
//                e.printStackTrace();
//            }
//
//            mEventEmitter.receiveEvent(getId(), Events.EVENT_TIMED_METADATA.toString(), event);
//        }
//    }

    @Override
    protected void onDetachedFromWindow() {
        mMediaPlayerValid = false;
        super.onDetachedFromWindow();
        setKeepScreenOn(false);
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();

//        if(mMainVer>0) {
//            setSrc(mSrcUriString, mSrcType, mSrcIsNetwork, mSrcIsAsset, mRequestHeaders, mMainVer, mPatchVer);
//        }
//        else {
//            setSrc(mSrcUriString, mSrcType, mSrcIsNetwork, mSrcIsAsset, mRequestHeaders);
//        }
        setKeepScreenOn(true);
    }

    @Override
    public void onHostPause() {
        if (mMediaPlayerValid && !mPaused && !mPlayInBackground) {
            /* Pause the video in background
             * Don't update the paused prop, developers should be able to update it on background
             *  so that when you return to the app the video is paused
             */
            mBackgroundPaused = true;
            mMediaPlayer.pause();
        }
    }

    @Override
    public void onHostResume() {
        mBackgroundPaused = false;
        if (mMediaPlayerValid && !mPlayInBackground && !mPaused) {
            new Handler().post(new Runnable() {
                @Override
                public void run() {
                    // Restore original state
                    setPausedModifier(false);
                }
            });
        }
    }

    @Override
    public void onHostDestroy() {
    }

    public enum Events {
        EVENT_LOAD_START("onVideoLoadStart"),
        EVENT_LOAD("onVideoLoad"),
        EVENT_ERROR("onVideoError"),
        EVENT_PROGRESS("onVideoProgress"),
        EVENT_TIMED_METADATA("onTimedMetadata"),
        EVENT_SEEK("onVideoSeek"),
        EVENT_END("onVideoEnd"),
        EVENT_STALLED("onPlaybackStalled"),
        EVENT_RESUME("onPlaybackResume"),
        EVENT_READY_FOR_DISPLAY("onReadyForDisplay"),
        EVENT_FULLSCREEN_WILL_PRESENT("onVideoFullscreenPlayerWillPresent"),
        EVENT_FULLSCREEN_DID_PRESENT("onVideoFullscreenPlayerDidPresent"),
        EVENT_FULLSCREEN_WILL_DISMISS("onVideoFullscreenPlayerWillDismiss"),
        EVENT_FULLSCREEN_DID_DISMISS("onVideoFullscreenPlayerDidDismiss");

        private final String mName;

        Events(final String name) {
            mName = name;
        }

        @Override
        public String toString() {
            return mName;
        }
    }

    // Select track (so we can use it to listen to timed meta data updates)
//    private void selectTimedMetadataTrack(AMediaPlayer mp) {
//        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
//            return;
//        }
//        try { // It's possible this could throw an exception if the framework doesn't support getting track info
//            AMediaPlayer.TrackInfo[] trackInfo = mp.getTrackInfo();
//            for (int i = 0; i < trackInfo.length; ++i) {
//                if (trackInfo[i].getTrackType() == AMediaPlayer.TrackInfo.MEDIA_TRACK_TYPE_TIMEDTEXT) {
//                    mp.selectTrack(i);
//                    break;
//                }
//            }
//        } catch (Exception e) {}
//    }
}
