package com.yz.mdm

import android.app.Activity
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.provider.Settings
import android.text.InputType
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast

class MainActivity : Activity() {
    private var taps = 0
    private var lastTap = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Policy.apply(this)
        setContentView(buildUi())
    }

    override fun onResume() {
        super.onResume()
        if (Policy.isOwner(this) && !Kiosk.suspended) {
            val am = getSystemService(ActivityManager::class.java)
            if (am.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) {
                runCatching { startLockTask() }
            }
        }
    }

    @Suppress("SetJavaScriptEnabled")
    private fun buildUi() = WebView(this).apply {
        setBackgroundColor(android.graphics.Color.rgb(8, 8, 11))
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        webViewClient = WebViewClient()
        addJavascriptInterface(WebBridge(), "YZMDM")
        loadUrl("file:///android_asset/index.html")
    }

    private fun openPackage(pkg: String, appName: String) {
        val intent = packageManager.getLaunchIntentForPackage(pkg)
        if (intent == null) {
            toast("Installe d’abord $appName sur cet appareil")
            return
        }
        try {
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            toast("$appName ne peut pas être ouvert")
        }
    }

    private fun openZemer() = openPackage(Config.ZEMER_PACKAGES.first(), "Zemer")
    private fun openWaze() = openPackage(Config.WAZE_PACKAGE, "Waze")
    private fun openPulsar() = openPackage(Config.PULSAR_PACKAGE, "Pulsar")

    private fun openBluetoothSettings() {
        try {
            startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
        } catch (_: ActivityNotFoundException) {
            openSettings()
        }
    }

    private fun openSoundSettings() {
        try {
            startActivity(Intent(Settings.ACTION_SOUND_SETTINGS))
        } catch (_: ActivityNotFoundException) {
            openSettings()
        }
    }

    private fun openSettings() {
        try {
            startActivity(Intent(Settings.ACTION_SETTINGS))
        } catch (_: ActivityNotFoundException) {
            toast("Réglages indisponibles")
        }
    }

    // ---- Accès administrateur : 7 appuis sur le titre YiDream dans le tiroir ----

    private fun onTitleTap() {
        val now = SystemClock.elapsedRealtime()
        taps = if (now - lastTap > 3000) 1 else taps + 1
        lastTap = now
        if (taps >= 7) {
            taps = 0
            askPin()
        }
    }

    private fun askPin() {
        val hasPin = Pin.isSet(this)
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "4 chiffres minimum"
        }
        AlertDialog.Builder(this)
            .setTitle(if (hasPin) "Code administrateur" else "Créer le code administrateur")
            .setView(input)
            .setPositiveButton("OK") { _, _ ->
                val pin = input.text.toString()
                when {
                    !hasPin && pin.length >= 4 -> {
                        Pin.set(this, pin)
                        adminMenu()
                    }
                    !hasPin -> toast("4 chiffres minimum")
                    Pin.check(this, pin) -> adminMenu()
                    else -> toast("Code incorrect")
                }
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    private fun adminMenu() {
        val items = arrayOf(
            "Réappliquer la politique et reprendre le kiosque",
            "Quitter le kiosque (jusqu’à la prochaine réapplication)",
            "Mode maintenance (autoriser les installations ADB)",
            "Retirer le Device Owner (tout débloquer)",
            "Fermer",
        )
        AlertDialog.Builder(this).setTitle("Administration YiDream").setItems(items) { _, which ->
            when (which) {
                0 -> {
                    Kiosk.suspended = false
                    Policy.apply(this)
                    onResume()
                    toast("Politique appliquée")
                }
                1 -> {
                    Kiosk.suspended = true
                    runCatching { stopLockTask() }
                    toast("Kiosque suspendu")
                }
                2 -> {
                    Policy.maintenance(this)
                    toast("Installations autorisées")
                }
                3 -> confirmRelease()
            }
        }.show()
    }

    private fun confirmRelease() {
        AlertDialog.Builder(this)
            .setTitle("Retirer le Device Owner ?")
            .setMessage("Toutes les restrictions seront levées et YiDream cessera de gérer l’appareil.")
            .setPositiveButton("Retirer") { _, _ ->
                Kiosk.suspended = true
                runCatching { stopLockTask() }
                Policy.release(this)
                toast("Device Owner retiré")
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    inner class WebBridge {
        @JavascriptInterface
        fun openZemer() = runOnUiThread { this@MainActivity.openZemer() }

        @JavascriptInterface
        fun openWaze() = runOnUiThread { this@MainActivity.openWaze() }

        @JavascriptInterface
        fun openPulsar() = runOnUiThread { this@MainActivity.openPulsar() }

        @JavascriptInterface
        fun openBluetoothSettings() = runOnUiThread { this@MainActivity.openBluetoothSettings() }

        @JavascriptInterface
        fun openSoundSettings() = runOnUiThread { this@MainActivity.openSoundSettings() }

        @JavascriptInterface
        fun openSettings() = runOnUiThread { this@MainActivity.openSettings() }

        @JavascriptInterface
        fun adminTap() = runOnUiThread { onTitleTap() }

        @JavascriptInterface
        fun submitExitCode(code: String) = runOnUiThread {
            toast("La validation du code quotidien n’est pas encore connectée")
        }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
