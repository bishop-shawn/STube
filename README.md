# Introduction

This project only supports arm-based Android phones.

# Environment

Follow React Native Document to configure Environment.

got to [react native get start](https://facebook.github.io/react-native/docs/getting-started), and choose `React Native CLI Quickstart`, select Development OS, select Target OS `Android`.


# Get start

1. Clone project

2. Install dependencies
```
npm install
```

# Migrating to AndroidX

Replaces the original support library APIs with packages in the androidx namespace.

Open `project/android` in Android Studio.
Wait for sync finished。
select all Packages, right click `Refactor` -> `Migrating to AndroidX`

This may not migrate all references to AndroidX. You should go to `node_modules` folder, check follow imports.

```java
  // react-native-background-job
  - import android.support.**;
  + import androidx.**;
  // react-native-file-selector
  - import android.support.v4.app.ActivityCompat;
  + import androidx.core.app.ActivityCompat;

  - import android.support.v4.content.ContextCompat;
  + import androidx.core.content.ContextCompat;

  - import android.support.v7.app.AppCompatActivity;
  + import androidx.appcompat.app.AppCompatActivity;
  // react-native-fs
  - import android.support.**;
  + import androidx.**;
  // react-native-view-shot
  - import android.support.**;
  + import androidx.**;
```

# Run debug

```
npm run debug
```

# Pack

```
cd ./android
./gradlew assembleRelease

```
# Project construction

```
├── index.js                // main file
├── doc                     // basic doc
├── package.json            // change your app's version
├── build-instruction.md
├── README.md
├── android
│   ├── app
│   │   ├── build
│   │   │   ├── outputs
│   │   │   │   └── apk      // release APK folder
│   │   ├── src
│   │   │   └── main
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── assets
│   │   │       │   ├── ad.mp4          // player's default ad
│   │   │       │   ├── blacklist.txt   // blacklist configutation(filter webview urls)
│   │   │       │   ├── config.json     // local configurations
│   │   │       │   ├── demo.html       // demo page for home webview
│   │   │       │   ├── fonts
│   │   │       │   └── start.png       // default image for the start ad.
│   │   │       ├── java                // java code
│   │   │       ├── res                 // resources (1)
│   │   └── stube.keystore
└── src
    ├── App.js
    ├── components          // Common component
    ├── constant            // constant
    ├── model               // type def
    ├── pages               // all pages go here
    │   ├── addTaskLink
    │   ├── appQRCode
    │   ├── download
    │   ├── downloadRecords
    │   ├── downloadSetting
    │   ├── downloadingPlayer
    │   ├── homeWebview           // home page(webview)
    │   ├── mine                  // mine page
    │   ├── popularize
    │   ├── popularizeHistory
    │   ├── scanBTFile
    │   ├── search                // search page
    │   ├── setting               // setting page(mine->setting)
    │   ├── start
    │   ├── vodPlayer
    │   ├── watchRecords
    │   └── webEntry
    ├── redux               // redux
    ├── resource            // resources (2)
    ├── sdk
    ├── service             // data acquirement
    │   ├── backgroundService.js
    │   ├── configService.js       // Merge remote and local configurations
    │   ├── downloadService.js
    │   ├── navigationService.js   // global navigation, can use any where
    │   ├── searchRecordService.js
    │   ├── searchTagsService.js
    │   ├── storageService.js
    │   ├── taskStatusService.js
    │   └── watchRecordService.js
    └── util
        ├── baseUtil.js
        ├── request.js
        └── ...
```
