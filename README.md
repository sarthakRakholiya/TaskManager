# Task Manager

A modern, cross-platform task management application built with React Native. Manage your tasks efficiently with features like authentication, task creation, completion tracking, and push notifications.

## 📱 Features

- **User Authentication**: Secure sign up and sign in using Firebase Authentication
- **Task Management**: Create, read, update, and delete tasks
- **Task Details**: View detailed information about each task including:
  - Title and description
  - Due date
  - Priority levels (low, medium, high)
  - Category classification
  - Completion status
- **Push Notifications**: Receive notifications for task creation and completion
- **Real-time Sync**: Tasks are synced in real-time using Firebase Firestore
- **User Profile**: View and manage your profile information
- **Modern UI**: Clean and intuitive interface with bottom tab navigation

## 🛠 Tech Stack

- **React Native** (0.81.0) - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Firebase** - Backend services:
  - Firebase Authentication - User authentication
  - Cloud Firestore - Real-time database
  - Firebase Cloud Messaging - Push notifications
- **React Navigation** - Navigation library
- **React Hook Form** - Form handling and validation
- **Notifee** - Local notifications
- **React Native Toast Message** - Toast notifications

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (>= 18) - [Download Node.js](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **React Native CLI** - [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment)
- **Android Studio** (for Android development) - [Download Android Studio](https://developer.android.com/studio)
- **Xcode** (for iOS development, macOS only) - [Download Xcode](https://developer.apple.com/xcode/)
- **Firebase Project** - Set up a Firebase project and configure:
  - `google-services.json` for Android (place in `android/app/`)
  - `GoogleService-Info.plist` for iOS (place in `ios/TaskManager/`)

## 🚀 Getting Started

### 1. Clone the Repository

```sh
git clone <repository-url>
cd TaskManager
```

### 2. Install Dependencies

```sh
# Using npm
npm install

# OR using Yarn
yarn install
```

### 3. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Download configuration files:
   - **Android**: Download `google-services.json` and place it in `android/app/`
   - **iOS**: Download `GoogleService-Info.plist` and place it in `ios/TaskManager/`

### 4. Install iOS Dependencies (iOS only)

For iOS, you need to install CocoaPods dependencies:

```sh
# Install CocoaPods (first time only)
bundle install

# Install iOS dependencies
cd ios
bundle exec pod install
cd ..
```

## ▶️ Running the App

### Start Metro Bundler

First, start the Metro bundler in one terminal:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

### Run on Android

Open a new terminal and run:

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

Make sure you have:

- An Android emulator running, OR
- A physical Android device connected with USB debugging enabled

### Run on iOS

Open a new terminal and run:

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

Make sure you have:

- Xcode installed (macOS only)
- An iOS Simulator available, OR
- A physical iOS device connected

## 📁 Project Structure

```
TaskManager/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AddTaskModal.tsx
│   │   └── icons/
│   ├── routes/              # Navigation configuration
│   │   ├── appstack.tsx     # Authenticated app navigation
│   │   ├── authstack.tsx    # Authentication screens navigation
│   │   └── bottomtabs.tsx   # Bottom tab navigation
│   ├── screens/             # Screen components
│   │   ├── app/             # Authenticated screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── TaskDetailScreen.tsx
│   │   └── auth/            # Authentication screens
│   │       ├── LoginScreen.tsx
│   │       └── RegisterScreen.tsx
│   └── services/            # Business logic and API calls
│       ├── authService.js   # Authentication service
│       ├── taskService.js   # Task management service
│       └── notificationService.js  # Push notification service
├── android/                 # Android native code
├── ios/                     # iOS native code
└── App.tsx                  # Root component
```

## 🔧 Available Scripts

- `npm start` or `yarn start` - Start Metro bundler
- `npm run android` or `yarn android` - Run on Android
- `npm run ios` or `yarn ios` - Run on iOS
- `npm test` or `yarn test` - Run tests
- `npm run lint` or `yarn lint` - Run ESLint

## 🔄 Hot Reload

The app supports Fast Refresh. When you save changes:

- The app will automatically update with your changes
- For a full reload:
  - **Android**: Press `R` twice or `Ctrl/Cmd + M` → Reload
  - **iOS**: Press `R` in the simulator

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache and restart

   ```sh
   npm start -- --reset-cache
   ```

2. **Android build errors**: Clean and rebuild

   ```sh
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

3. **iOS build errors**: Clean build folder in Xcode and reinstall pods

   ```sh
   cd ios
   bundle exec pod install
   cd ..
   ```

4. **Firebase configuration errors**: Ensure configuration files are in the correct locations and Firebase project is properly set up.

For more troubleshooting help, see the [React Native Troubleshooting Guide](https://reactnative.dev/docs/troubleshooting).
