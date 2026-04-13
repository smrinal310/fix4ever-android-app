This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## 🐳 Docker Setup (Recommended)

**NEW!** This project now supports Docker for consistent development environments!

### Quick Docker Start

```bash
# Start Metro bundler in Docker
docker-compose up -d metro

# Run app on your device
npm run android
```

### Documentation

- **Quick Start:** [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Get started in 5 minutes
- **Full Guide:** [README.Docker.md](./README.Docker.md) - Complete documentation
- **Setup Checklist:** [DOCKER_CHECKLIST.md](./DOCKER_CHECKLIST.md) - Verify your setup
- **Interactive Menu:** Run `./docker-start.sh` for easy Docker management

### Benefits of Using Docker

- ✅ Consistent development environment across all machines
- ✅ No need to install Node.js or Android SDK locally (for builds)
- ✅ Easy CI/CD integration
- ✅ Automated Android APK builds
- ✅ Isolated dependencies and caches

---

## Standard Setup (Without Docker)

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start # or npm start -- --reset-cache 

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

## Docker Issues

If you're using Docker and experiencing issues, see:

- [README.Docker.md - Troubleshooting Section](./README.Docker.md#troubleshooting)
- [DOCKER_CHECKLIST.md](./DOCKER_CHECKLIST.md)

## General Issues

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.


# Debugging in Rract Native

## RN DevTools

- React Native DevTools

```
adb shell input keyevent 82
```

- This command opens react native devtools menu in android phone. 
- Click on `Open DevTools` to open the inspector.


# Resolving Gradle Errors

* ` Could not read workspace metadata ` means gradle cache is corrupted.

```bash
cd android
./gradlew --stop
rm -rf ~/.gradle/caches/
./gradlew clean
```


* `  Execution failed for task ':app:externalNativeBuildCleanDebugOptimized'. `

```
cd android
./gradlew --stop
```

* Remove cached c++ build files

```
rm -rf app/.cxx
```

* Delete the android build folder

```
rm -rf app/build
```

* Resync and build 

```
cd android
./gradlew clean assembleDebug --refresh-dependencies
```

* Why clean didn't work initially

  - Standard  ` ./gradlew clean ` only deletes the build folders; it often ignores the .cxx directory where CMake and Ninja store their configuration.
  - When you deleted the global ~/.gradle/caches folder, the "source of truth" for the fbjni library moved, but the .cxx files were still pointing to the old, deleted location.


# DegubKey

* Generate a new degub key


* Delete the old debug key
```
cd android/app
rm -f debug.keystore
```

* Generate a new debug key
```
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
```

* Clean and rebuild the project.


### ` npx ` not found

```bash
sudo ln -s $(which node) /usr/local/bin/node
sudo ln -s $(which npx) /usr/local/bin/npx
```

* For google maps to work:

Open: `node_modules/react-native-geolocation-service/android/build.gradle`

And change `def DEFAULT_GOOGLE_PLAY_SERVICES_VERSION` value to "21.0.1"

## React Native Config

* Make sure for ` react-native-config ` to work, install version "1.5.6"


# TODO:

send data as json.stringify : mainProblem, subProblem, relationalBehaviors