

### 🔹 Run Backend Server (Standard / Localhost)

# Python Virtual Environment (.venv) ke saath FastAPI server start karne ke liye:
.\.venv\Scripts\uvicorn main:app --reload


### 🔹 Run Backend Server for Mobile Access (Network Host)

# Mobile physical device ya emulator se connect karne ke liye local network host par server chalayein:
.\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000


## 📱 2. React Native Expo Frontend Commands

### 🔹 Start Expo App (Development Server)

# Expo development server (Metro bundler) start karne ke liye:
npx expo start

### 🔹 Start Expo App with Clear Cache (Fix Metro Errors)

# Agar Metro bundler cache issue ya file watcher error aaye:
npx expo start -c



### 🔹 Expo / React Native Packages Install

# Naya frontend/Expo module install karne ke liye:
npx expo install <package_name>


---

## 📦 3. Build & Run Commands for Sharing (Android & iOS)

### 🔹 Android Release Variant (Simple Expo Command)

# Android Release APK build karne aur device/emulator par chalane ke liye:
npx expo run:android --variant release

# 📍 Generated Release APK Path (Sharing ke liye):
# android/app/build/outputs/apk/release/app-release.apk


### 🔹 iOS Release Configuration (Simple Expo Command)

# iOS Release build chalane ke liye (Mac / Xcode Required):
npx expo run:ios --configuration Release


