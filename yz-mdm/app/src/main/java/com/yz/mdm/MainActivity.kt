package com.yz.mdm

import android.app.Activity
import android.app.ActivityManager
import android.app.AlertDialog
import android.app.PendingIntent
import android.Manifest
import android.media.AudioManager
import android.media.MediaPlayer
import android.view.KeyEvent
import android.app.role.RoleManager
import android.content.res.Configuration
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.content.Context
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
import android.provider.OpenableColumns
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
    private val launcherPreferences by lazy { getSharedPreferences("yidream_launcher", MODE_PRIVATE) }
    private var launcherWebView: WebView? = null
    private val localAudioQueue = mutableListOf<Uri>()
    private var localAudioIndex = -1
    private var localPlayer: MediaPlayer? = null
    companion object {
        private const val REQUEST_LOCAL_AUDIO = 4103
        private const val BUILD_INFO_URL = "https://qinfrance.github.io/YZ-MDM/build-info.json"
        private const val APK_URL = "https://qinfrance.github.io/YZ-MDM/downloads/yz-mdm.apk"
        private const val MAX_APK_BYTES = 300L * 1024L * 1024L
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Policy.apply(this)
        setContentView(buildUi())
        applyImmersiveMode()
        UpdateNotificationJob.createNotificationChannel(this)
        UpdateNotificationJob.schedule(this)
        UpdateNotificationJob.checkNow(this)
        window.decorView.post {
            maybeOfferHomeLauncher()
            if (intent?.action == UpdateNotificationJob.ACTION_INSTALL_UPDATE) checkForUpdates()
            else checkForMandatoryUpdate()
        }
    }

    override fun onResume() {
        super.onResume()
        applyImmersiveMode()
        launcherWebView?.evaluateJavascript("window.dispatchEvent(new Event('yz-system-appearance-changed'))", null)
        launcherWebView?.evaluateJavascript("window.dispatchEvent(new Event('yz-home-returned'))", null)
        if (Policy.isOwner(this)) {
            Policy.suspendNonEssentialApps(this)
            if (!Kiosk.suspended) {
                val am = getSystemService(ActivityManager::class.java)
                if (am.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) {
                    runCatching { startLockTask() }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.action == UpdateNotificationJob.ACTION_INSTALL_UPDATE) checkForUpdates()
    }

    @Deprecated("Activity result API kept compatible with the existing Android 8+ target")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQUEST_LOCAL_AUDIO || resultCode != RESULT_OK || data == null) return
        val selected = buildList {
            data.clipData?.let { clip ->
                for (index in 0 until clip.itemCount) add(clip.getItemAt(index).uri)
            } ?: data.data?.let { add(it) }
        }.distinct()
        if (selected.isEmpty()) return
        localAudioQueue.clear()
        localAudioQueue.addAll(selected)
        localAudioIndex = 0
        selected.forEach { uri -> runCatching {
            contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } }
        playLocalTrack()
    }

    override fun onDestroy() {
        localPlayer?.release()
        localPlayer = null
        super.onDestroy()
    }

    private fun deviceStatusJson(): String {
        val battery = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val rawLevel = battery?.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = battery?.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryPercent = if (rawLevel >= 0 && scale > 0) {
            (rawLevel * 100f / scale).toInt()
        } else {
            runCatching {
                getSystemService(android.os.BatteryManager::class.java)
                    .getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)
            }.getOrDefault(-1).takeIf { it in 0..100 } ?: -1
        }
        val status = battery?.getIntExtra(android.os.BatteryManager.EXTRA_STATUS, -1) ?: -1
        val charging = status == android.os.BatteryManager.BATTERY_STATUS_CHARGING || status == android.os.BatteryManager.BATTERY_STATUS_FULL
        val connectivity = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivity.activeNetwork
        val capabilities = if (activeNetwork != null) connectivity.getNetworkCapabilities(activeNetwork) else null
        return JSONObject()
            .put("batteryPercent", batteryPercent)
            .put("timeMillis", System.currentTimeMillis())
            .put("charging", charging)
            .put("wifi", capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) == true)
            .put("mobile", capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) == true)
            .put("connected", capabilities?.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET) == true)
            .toString()
    }

    @Suppress("SetJavaScriptEnabled")
    private fun buildUi() = WebView(this).apply {
        setBackgroundColor(android.graphics.Color.rgb(8, 8, 11))
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                if (launcherPreferences.getBoolean("force_normal_mode_pending", false)) {
                    launcherPreferences.edit().putBoolean("force_normal_mode_pending", false).apply()
                    view.evaluateJavascript(
                        "localStorage.setItem('yidream-car-mode-auto','false');window.location.reload()",
                        null
                    )
                }
            }
        }
        addJavascriptInterface(WebBridge(), "YZMDM")
        loadUrl("file:///android_asset/index.html")
    }.also { launcherWebView = it }


    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) applyImmersiveMode()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        applyImmersiveMode()
        launcherWebView?.evaluateJavascript("window.dispatchEvent(new Event('orientationchange'));window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('yz-system-appearance-changed'))", null)
    }

    private fun applyImmersiveMode() {
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.apply {
                hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }
    }

    private fun isDefaultHomeLauncher(): Boolean {
        if (Build.VERSION.SDK_INT >= 29) {
            val roles = getSystemService(RoleManager::class.java)
            if (roles.isRoleAvailable(RoleManager.ROLE_HOME)) {
                return roles.isRoleHeld(RoleManager.ROLE_HOME)
            }
        }
        val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        return packageManager.resolveActivity(homeIntent, 0)?.activityInfo?.packageName == packageName
    }

    private fun homeSetupText(fr: String, en: String, he: String, yi: String): String =
        when (java.util.Locale.getDefault().language.lowercase()) {
            "en" -> en
            "he" -> he
            "yi" -> yi
            else -> fr
        }

    private fun maybeOfferHomeLauncher() {
        if (Policy.isOwner(this) || isDefaultHomeLauncher() ||
            launcherPreferences.getBoolean("home_launcher_prompt_shown", false)
        ) return
        launcherPreferences.edit().putBoolean("home_launcher_prompt_shown", true).apply()
        val dialog = AlertDialog.Builder(this)
            .setTitle(homeSetupText("Utiliser YZ comme écran d’accueil ?", "Use YZ as your home screen?", "להשתמש ב‑YZ כמסך הבית?", "YZ אַלס דײַן היים־עקראַן נוצן?"))
            .setMessage(homeSetupText("YZ peut remplacer l’écran d’accueil pour réunir musique et navigation. Android te demandera de confirmer ce choix. Tu pourras le modifier dans les paramètres du téléphone.", "YZ can replace the home screen to keep music and navigation together. Android will ask you to confirm. You can change this later in your phone settings.", "YZ יכול להחליף את מסך הבית כדי לרכז מוזיקה וניווט. Android יבקש ממך לאשר. אפשר לשנות זאת בהגדרות הטלפון.", "YZ קען פֿאַרבײַטן דעם היים־עקראַן, כּדי צונויפֿצושטעלן מוזיק און וועגווײַזער. Android וועט בעטן דײַן באַשטעטיקונג. מ׳קען דאָס שפּעטער ענדערן אין די טעלעפֿאָן־אײַנשטעלונגען."))
            .setPositiveButton(homeSetupText("Choisir YZ", "Choose YZ", "לבחור ב‑YZ", "YZ אויסקלײַבן")) { _, _ -> requestHomeLauncherRole() }
            .setNegativeButton(homeSetupText("Plus tard", "Later", "מאוחר יותר", "שפּעטער"), null)
            .create()
        dialog.show()
    }

    private fun requestHomeLauncherRole() {
        if (Build.VERSION.SDK_INT >= 29) {
            val roles = getSystemService(RoleManager::class.java)
            if (roles.isRoleAvailable(RoleManager.ROLE_HOME)) {
                if (!roles.isRoleHeld(RoleManager.ROLE_HOME)) {
                    startActivityForResult(roles.createRequestRoleIntent(RoleManager.ROLE_HOME), 4102)
                } else {
                    startActivity(Intent(Settings.ACTION_HOME_SETTINGS))
                }
                return
            }
        }
        try {
            startActivity(Intent(Settings.ACTION_HOME_SETTINGS))
        } catch (_: ActivityNotFoundException) {
            startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME))
        }
    }

    private fun isWazeVisible(): Boolean = launcherPreferences.getBoolean("show_waze", true)

    private fun setWazeVisible(visible: Boolean) {
        launcherPreferences.edit().putBoolean("show_waze", visible).apply()
    }

    private fun checkForMandatoryUpdate() {
        Thread {
            try {
                val buildInfo = readBuildInfo()
                val latestCode = buildInfo.optLong("versionCode", 0L)
                val latestName = buildInfo.optString("versionName", "")
                if (!buildInfo.optBoolean("releaseReady") ||
                    !buildInfo.optBoolean("forceUpdate") ||
                    buildInfo.optString("applicationId") != packageName ||
                    latestCode <= 0L || latestName.isBlank()
                ) return@Thread

                val installed = packageManager.getPackageInfo(packageName, 0)
                if (latestCode <= packageVersionCode(installed)) return@Thread

                launcherPreferences.edit().putBoolean("force_normal_mode_pending", true).apply()
                runOnUiThread {
                    launcherWebView?.evaluateJavascript(
                        "localStorage.setItem('yidream-car-mode-auto','false')",
                        null
                    )
                    checkForUpdates()
                }
            } catch (_: Exception) {
                // The normal launcher remains usable; retry on the next app launch.
            }
        }.start()
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
                        toast("YZ est déjà à jour · v${installed.versionName}")
                    }
                    return@Thread
                }

                val apk = downloadUpdate(latestCode)
                val archive = packageManager.getPackageArchiveInfo(apk.absolutePath, 0)
                    ?: throw IOException("Le fichier reçu n’est pas un APK valide.")
                if (archive.packageName != packageName || packageVersionCode(archive) != latestCode) {
                    throw IOException("L’APK ne correspond pas à YZ ou à la version annoncée.")
                }

                val owner = Policy.isOwner(this)
                if (!owner && Build.VERSION.SDK_INT >= 26 &&
                    !packageManager.canRequestPackageInstalls()
                ) {
                    runOnUiThread {
                        toast("Autorise YZ à installer des applications, puis relance.")
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
                runOnUiThread { toast("Installation de YZ v$latestName lancée") }
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

    /** Pulsar shortcut now opens YZ's built-in local audio player; SAF grants access only to files selected by the user. */
    private fun openPulsar() {
        if (localAudioQueue.isNotEmpty()) {
            if (runCatching { localPlayer?.isPlaying == true }.getOrDefault(false)) pauseLocalTrack() else resumeLocalTrack()
            return
        }
        val picker = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "audio/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        runCatching { startActivityForResult(picker, REQUEST_LOCAL_AUDIO) }
            .onFailure { toast("Impossible d’ouvrir la bibliothèque musicale") }
    }

    private fun localTrackTitle(uri: Uri): String = runCatching {
        contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) cursor.getString(0)?.substringBeforeLast('.')?.takeIf(String::isNotBlank)
        }
    }.getOrNull() ?: "Musique locale"

    private fun playLocalTrack() {
        val uri = localAudioQueue.getOrNull(localAudioIndex) ?: return
        localPlayer?.release()
        localPlayer = null
        try {
            localPlayer = MediaPlayer().apply {
                setAudioAttributes(android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build())
                setDataSource(this@MainActivity, uri)
                setOnPreparedListener { player -> player.start(); publishLocalPlayerState() }
                setOnCompletionListener { skipLocalTrack(1) }
                setOnErrorListener { _, _, _ -> toast("Ce fichier audio ne peut pas être lu"); publishLocalPlayerState(); true }
                prepareAsync()
            }
            publishLocalPlayerState()
        } catch (_: Exception) {
            localPlayer?.release()
            localPlayer = null
            toast("Ce fichier audio ne peut pas être lu")
            publishLocalPlayerState()
        }
    }

    private fun resumeLocalTrack() {
        if (localPlayer == null) playLocalTrack()
        else runCatching { localPlayer?.start() }
        publishLocalPlayerState()
    }

    private fun pauseLocalTrack() {
        runCatching { if (localPlayer?.isPlaying == true) localPlayer?.pause() }
        publishLocalPlayerState()
    }

    private fun skipLocalTrack(step: Int) {
        if (localAudioQueue.isEmpty()) return
        localAudioIndex = (localAudioIndex + step + localAudioQueue.size) % localAudioQueue.size
        playLocalTrack()
    }

    private fun handleMediaCommand(command: String) {
        if (localAudioQueue.isEmpty()) {
            if (command == "play") openPulsar() else sendSystemMediaButton(command)
            return
        }
        when (command) {
            "play" -> resumeLocalTrack()
            "pause" -> pauseLocalTrack()
            "previous" -> skipLocalTrack(-1)
            "next" -> skipLocalTrack(1)
        }
    }

    private fun publishLocalPlayerState() {
        val web = launcherWebView ?: return
        val state = JSONObject()
            .put("title", localAudioQueue.getOrNull(localAudioIndex)?.let(::localTrackTitle) ?: "Lecteur audio")
            .put("subtitle", if (localAudioQueue.isEmpty()) "Choisir des fichiers audio" else "Musique locale")
            .put("playing", runCatching { localPlayer?.isPlaying == true }.getOrDefault(false))
            .toString()
        web.post { web.evaluateJavascript("window.setLocalPlayerState && window.setLocalPlayerState($state)", null) }
    }

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

    private fun setAppLanguage(language: String) {
        if (language in setOf("en", "fr", "he", "yi")) {
            launcherPreferences.edit().putString("app_language", language).apply()
        }
    }

    // ---- Accès administrateur : 7 appuis sur le titre YZ dans le tiroir ----

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
        AlertDialog.Builder(this).setTitle("Administration YZ").setItems(items) { _, which ->
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
            .setMessage("Toutes les restrictions seront levées et YZ cessera de gérer l’appareil.")
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
        fun sendMediaButton(command: String) = runOnUiThread {
            this@MainActivity.handleMediaCommand(command)
        }

        @JavascriptInterface
        fun isDeviceOwner(): Boolean = Policy.isOwner(this@MainActivity)

        @JavascriptInterface
        fun isSystemDarkMode(): Boolean =
            (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

        @JavascriptInterface
        fun isWazeVisible(): Boolean = this@MainActivity.isWazeVisible()

        @JavascriptInterface
        fun isWazeInstalled(): Boolean = Policy.isInstalled(this@MainActivity, Config.WAZE_PACKAGE)

        @JavascriptInterface
        fun setWazeVisible(visible: Boolean) = this@MainActivity.setWazeVisible(visible)

        @JavascriptInterface
        fun openHomeRoleSettings() = runOnUiThread { requestHomeLauncherRole() }

        @JavascriptInterface
        fun checkForUpdates() = runOnUiThread { this@MainActivity.checkForUpdates() }

        @JavascriptInterface
        fun setAppLanguage(language: String) = this@MainActivity.setAppLanguage(language)

        @JavascriptInterface
        fun getDeviceStatus(): String = this@MainActivity.deviceStatusJson()

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
        fun requestOwnerExitCode() = runOnUiThread { this@MainActivity.requestOwnerExitCode() }
    }

    private fun requestOwnerExitCode() {
        if (!Policy.isOwner(this)) {
            toast("Le mode appareil dédié n’est pas actif")
            return
        }
        if (!Pin.isSet(this)) {
            toast("Aucun code administrateur n’est configuré. Configurez d’abord le code dans l’accès administrateur.")
            return
        }
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "Code administrateur"
        }
        AlertDialog.Builder(this)
            .setTitle("Désactiver le mode dédié")
            .setMessage("Saisissez le code administrateur pour retirer le Device Owner et ses restrictions.")
            .setView(input)
            .setPositiveButton("Désactiver") { _, _ ->
                if (!Pin.check(this, input.text.toString())) {
                    toast("Code incorrect")
                    return@setPositiveButton
                }
                Kiosk.suspended = true
                runCatching { stopLockTask() }
                Policy.release(this)
                toast(if (Policy.isOwner(this)) "Impossible de retirer le Device Owner" else "Device Owner retiré · restrictions désactivées")
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    private fun sendSystemMediaButton(command: String) {
        val keyCode = when (command) {
            "play" -> KeyEvent.KEYCODE_MEDIA_PLAY
            "pause" -> KeyEvent.KEYCODE_MEDIA_PAUSE
            "previous" -> KeyEvent.KEYCODE_MEDIA_PREVIOUS
            "next" -> KeyEvent.KEYCODE_MEDIA_NEXT
            else -> return
        }
        val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        runCatching {
            audio.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            audio.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
        }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
