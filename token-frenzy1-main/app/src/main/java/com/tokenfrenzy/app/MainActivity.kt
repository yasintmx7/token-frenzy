package com.tokenfrenzy.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    /**
     * Current in-app state reported by the web layer via JavascriptInterface.
     *
     * Possible values (set by the React app):
     *   "home"     – Play tab / main menu is active
     *   "subtab"   – Rank / Skins / Profile tab is active
     *   "playing"  – Active gameplay session
     *   "gameover" – Game-over screen is showing
     *   "overlay"  – Modal / overlay is open (mint, trial, legal…)
     */
    @Volatile private var appState: String = "home"

    /** Timestamp of the last back-press while on the home screen (for double-press exit). */
    private var lastBackPressTime: Long = 0L
    private val DOUBLE_BACK_EXIT_MS = 2000L

    // ─────────────────────────────────────────────────────────────────────────
    // JavascriptInterface — exposed to the web as `window.Android`
    // ─────────────────────────────────────────────────────────────────────────

    inner class AndroidBridge {
        /**
         * Called from the React app whenever it transitions to a new state.
         * Must be invoked on any thread, but @JavascriptInterface guarantees that.
         */
        @JavascriptInterface
        fun setState(state: String) {
            appState = state
            android.util.Log.d("TokenFrenzy", "App state → $state")
        }

        /** Called by the web when it has finished handling the back action itself. */
        @JavascriptInterface
        fun backHandled() {
            // Nothing extra needed; used as a signal in async JS evaluation flows.
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // onCreate
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        applyImmersiveMode()

        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        webView.setBackgroundColor(Color.BLACK)

        val rootLayout = FrameLayout(this)
        rootLayout.setBackgroundColor(Color.BLACK)
        rootLayout.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(rootLayout)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            databaseEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // Register the bridge BEFORE loading the URL so the JS can call it on startup
        webView.addJavascriptInterface(AndroidBridge(), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                view?.evaluateJavascript("""
                    (function() {
                        function patchButtons() {
                            document.querySelectorAll('button, a, [role="button"]').forEach(function(el) {
                                if (el._patched) return;
                                el._patched = true;
                                el.addEventListener('touchstart', function(e){ e.stopPropagation(); }, {capture:true, passive:false});
                                el.addEventListener('touchend',   function(e){ e.stopPropagation(); }, {capture:true, passive:false});
                            });
                        }
                        patchButtons();
                        new MutationObserver(patchButtons).observe(document.body, {childList:true, subtree:true});
                    })();
                """.trimIndent(), null)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    true
                } catch (e: Exception) { false }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                android.util.Log.e("TokenFrenzy", "WebView error: ${error?.description} for ${request?.url}")
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(msg: ConsoleMessage?): Boolean {
                android.util.Log.d("TokenFrenzy_JS",
                    "[${msg?.messageLevel()}] ${msg?.message()} (${msg?.sourceId()}:${msg?.lineNumber()})")
                return true
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Smart back press
    // ─────────────────────────────────────────────────────────────────────────

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        when (appState) {

            // ── In gameplay ──────────────────────────────────────────────────
            // Inject JS to call the global handler registered by GameCanvas/Game.
            // The React app will pause or navigate back to the menu itself and
            // then call Android.setState("menu") / Android.setState("home").
            "playing" -> {
                webView.evaluateJavascript(
                    "(function(){ if(window.handleAndroidBack) window.handleAndroidBack(); })();",
                    null
                )
            }

            // ── On a sub-tab (Rank / Skins / Profile) or overlay ─────────────
            // Inject JS to navigate back to the Play/home tab.
            "subtab", "overlay", "gameover" -> {
                webView.evaluateJavascript(
                    "(function(){ if(window.handleAndroidBack) window.handleAndroidBack(); })();",
                    null
                )
            }

            // ── On home/play screen ──────────────────────────────────────────
            // First back shows a toast; second back within 2 s exits.
            "home" -> {
                val now = SystemClock.elapsedRealtime()
                if (now - lastBackPressTime < DOUBLE_BACK_EXIT_MS) {
                    super.onBackPressed() // exit
                } else {
                    lastBackPressTime = now
                    Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show()
                }
            }

            // ── Fallback ─────────────────────────────────────────────────────
            else -> {
                if (webView.canGoBack()) webView.goBack()
                else {
                    val now = SystemClock.elapsedRealtime()
                    if (now - lastBackPressTime < DOUBLE_BACK_EXIT_MS) {
                        super.onBackPressed()
                    } else {
                        lastBackPressTime = now
                        Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle helpers
    // ─────────────────────────────────────────────────────────────────────────

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) applyImmersiveMode()
    }

    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        super.onConfigurationChanged(newConfig)
        applyImmersiveMode()
        webView.requestLayout()
    }

    private fun applyImmersiveMode() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
    }
}