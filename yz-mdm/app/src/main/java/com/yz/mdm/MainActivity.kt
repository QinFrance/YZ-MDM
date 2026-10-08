package com.yz.mdm

import android.app.Activity
import android.app.ActivityManager
import android.app.AlertDialog
import android.app.PendingIntent
import android.content.pm.PackageInfo
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean
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
    private val updateInProgress = AtomicBoolean(false)

    companion object {
        private const val BUILD_INFO_URL = "https://qinfrance.github.io/YZ-MDM/build-info.json"
        private const val APK_URL = "https://qinfrance.github.io/YZ-MDM/downloads/yz-mdm.apk"
        private const val MAX_APK_BYTES = 300L * 1024L * 1024L
    }

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


    private fun checkForUpdates() {
        if (!updateInProgress.compareAndSet(false, true)) {
            toast("La vérification est déjà en cours")
            return
        }
        toast("Recherche d’une mise à jour…")
        Thread {
            var restoreOwnerPolicy = false
            try {
                val buildInfo = readBuildInfo()
                val latestCode = buildInfo.optLong("versionCode", 0L)
                val latestName = buildInfo.optString("versionName", "")
                if (!buildInfo.optBoolean("releaseReady") ||
                    buildInfo.optString("applicationId") != packageName ||
                    latestCode <= 0L || latestName.isBlank()
                ) {
                    throw IOException("La version disponible ne peut pas être installée.")
                }

                val installed = packageManager.getPackageInfo(packageName, 0)
                val installedCode = packageVersionCode(installed)
                if (latestCode <= installedCode) {
                    runOnUiThread {
                        toast("YiDream est déjà à jour · v${installed.versionName}")
                    }
                    return@Thread
                }

                val apk = downloadUpdate(latestCode)
                val archive = packageManager.getPackageArchiveInfo(apk.absolutePath, 0)
                    ?: throw IOException("Le fichier reçu n’est pas un APK valide.")
                if (archive.packageName != packageName || packageVersionCode(archive) != latestCode) {
                    throw IOException("L’APK ne correspond pas à YiDream ou à la version annoncée.")
                }

                val owner = Policy.isOwner(this)
                if (!owner && Build.VERSION.SDK_INT >= 26 &&
                    !packageManager.canRequestPackageInstalls()
                ) {
                    runOnUiThread {
                        toast("Autorise YiDream à installer des applications, puis relance.")
                        runCatching {
                            startActivity(
                                Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:$packageName")
                                )
                            )
                        }
                    }
                    return@Thread
                }

                if (owner) {
                    Kiosk.suspended = true
                    Policy.maintenance(this)
                    restoreOwnerPolicy = true
                    runOnUiThread { runCatching { stopLockTask() } }
                }
                startUpdateInstall(apk)
                restoreOwnerPolicy = false
                runOnUiThread { toast("Installation de YiDream v$latestName lancée") }
            } catch (error: Exception) {
                if (restoreOwnerPolicy) {
                    runOnUiThread {
                        Kiosk.suspended = false
                        Policy.apply(this)
                        toast("Mise à jour impossible : ${error.message ?: "erreur réseau"}")
                    }
                } else {
                    runOnUiThread {
                        toast("Mise à jour impossible : ${error.message ?: "erreur réseau"}")
                    }
                }
            } finally {
                updateInProgress.set(false)
            }
        }.start()
    }

    private fun readBuildInfo(): JSONObject {
        val connection = openUpdateConnection(BUILD_INFO_URL)
        return try {
            if (connection.responseCode !in 200..299) throw IOException("Site de mise à jour indisponible.")
            connection.inputStream.bufferedReader(Charsets.UTF_8).use { JSONObject(it.readText()) }
        } finally {
            connection.disconnect()
        }
    }

    private fun downloadUpdate(versionCode: Long): File {
        val connection = openUpdateConnection("$APK_URL?v=$versionCode")
        try {
            if (connection.responseCode !in 200..299) throw IOException("Téléchargement de l’APK impossible.")
            if (connection.contentLengthLong > MAX_APK_BYTES) throw IOException("L’APK est trop volumineux.")
            val file = File(cacheDir, "yidream-update-$versionCode.apk")
            connection.inputStream.use { input ->
                file.outputStream().use { output ->
                    val buffer = ByteArray(16 * 1024)
                    var total = 0L
                    while (true) {
                        val count = input.read(buffer)
                        if (count < 0) break
                        total += count
                        if (total > MAX_APK_BYTES) throw IOException("L’APK est trop volumineux.")
                        output.write(buffer, 0, count)
                    }
                }
            }
            if (file.length() < 100_000L) {
                file.delete()
                throw IOException("Le téléchargement de l’APK est incomplet.")
            }
            return file
        } finally {
            connection.disconnect()
        }
    }

    private fun openUpdateConnection(address: String): HttpURLConnection =
        (URL(address).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 45_000
            instanceFollowRedirects = true
            setRequestProperty("Cache-Control", "no-cache")
        }

    @Suppress("DEPRECATION")
    private fun packageVersionCode(info: PackageInfo): Long =
        if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong()

    private fun startUpdateInstall(apk: File) {
        val installer = packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setAppPackageName(packageName)
            setSize(apk.length())
            if (Build.VERSION.SDK_INT >= 31) {
                setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
            }
        }
        val sessionId = installer.createSession(params)
        try {
            installer.openSession(sessionId).use { session ->
                session.openWrite("base.apk", 0, apk.length()).use { output ->
                    apk.inputStream().use { input -> input.copyTo(output) }
                    session.fsync(output)
                }
                val callback = Intent(this, UpdateInstallReceiver::class.java)
                    .setAction(UpdateInstallReceiver.ACTION)
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                    (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
                val pendingIntent = PendingIntent.getBroadcast(this, sessionId, callback, flags)
                session.commit(pendingIntent.intentSender)
            }
        } catch (error: Exception) {
            runCatching { installer.abandonSession(sessionId) }
            throw error
        }
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
        fun checkForUpdates() = runOnUiThread { this@MainActivity.checkForUpdates() }

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
