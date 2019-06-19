# STube

The world’s first blockchain video DAPP open source project.

## Introduction

STube is the first application based on blockchain technology in the field of video. This is a real open platform for video content publishing. It allows all content creators to quickly and efficiently build their own blockchain-specific video DAPP, while supporting multiple digital currencies which could be used to purchase video content. It also provides basic operational strategies for your own distribution.

## Notice

- Min Supported Android Version: 6.0.0

## Customization(First Stage)

- App name & logo
- Launch image
- Main theme color, font color
- The icons of bottom tab navigator
- Advertisement image after launch, support both local file and url
- External link opened by browser when advertisement image is touched
- Home page webview, support native method to show the "Play or Download" dialog
- Filter sensitive words when searching

## Config Steps

Environment require: 
- JDK1.8
- Android SDK

Tools:
- apktool ([Install Instructions](https://ibotpeaches.github.io/Apktool/install/))
- apksigner (Directory: `/Android/Sdk/build-tools/{version}`)

### 1. Decode APK

Decode `stube-app.apk` to `stube-app` directory.

```
apktool d stube-app.apk
```

### 2. Edit Configuration & Replace Images

#### 1) Rename App Name
Open `stube-app/res/values/strings.xml`, search `app_name`, replace the value to your preferred name.

#### 2) Config Home Page & Theme Color
There are several configuration item in `stube-app/assets/config.json`:
- `home_title`: The title of home page.
- `home_urls`: A list of urls which is used to get html page through webview. The list means the program can request next url if previous one is not available.
- `local_storage`: A directory stores download files for this app.
- `launch_ad_image`: A url of image shows after app launch. If empty, the image is same with launch image.
- `launch_ad_link`: A url of html can be opened with native browser when ad image is touched.
- `color_theme`: Main color of the app.
- `color_header`: The background color of page header.
- `color_header_text`: The font color of page header.
- `color_bottom`: The background color of bottom tab  navigator.
- `color_bottom_text`: The font color of bottom tab navigator.
- `color_bottom_text_active`: The font color bottom tab navigator when tab is active.

#### 3) Replace App Icon
Go to `stube-app/res/`, replace `ic_launcher.png` icon which is located in `mipmap-hdpi`, `mipmap-mdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi` respectively.

#### 4) Replace Images
The images can be replace are located `stube-app/res/mipmap-hdpi`.

### 3. Build APK
```
apktool b stube-app -o new-app.apk
```

### 4. Sign APK
Go to `/Android/Sdk/build-tools/{version}`:
```
apksigner sign --ks path/to/stube.keystore --ks-key-alias koala-key-alias path/to/new-app.apk
```
The password is `koala-app`.

## WebView API

Show "Download or Play" dialog:
```javascript
  var data = {
    action: 'dialog',
    name: 'AmazingVideo.mp4', // Full file name
    url: 'magnet:?xt=urn:btih:3BF15D8F0D4863FC2291704398646832F', // Download link. These protocals are supported: HTTP/FTP/MAGNET/ED2K/THUNDER.
    size: 1567663063, // File size, byte.
  };
  
  // Call from javascript：
  window.ReactNativeWebView.postMessage(JSON.stringify(data));
```
The link which request a video/audio file will be download automaticly. 
```html
<a href=“http://.../AmazingVideo.mp4”>AmazingVideo</a>
```
`AmazingVideo.mp4` will be downloaded when this link is touched.
