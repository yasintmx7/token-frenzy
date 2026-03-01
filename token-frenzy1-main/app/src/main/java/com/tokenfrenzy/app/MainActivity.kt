package com.tokenfrenzy.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var wallet: SolanaWallet

    @Volatile private var appState: String = "home"
    private var lastBackPressTime: Long = 0L
    private val DOUBLE_BACK_EXIT_MS = 2000L

    // ─────────────────────────────────────────────────────────────────────────
    // AndroidBridge — exposed to the web layer as window.Android
    //
    // This is the ONLY correct way to do wallet operations from a WebView.
    // The JavaScript MWA adapter cannot launch intent:// URIs from a WebView,
    // so we expose the native Kotlin MWA SDK directly to JavaScript.
    // ─────────────────────────────────────────────────────────────────────────

    inner class AndroidBridge {

        @JavascriptInterface
        fun setState(state: String) {
            appState = state
            android.util.Log.d("TokenFrenzy", "App state → $state")
        }

        @JavascriptInterface
        fun backHandled() {}

        /**
         * Called by the web layer when user clicks "CONNECT WALLET".
         * Uses native MWA SDK to open the wallet picker (Phantom/Solflare/Seeker).
         * On success: injects JS to set the wallet address in the React app.
         * On failure: injects JS to show an error.
         */
        @JavascriptInterface
        fun connectWallet() {
            android.util.Log.d("TokenFrenzy", "connectWallet() called from JS")
            wallet.connect(
                onSuccess = { address ->
                    android.util.Log.d("TokenFrenzy", "Wallet connected: $address")
                    // Inject the address into the web layer
                    runOnUiThread {
                        webView.evaluateJavascript(
                            """
                            (function(){
                                if(window.__onNativeWalletConnected) {
                                    window.__onNativeWalletConnected('$address');
                                } else {
                                    console.log('[NativeWallet] Connected: $address (no handler registered yet)');
                                    window.__nativeWalletAddress = '$address';
                                }
                            })();
                            """.trimIndent(), null
                        )
                    }
                },
                onError = { error ->
                    android.util.Log.e("TokenFrenzy", "Wallet connect error: $error")
                    runOnUiThread {
                        webView.evaluateJavascript(
                            """
                            (function(){
                                if(window.__onNativeWalletError) {
                                    window.__onNativeWalletError('${error.replace("'", "\\'")}');
                                }
                                console.error('[NativeWallet] Error: ${error.replace("'", "\\'")}');
                            })();
                            """.trimIndent(), null
                        )
                    }
                }
            )
        }

        /** Returns the connected wallet address, or empty string. */
        @JavascriptInterface
        fun getWalletAddress(): String {
            return wallet.walletAddress ?: ""
        }

        /** Returns true if a wallet is connected. */
        @JavascriptInterface
        fun isWalletConnected(): Boolean {
            return wallet.isConnected
        }

        /** Disconnect the current wallet. */
        @JavascriptInterface
        fun disconnectWallet() {
            android.util.Log.d("TokenFrenzy", "disconnectWallet() called from JS")
            wallet.disconnect()
            runOnUiThread {
                webView.evaluateJavascript(
                    "(function(){ if(window.__onNativeWalletDisconnected) window.__onNativeWalletDisconnected(); })();",
                    null
                )
            }
        }

        /**
         * Send SOL to a destination address.
         * Results are returned via window.__onNativeTxSuccess / __onNativeTxError callbacks.
         */
        @JavascriptInterface
        fun sendSol(to: String, amount: Double) {
            android.util.Log.d("TokenFrenzy", "sendSol($to, $amount) called from JS")
            wallet.sendSol(
                recipientAddress = to,
                amountInSol = amount,
                onSuccess = { signature ->
                    android.util.Log.d("TokenFrenzy", "sendSol success: $signature")
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "(function(){ if(window.__onNativeTxSuccess) window.__onNativeTxSuccess('$signature'); })();",
                            null
                        )
                    }
                },
                onError = { error ->
                    android.util.Log.e("TokenFrenzy", "sendSol error: $error")
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "(function(){ if(window.__onNativeTxError) window.__onNativeTxError('${error.replace("'", "\\'")}'); })();",
                            null
                        )
                    }
                }
            )
        }

        /**
         * Mint Game Pass — pays 0.0025 SOL + mints NFT via Helius.
         * Results via window.__onNativeMintSuccess / __onNativeMintError callbacks.
         */
        @JavascriptInterface
        fun mintGamePass() {
            android.util.Log.d("TokenFrenzy", "mintGamePass() called from JS")
            wallet.mintGamePass(
                onSuccess = { result ->
                    android.util.Log.d("TokenFrenzy", "mintGamePass result: $result")
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "(function(){ if(window.__onNativeMintSuccess) window.__onNativeMintSuccess('$result'); })();",
                            null
                        )
                    }
                },
                onError = { error ->
                    android.util.Log.e("TokenFrenzy", "mintGamePass error: $error")
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "(function(){ if(window.__onNativeMintError) window.__onNativeMintError('${error.replace("'", "\\'")}'); })();",
                            null
                        )
                    }
                }
            )
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // onCreate
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize native wallet
        wallet = SolanaWallet(this)

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
            // Enable window.open() for any web SDK that uses it
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
        }

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
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
                val scheme = url.scheme ?: ""

                android.util.Log.d("TokenFrenzy_NAV", "shouldOverrideUrlLoading: $url")

                // Local assets
                if (url.host == "appassets.androidplatform.net") return false

                // intent:// URIs — used by MWA protocol
                if (scheme == "intent") {
                    try {
                        val intent = Intent.parseUri(url.toString(), Intent.URI_INTENT_SCHEME)
                        intent.addCategory(Intent.CATEGORY_BROWSABLE)
                        intent.component = null
                        intent.selector = null
                        startActivity(intent)
                        android.util.Log.d("TokenFrenzy_NAV", "Launched intent:// URI OK")
                        return true
                    } catch (e: Exception) {
                        android.util.Log.e("TokenFrenzy_NAV", "Failed intent:// URI: $e")
                    }
                }

                // Wallet deep-link schemes
                if (scheme in listOf("solana-wallet", "phantom", "solflare")) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, url))
                        return true
                    } catch (e: Exception) {
                        android.util.Log.e("TokenFrenzy_NAV", "No app for $scheme: $e")
                    }
                }

                // All other external URLs
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

            // Handle window.open() — fallback for any JS library that uses it
            override fun onCreateWindow(
                view: WebView,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?
            ): Boolean {
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                val tempView = WebView(this@MainActivity)
                tempView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        v: WebView, r: WebResourceRequest
                    ): Boolean {
                        val url = r.url
                        val scheme = url.scheme ?: ""
                        android.util.Log.d("TokenFrenzy_MWA", "window.open → $url")

                        if (scheme == "intent") {
                            try {
                                val intent = Intent.parseUri(url.toString(), Intent.URI_INTENT_SCHEME)
                                intent.addCategory(Intent.CATEGORY_BROWSABLE)
                                intent.component = null
                                intent.selector = null
                                startActivity(intent)
                            } catch (e: Exception) {
                                android.util.Log.e("TokenFrenzy_MWA", "intent:// error: $e")
                            }
                            tempView.destroy()
                            return true
                        }

                        if (scheme in listOf("solana-wallet", "phantom", "solflare", "backpack")) {
                            try {
                                startActivity(Intent(Intent.ACTION_VIEW, url))
                            } catch (e: Exception) {
                                android.util.Log.e("TokenFrenzy_MWA", "No wallet: $e")
                                Toast.makeText(this@MainActivity,
                                    "No wallet app found. Install Phantom or Solflare.",
                                    Toast.LENGTH_LONG).show()
                            }
                            tempView.destroy()
                            return true
                        }

                        try { startActivity(Intent(Intent.ACTION_VIEW, url)) } catch (_: Exception) {}
                        tempView.destroy()
                        return true
                    }
                }
                transport.webView = tempView
                resultMsg.sendToTarget()
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
            "playing" -> {
                webView.evaluateJavascript(
                    "(function(){ if(window.handleAndroidBack) window.handleAndroidBack(); })();", null)
            }
            "subtab", "overlay", "gameover" -> {
                webView.evaluateJavascript(
                    "(function(){ if(window.handleAndroidBack) window.handleAndroidBack(); })();", null)
            }
            "home" -> {
                val now = SystemClock.elapsedRealtime()
                if (now - lastBackPressTime < DOUBLE_BACK_EXIT_MS) {
                    super.onBackPressed()
                } else {
                    lastBackPressTime = now
                    Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show()
                }
            }
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

    override fun onResume() {
        super.onResume()
        applyImmersiveMode()
        // Re-sync wallet state after returning from wallet app
        if (::webView.isInitialized && wallet.isConnected) {
            val addr = wallet.walletAddress ?: return
            webView.evaluateJavascript(
                "(function(){ if(window.__onNativeWalletConnected) window.__onNativeWalletConnected('$addr'); })();",
                null
            )
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

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