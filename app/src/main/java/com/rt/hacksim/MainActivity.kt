package com.rt.hacksim

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )

        setContentView(
            androidx.compose.ui.platform.ComposeView(this).apply {
                setContent {
                    val webViewHolder = remember { mutableStateOf<WebView?>(null) }

                    val view = LocalView.current
                    DisposableEffect(Unit) {
                        view.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        onDispose { }
                    }

                    AndroidView(
                        modifier = Modifier.fillMaxSize().background(Color(0xFF0B0F12)),
                        factory = { context ->
                            WebView(context).apply {
                                webViewClient = WebViewClient()
                                webChromeClient = WebChromeClient()
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                settings.allowFileAccess = true
                                settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                                settings.setSupportZoom(false)
                                settings.builtInZoomControls = false
                                settings.displayZoomControls = false
                                settings.textZoom = 100
                                addJavascriptInterface(AndroidBridge(context), "AndroidBridge")
                                loadUrl("file:///android_asset/index.html")
                                webViewHolder.value = this
                            }
                        }
                    )

                    BackHandler(enabled = (webViewHolder.value?.canGoBack() == true)) {
                        webViewHolder.value?.goBack()
                    }
                }
            }
        )
    }
}