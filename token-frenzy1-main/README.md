# Token Frenzy Android (Kotlin + WebView)

This project wraps the existing **Token Frenzy** web build (the `dist/` folder) into an Android app using **Kotlin** and **WebView**.

## How it works
- The web build is bundled inside `app/src/main/assets/`.
- The app loads it with `WebViewAssetLoader` using:
  `https://appassets.androidplatform.net/assets/index.html`

## Build / Run
1. Open this folder in **Android Studio**.
2. Let Gradle sync.
3. Press **Run**.

If you want to update the game build later:
- Replace `app/src/main/assets/index.html`
- Replace all files in `app/src/main/assets/*` with the new build output (flatten the build's `dist/assets/*` into this folder).
