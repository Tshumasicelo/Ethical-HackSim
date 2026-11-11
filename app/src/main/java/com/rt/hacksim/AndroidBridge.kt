package com.rt.hacksim

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import androidx.core.content.edit

/**
 * The only native surface the web game can reach: saving progress and haptics.
 * Methods run on a WebView background thread, so they stay small and thread-safe.
 */
class AndroidBridge(context: Context) {
    private val appContext = context.applicationContext
    private val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (appContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            appContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    @JavascriptInterface
    fun vibrate(ms: Int) {
        val duration = ms.coerceIn(1, MAX_VIBRATION_MS).toLong()
        val vib = vibrator ?: return
        if (!vib.hasVibrator()) return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vib.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(duration)
            }
        } catch (_: Exception) {
            // Haptics are decoration. A device quirk must never crash the game.
        }
    }

    @JavascriptInterface
    fun saveProgress(json: String) {
        if (json.length > MAX_SAVE_CHARS) return
        prefs.edit { putString(KEY_PROGRESS, json) }
    }

    @JavascriptInterface
    fun loadProgress(): String = prefs.getString(KEY_PROGRESS, "") ?: ""

    private companion object {
        const val PREFS_NAME = "hacksim_progress"
        const val KEY_PROGRESS = "progress_v2"
        const val MAX_VIBRATION_MS = 500
        const val MAX_SAVE_CHARS = 200_000
    }
}
