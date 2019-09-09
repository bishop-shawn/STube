package com.stube.app.player;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.view.Surface;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.WindowManager;

import com.aplayer.APlayerAndroid;
import com.aplayer.APlayerAndroid.CONFIGID;
import com.aplayer.APlayerAndroid.PlayCompleteRet;
import com.aplayer.APlayerAndroid.StatisticsInfo;

import java.io.FileDescriptor;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class AMediaPlayer {

    public static final int PLAYER_STATE_UNKNOWN = -1;
    public static final int PLAYER_STATE_RELEASED = 0;
    public static final int PLAYER_STATE_IDLE = 1;
    public static final int PLAYER_STATE_PLAYING = 2;
    public static final int PLAYER_STATE_PAUSED = 3;
    public static final int PLAYER_STATE_INITIALIZED = 4;
    public static final int PLAYER_STATE_PREPARED = 5;
    public static final int PLAYER_STATE_ERROR = 6;
    public static final int PLAYER_STATE_COMPLETE = 7;
    public static final int MEDIA_ERROR_FAILED = -100;
    public static final int MEDIA_ERROR_OPEN_FAILED = -110;
    public static final int MEDIA_ERROR_EMPTY_URL = -112;
    public static final int MEDIA_ERROR_UNKNOWN = -101;
    public static final int MEDIA_INFO_BUFFERING_START = 701;
    public static final int MEDIA_INFO_BUFFERING_END = 702;
    public static final int MEDIA_INFO_VIDEO_RENDERING_START = 3;
    private static final String TAG = AMediaPlayer.class.getSimpleName();
    APlayerAndroid mPlayer;
    View mView;
    int mCurrrentState;
    String mPath;
    FileDescriptor mFileDescriptor;
    int mVideoDuration = 0;
    int mVideoWidth = 0;
    int mVideoHeight = 0;
    OnPreparedListener mOnPreparedListener;
    OnCompletionListener mOnCompletionListener;
    OnBufferingUpdateListener mOnBufferingUpdateListener;
    OnSeekCompleteListener mOnSeekCompleteListener;
    OnVideoSizeChangedListener mOnVideoSizeChangedListener;
    OnErrorListener mOnErrorListener;
    OnInfoListener mOnInfoListener;
    OnReCreateHwDecoderListener mOnReCreateHwDecoderListener;
    OnShowSubtitleListener mOnShowSubtitleListener;
    boolean mIsOpenCalled = false;
    boolean mIsClosing = false;
    boolean mIsBuffering = false;
    private int mId = -1;
    private HashMap<Integer, String> mPlayerConfig = new HashMap<>();
    private boolean mIsLooping = false;
    private Handler mUIHandler = new Handler(Looper.getMainLooper());
    private APlayerAndroid.OnOpenCompleteListener mOnOpenCompleteListener = new APlayerAndroid.OnOpenCompleteListener() {
        @Override
        public void onOpenComplete(boolean success) {
            logDebug(TAG, "onOpenComplete, success: " + success);
            if (success) {
                mVideoDuration = mPlayer.getDuration();
                mVideoWidth = mPlayer.getVideoWidth();
                mVideoHeight = mPlayer.getVideoHeight();
                logDebug(TAG, "duration: " + mVideoDuration + ", width: " + mVideoWidth + ", height: " + mVideoHeight);
                mCurrrentState = PLAYER_STATE_PREPARED;
                if (mOnPreparedListener != null) {
                    mOnPreparedListener.onPrepared(AMediaPlayer.this);
                }
                if (mOnVideoSizeChangedListener != null) {
                    mOnVideoSizeChangedListener.onVideoSizeChanged(AMediaPlayer.this, mPlayer.getVideoWidth(), mPlayer.getVideoHeight());
                }
                if (mView != null) {
                    mView.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            logDebug(TAG, "onOpenComplete, checkAndAdjustSurfaceViewSize");
                            checkAndAdjustSurfaceViewSize(mView.getMeasuredWidth(), mView.getMeasuredHeight());
                        }
                    }, 50);
                }
            } else {
                StatisticsInfo info = mPlayer.getStatisticsInfo();
                if (info != null) {
                    Log.e(TAG, "onOpenComplete, error: " + info.error);
                }
                mCurrrentState = PLAYER_STATE_ERROR;
                if (mOnErrorListener != null) {
                    mOnErrorListener.onError(AMediaPlayer.this, MEDIA_ERROR_FAILED, MEDIA_ERROR_OPEN_FAILED);
                }
            }
        }
    };
    private APlayerAndroid.OnPlayCompleteListener mOnPlayCompleteListenerWhenPrepare = new APlayerAndroid.OnPlayCompleteListener() {
        @Override
        public void onPlayComplete(String completeRet) {
            if (PlayCompleteRet.PLAYRE_RESULT_CLOSE.contentEquals(completeRet)) {
                mIsClosing = false;
                prepareAsync();
            }
        }
    };
    private APlayerAndroid.OnPlayCompleteListener mOnPlayCompleteListenerWhenClose = new APlayerAndroid.OnPlayCompleteListener() {
        @Override
        public void onPlayComplete(String completeRet) {
            if (PlayCompleteRet.PLAYRE_RESULT_CLOSE.contentEquals(completeRet)) {
                mIsClosing = false;
                long id = Thread.currentThread().getId();
                logDebug(TAG, "close after completed, thread id：" + id);
            }
        }
    };

    public AMediaPlayer() {
        createPlayerAndSetListener();
        mCurrrentState = PLAYER_STATE_IDLE;
    }

    private void createPlayerAndSetListener() {
        logDebug(TAG, "createPlayerAndSetListener");
        mPlayer = new APlayerAndroid();
        mPlayer.openLog(false);
        mPlayer.setConfig(CONFIGID.HW_DECODER_USE, "1");
        mPlayer.setConfig(CONFIGID.SUBTITLE_USABLE, "1");
        mPlayer.setConfig(CONFIGID.STRETCH_MODE, "0");
        mPlayer.setConfig(CONFIGID.NET_BUFFER_LEAVE, "120");
        mPlayer.setConfig(CONFIGID.NET_BUFFER_READ, "1200");
        mPlayer.setConfig(CONFIGID.NET_BUFFER_READ_TIME, "300");

        initPlayerListener();
        mId = mPlayer.gObjId - 1;
    }

    private boolean isMainThread() {
        long mainThreadId = Looper.getMainLooper().getThread().getId();
        long currThreadId = Thread.currentThread().getId();
        logDebug(TAG, "isMainThread, mainThreadId: " + mainThreadId + ", currThreadId: " + currThreadId);
        return mainThreadId == currThreadId;
    }

    void reStartAfterComplete() {
        logDebug(TAG, "reStartAfterComplete");
        if (mFileDescriptor != null || !TextUtils.isEmpty(mPath)) {
            mPlayer.setOnOpenCompleteListener(new APlayerAndroid.OnOpenCompleteListener() {
                @Override
                public void onOpenComplete(boolean success) {
                    logDebug(TAG, "reStartAfterComplete, onOpenComplete, success: " + success);
                    if (success) {
                        if (mCurrrentState == PLAYER_STATE_PLAYING) {
                            mPlayer.play();
                            if (mOnCompletionListener != null) {
                                mOnCompletionListener.onCompletion(AMediaPlayer.this);
                            }
                        } else if (mCurrrentState == PLAYER_STATE_COMPLETE) {
                            mPlayer.play();
                            mCurrrentState = PLAYER_STATE_PLAYING;
                        } else {
                            Log.e(TAG, "reStartAfterComplete, unsupported state: " + mCurrrentState);
                        }

                    } else {
                        StatisticsInfo info = mPlayer.getStatisticsInfo();
                        if (info != null) {
                            Log.e(TAG, "reStartAfterComplete, error：" + info.error);
                        }
                        mCurrrentState = PLAYER_STATE_ERROR;
                        if (mOnErrorListener != null) {
                            mOnErrorListener.onError(AMediaPlayer.this, MEDIA_ERROR_FAILED, MEDIA_ERROR_OPEN_FAILED);
                        }
                    }
                }
            });

            if (mFileDescriptor != null) {
                openInner(mFileDescriptor);
            } else {
                openInner(mPath);
            }
        } else {
            Log.e(TAG, "reStartAfterComplete, url is empty");
            mCurrrentState = PLAYER_STATE_ERROR;
            if (mOnErrorListener != null) {
                mOnErrorListener.onError(AMediaPlayer.this, MEDIA_ERROR_FAILED, MEDIA_ERROR_EMPTY_URL);
            }
        }
    }

    private void initPlayerListener() {
        logDebug(TAG, "initPlayerListener");
        mPlayer.setOnPlayCompleteListener(new APlayerAndroid.OnPlayCompleteListener() {
            @Override
            public void onPlayComplete(String completeRet) {
                logDebug(TAG, "onPlayComplete ret: " + completeRet);
                mIsOpenCalled = false;
                mIsClosing = false;
                mIsBuffering = false;
                if (PlayCompleteRet.PLAYRE_RESULT_COMPLETE.contentEquals(completeRet)) {
                    if (mIsLooping && !mPlayer.isRecording()) {
                        reStartAfterComplete();
                    } else {
                        mCurrrentState = PLAYER_STATE_COMPLETE;
                        if (mOnCompletionListener != null) {
                            mOnCompletionListener.onCompletion(AMediaPlayer.this);
                        }
                    }
                } else if (PlayCompleteRet.PLAYRE_RESULT_CLOSE.contentEquals(completeRet)) {
                    logDebug(TAG, "onPlayComplete PLAYRE_RESULT_CLOSE");
                } else if (PlayCompleteRet.PLAYRE_RESULT_OPENRROR.contentEquals(completeRet)) {
                    logDebug(TAG, "onPlayComplete PLAYRE_RESULT_OPENRROR");
                } else {
                    StatisticsInfo info = mPlayer.getStatisticsInfo();
                    if (info != null) {
                        Log.e(TAG, "onPlayComplete, error：" + info.error);
                    }
                    mCurrrentState = PLAYER_STATE_ERROR;
                    if (mOnErrorListener != null) {
                        mOnErrorListener.onError(AMediaPlayer.this, MEDIA_ERROR_FAILED, MEDIA_ERROR_UNKNOWN);
                    }
                }
            }
        });
        mPlayer.setOnBufferListener(new APlayerAndroid.OnBufferListener() {
            @Override
            public void onBuffer(int progress) {
                logDebug(TAG, "onBuffer, progress: " + progress);
//                if (mOnBufferingUpdateListener != null) {
//                    mOnBufferingUpdateListener.onBufferingUpdate(AMediaPlayer.this, progress);
//                }
                if (mOnInfoListener != null) {
                    if (progress == 100) {
                        mIsBuffering = false;
                        mOnInfoListener.onInfo(AMediaPlayer.this, MEDIA_INFO_BUFFERING_END, MEDIA_INFO_BUFFERING_END);
                    } else if (!mIsBuffering) {
                        mIsBuffering = true;
                        mOnInfoListener.onInfo(AMediaPlayer.this, MEDIA_INFO_BUFFERING_START, MEDIA_INFO_BUFFERING_START);
                    }
                }
            }
        });
        mPlayer.setOnSeekCompleteListener(new APlayerAndroid.OnSeekCompleteListener() {
            @Override
            public void onSeekComplete() {
                logDebug(TAG, "onSeekComplete");
                if (mOnSeekCompleteListener != null) {
                    mOnSeekCompleteListener.onSeekComplete(AMediaPlayer.this);
                }
            }
        });
        mPlayer.setOnFirstFrameRenderListener(new APlayerAndroid.OnFirstFrameRenderListener() {
            @Override
            public void onFirstFrameRender() {
                logDebug(TAG, "onFirstFrameRender");
                if (mOnInfoListener != null) {
                    mOnInfoListener.onInfo(AMediaPlayer.this, MEDIA_INFO_VIDEO_RENDERING_START, MEDIA_INFO_VIDEO_RENDERING_START);
                }
            }
        });
        mPlayer.setOnReCreateHwDecoderListener(new APlayerAndroid.OnReCreateHwDecoderListener() {
            @Override
            public void onReCreateHwDecoder() {
                logDebug(TAG, "onReCreateHwDecoder, state: " + mCurrrentState);
                if (mOnReCreateHwDecoderListener != null) {
                    mOnReCreateHwDecoderListener.onReCreateHwDecoder(AMediaPlayer.this);
                }
            }
        });
        mPlayer.setOnShowSubtitleListener(new APlayerAndroid.OnShowSubtitleListener() {
            @Override
            public void onShowSubtitle(String text) {
                logDebug(TAG, "onShowSubtitle: " + text);
                if (mOnShowSubtitleListener != null) {
                    mOnShowSubtitleListener.onShowSubtitle(AMediaPlayer.this, text);
                }
            }
        });
    }

    private void clearListener() {
        logDebug(TAG, "clearListener");
        mOnPreparedListener = null;
        mOnCompletionListener = null;
        mOnBufferingUpdateListener = null;
        mOnSeekCompleteListener = null;
        mOnVideoSizeChangedListener = null;
        mOnErrorListener = null;
        mOnInfoListener = null;
        mOnReCreateHwDecoderListener = null;
        mOnShowSubtitleListener = null;
    }

    public int getId() {
        return mId;
    }

    public void setView(TextureView view) {
        logDebug(TAG, "setTextureView");
        mView = view;
        mPlayer.setView(view);
    }

    public void setView(SurfaceView view) {
        logDebug(TAG, "setSurfaceView");
        mView = view;
        mPlayer.setView(view);
    }

    public void setSurface(Surface surface) {
        logDebug(TAG, "setSurface");
        mPlayer.setView(surface);
    }

    public int getBufferPosition() {
        int readPosition = 0;
        String readPositionStr = mPlayer.getConfig(CONFIGID.READPOSITION);
        if (!TextUtils.isEmpty(readPositionStr) && TextUtils.isDigitsOnly(readPositionStr)) {
            readPosition = Integer.parseInt(readPositionStr);
        }
        return readPosition;
    }

    public void printBufferInfo() {
        String bufferEnter = mPlayer.getConfig(CONFIGID.NET_BUFFER_ENTER);
        String bufferLeave = mPlayer.getConfig(CONFIGID.NET_BUFFER_LEAVE);
        String seekBufferWaitTime = mPlayer.getConfig(CONFIGID.NET_SEEKBUFFER_WAITTIME);
        String bufferReadTime = mPlayer.getConfig(CONFIGID.NET_BUFFER_READ_TIME);
        String bufferRead = mPlayer.getConfig(CONFIGID.NET_BUFFER_READ);
        logDebug(TAG, "bufferEnter: " + bufferEnter + ", bufferLeave: " + bufferLeave + ", seekBufferWaitTime: " + seekBufferWaitTime +  ", bufferReadTime: " + bufferReadTime + ", bufferRead: " + bufferRead);
    }

    public boolean checkAndAdjustSurfaceViewSize(int width, int height) {
        boolean ret = false;
        logDebug(TAG, "checkAndAdjustSurfaceViewSize, isHwDecord: " + isHwDecode() + ", apiLevel: " + Build.VERSION.SDK_INT);
        if (isHwDecode() && Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT_WATCH) {
            Size size = getAdjustSurfaceViewSize(width, height);
            if (size != null && size.getWidth() > 0 && size.getHeight() > 0) {
                mView.getLayoutParams().width = size.getWidth();
                mView.getLayoutParams().height = size.getHeight();
                mView.requestLayout();
                ret = true;
            } else {
                Log.e(TAG, "checkAndAdjustSurfaceViewSize, wrong width or height");
            }
        }
        return ret;
    }

    public void setDataSource(String path) {
        logDebug(TAG, "setDataSource");
        mPath = path;
        mCurrrentState = PLAYER_STATE_INITIALIZED;
    }

    public void setDataSource(FileDescriptor fd) {
        logDebug(TAG, "setDataSource");
        mFileDescriptor = fd;
        mCurrrentState = PLAYER_STATE_INITIALIZED;
    }

    public void prepare() {
        logDebug(TAG, "prepare");
    }

    public void prepareAsync() {
        logDebug(TAG, "prepareAsync, mIsClosing: " + mIsClosing);

        if (mIsClosing) {
            mPlayer.setOnPlayCompleteListener(mOnPlayCompleteListenerWhenPrepare);
            return;
        }

        if (mFileDescriptor != null || !TextUtils.isEmpty(mPath)) {
            mPlayer.setOnOpenCompleteListener(mOnOpenCompleteListener);
            if (mFileDescriptor != null) {
                openInner(mFileDescriptor);
            } else {
                openInner(mPath);
            }
        } else {
            Log.e(TAG, "prepareAsync, url is empty");
            mCurrrentState = PLAYER_STATE_ERROR;
            if (mOnErrorListener != null) {
                mOnErrorListener.onError(AMediaPlayer.this, MEDIA_ERROR_FAILED, MEDIA_ERROR_EMPTY_URL);
            }
        }

    }

    public void start() {
        logDebug(TAG, "start, state: " + mCurrrentState);
        if (mCurrrentState == PLAYER_STATE_COMPLETE) {
            mIsOpenCalled = false;
            mIsClosing = false;
            mIsBuffering = false;
            reStartAfterComplete();
        } else {
            mPlayer.play();
            mCurrrentState = PLAYER_STATE_PLAYING;
        }
    }

    public void pause() {
        logDebug(TAG, "pause");
        mPlayer.pause();
        mCurrrentState = PLAYER_STATE_PAUSED;
    }

    public void stop() {
        logDebug(TAG, "stop");
        closeInner();
        mCurrrentState = PLAYER_STATE_INITIALIZED;
    }

    public void seekTo(int msec) {
        logDebug(TAG, "seekTo, msec : " + msec);
        mPlayer.setPosition(msec);
    }

    public Size getAdjustSurfaceViewSize(int width, int height) {
        APlayerAndroid.Size originalSize = new APlayerAndroid.Size();
        originalSize.width = width;
        originalSize.height = height;
        APlayerAndroid.Size size = mPlayer.getAdjustSurfaceViewSize(originalSize);
        return new Size(size.width, size.height);
    }

    public void stopRead() {
        logDebug(TAG, "stopRead");
        mPlayer.stopRead(true);
    }

    public void startRead() {
        logDebug(TAG, "startRead");
        mPlayer.stopRead(false);
    }

    public boolean isHwDecode() {
        return "1".equals(getConfig(CONFIGID.HW_DECODER_ENABLE));
    }

    public void reset() {
        logDebug(TAG, "reset");
        mVideoDuration = 0;
        mVideoWidth = 0;
        mVideoHeight = 0;
        mUIHandler.removeCallbacksAndMessages(null);
        closeInner();
        mCurrrentState = PLAYER_STATE_IDLE;
    }

    public void release() {
        logDebug(TAG, "release");
        mUIHandler.removeCallbacksAndMessages(null);
        clearListener();
        mPlayer.destroy();
        mCurrrentState = PLAYER_STATE_RELEASED;
    }

    private void logDebug(String tag, String msg) {
//        Log.i(tag, getId() + " - " + msg);
    }

    private void setScreenOn() {
        if (mView == null) {
            logDebug(TAG, "setScreenOn, has no view");
            return;
        }
        if (mView.getContext() == null) {
            logDebug(TAG, "setScreenOn, can not get context");
            return;
        }
        if (!(mView.getContext() instanceof Activity)) {
            logDebug(TAG, "setScreenOn, not an activity");
            return;
        }
        ((Activity) mView.getContext()).getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        logDebug(TAG, "setScreenOn");
    }

    private void clearScreenOn() {
        if (mView == null) {
            logDebug(TAG, "clearScreenOn, has no view");
            return;
        }
        if (mView.getContext() == null) {
            logDebug(TAG, "clearScreenOn, can not get context");
            return;
        }
        if (!(mView.getContext() instanceof Activity)) {
            logDebug(TAG, "clearScreenOn, not an activity");
            return;
        }
        ((Activity) mView.getContext()).getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        logDebug(TAG, "clearScreenOn");
    }

    void closeInner() {
        logDebug(TAG, "closeInner, mIsOpenCalled: " + mIsOpenCalled);
        if (mIsOpenCalled) {
            mPlayer.setOnPlayCompleteListener(mOnPlayCompleteListenerWhenClose);
            long id = Thread.currentThread().getId();
            logDebug(TAG, "closeInner, thread id：" + id);
            mPlayer.close();

            mIsClosing = true;
            mIsOpenCalled = false;
        }
    }

    void openInner(final String url) {
        logDebug(TAG, "openInner, url: " + url);
        if (!mIsClosing) {
            if (isMainThread()) {
                mPlayer.open(url);
            } else {
                mUIHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        mPlayer.open(url);
                    }
                });
            }
            mIsOpenCalled = true;
        } else {
            Log.e(TAG, "openInner, can not open when closing");
        }
    }

    void openInner(final FileDescriptor fileDescriptor) {
        logDebug(TAG, "openInner, fileDescriptor, valid: " + fileDescriptor.valid());
        if (!mIsClosing) {
            if (isMainThread()) {
                mPlayer.open(fileDescriptor);
            } else {
                mUIHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        mPlayer.open(fileDescriptor);
                    }
                });
            }
            mIsOpenCalled = true;
        } else {
            Log.e(TAG, "openInner, can not open when closing");
        }
    }

    public void setScreenOnWhilePlaying(boolean screenOn) {
        if (screenOn) {
            setScreenOn();
        } else {
            clearScreenOn();
        }
    }

    public int setConfig(int configID, String value) {
        Integer key = Integer.valueOf(configID);
        String oldValue = mPlayerConfig.get(key);
        if (oldValue != null && oldValue.equals(value)) {
            return 0;
        } else {
            mPlayerConfig.put(key, value);
            int ret = mPlayer.setConfig(configID, value);
            logDebug(TAG, "setConfig, configID : " + configID + " value : " + value + " ret : " + ret);
            return ret;
        }
    }

    public String getConfig(int configID) {
        return mPlayer.getConfig(configID);
    }

    public HashMap<Integer, String> getConfig() {
        return mPlayerConfig;
    }

    public void setConfig(Map<Integer, String> config) {
        if (config != null) {
            Iterator it = config.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<Integer, String> entry = (Map.Entry<Integer, String>) it.next();
                setConfig(entry.getKey(), entry.getValue());
            }
        }
    }

    public int getVideoWidth() {
        return mPlayer.getVideoWidth();
    }

    public int getVideoHeight() {
        return mPlayer.getVideoHeight();
    }

    public int getDuration() {
        return mVideoDuration;
    }

    public int getCurrentPosition() {
        return mPlayer.getPosition();
    }

    public boolean isPlaying() {
        return mCurrrentState == PLAYER_STATE_PLAYING;
    }

    public boolean isLooping() {
        return mIsLooping;
    }

    public void setLooping(boolean looping) {
        mIsLooping = looping;
    }

    public void setOnPreparedListener(OnPreparedListener listener) {
        mOnPreparedListener = listener;
    }

    public void setOnCompletionListener(OnCompletionListener listener) {
        mOnCompletionListener = listener;
    }

    public void setOnBufferingUpdateListener(OnBufferingUpdateListener listener) {
        mOnBufferingUpdateListener = listener;
    }

    public void setOnSeekCompleteListener(OnSeekCompleteListener listener) {
        mOnSeekCompleteListener = listener;
    }

    public void setOnVideoSizeChangedListener(OnVideoSizeChangedListener listener) {
        mOnVideoSizeChangedListener = listener;
    }

    public void setOnErrorListener(OnErrorListener listener) {
        mOnErrorListener = listener;
    }

    public void setOnInfoListener(OnInfoListener listener) {
        mOnInfoListener = listener;
    }

    public void setOnReCreateHwDecoderListener(OnReCreateHwDecoderListener listener) {
        mOnReCreateHwDecoderListener = listener;
    }

    public void setOnShowSubtitleListener(OnShowSubtitleListener listener) {
        mOnShowSubtitleListener = listener;
    }

    /**
     * Interface definition for a callback to be invoked when the media
     * source is ready for playback.
     */
    public interface OnPreparedListener {
        /**
         * Called when the media file is ready for playback.
         *
         * @param mp the MediaPlayer that is ready for playback
         */
        void onPrepared(AMediaPlayer mp);
    }

    /**
     * Interface definition for a callback to be invoked when playback of
     * a media source has completed.
     */
    public interface OnCompletionListener {
        void onCompletion(AMediaPlayer mp);
    }

    /**
     * Interface definition of a callback to be invoked indicating buffering
     * status of a media resource being streamed over the network.
     */
    public interface OnBufferingUpdateListener {
        /**
         * Called to update status in buffering a media stream received through
         * progressive HTTP download. The received buffering percentage
         * indicates how much of the content has been buffered or played.
         * For example a buffering update of 80 percent when half the content
         * has already been played indicates that the next 30 percent of the
         * content to play has been buffered.
         *
         * @param mp      the MediaPlayer the update pertains to
         * @param percent the percentage (0-100) of the content
         *                that has been buffered or played thus far
         */
        void onBufferingUpdate(AMediaPlayer mp, int percent);
    }

    /**
     * Interface definition of a callback to be invoked indicating
     * the completion of a seek operation.
     */
    public interface OnSeekCompleteListener {
        /**
         * Called to indicate the completion of a seek operation.
         *
         * @param mp the MediaPlayer that issued the seek operation
         */
        void onSeekComplete(AMediaPlayer mp);
    }

    /**
     * Interface definition of a callback to be invoked when the
     * video size is first known or updated
     */
    public interface OnVideoSizeChangedListener {
        /**
         * Called to indicate the video size
         * <p>
         * The video size (width and height) could be 0 if there was no video,
         * no display surface was set, or the value was not determined yet.
         *
         * @param mp     the MediaPlayer associated with this callback
         * @param width  the width of the video
         * @param height the height of the video
         */
        void onVideoSizeChanged(AMediaPlayer mp, int width, int height);
    }

    /**
     * Interface definition of a callback to be invoked when there
     * has been an error during an asynchronous operation (other errors
     * will throw exceptions at method call time).
     */
    public interface OnErrorListener {
        /**
         * Called to indicate an error.
         *
         * @param mp    the MediaPlayer the error pertains to
         * @param what  the type of error that has occurred:
         * @param extra an extra code, specific to the error. Typically
         * @return True if the method handled the error, false if it didn't.
         * Returning false, or not having an OnErrorListener at all, will
         * cause the OnCompletionListener to be called.
         */
        boolean onError(AMediaPlayer mp, int what, int extra);
    }

    public interface OnInfoListener {
        boolean onInfo(AMediaPlayer mp, int what, int extra);
    }

    public interface OnFirstFrameRenderListener {
        void onFirstFrameRender(AMediaPlayer mp);
    }

    public interface OnReCreateHwDecoderListener {
        void onReCreateHwDecoder(AMediaPlayer mp);
    }

    public interface OnShowSubtitleListener {
        void onShowSubtitle(AMediaPlayer mp, String subtitleText);
    }
}
