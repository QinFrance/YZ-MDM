package com.yz.mdm

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class UpdateNotificationJob : JobService() {
    override fun onStartJob(params: JobParameters): Boolean {
        if (!checkRunning.compareAndSet(false, true)) return false
        Thread {
            try {
                checkForUpdate(applicationContext)
            } finally {
                checkRunning.set(false)
                jobFinished(params, false)
            }
        }.start()
        return true
    }

    override fun onStopJob(params: JobParameters): Boolean = true

    companion object {
        const val ACTION_INSTALL_UPDATE = "com.yz.mdm.action.INSTALL_UPDATE_NOTIFICATION"
        private const val JOB_ID = 8208
        private const val CHANNEL_ID = "yidream_updates"
        private const val NOTIFICATION_ID = 8208
        private const val BUILD_INFO_URL = "https://qinfrance.github.io/YZ-MDM/build-info.json"
        private val checkRunning = AtomicBoolean(false)

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val manager = context.getSystemService(NotificationManager::class.java)
            if (manager.getNotificationChannel(CHANNEL_ID) != null) return
            val language = preferredLanguage(context)
            val channelName = when (language) {
                "en" -> "YiDream updates"
                "he" -> "עדכוני YiDream"
                "yi" -> "YiDream־דערהייַנטיקונגען"
                else -> "Mises à jour YiDream"
            }
            val channelDescription = when (language) {
                "en" -> "Alerts when a new YiDream version is ready."
                "he" -> "התראות כשגרסה חדשה של YiDream זמינה."
                "yi" -> "באַנאַכריכטונגען ווען אַ נײַע YiDream־ווערסיע איז גרייט."
                else -> "Alertes lorsqu’une nouvelle version de YiDream est disponible."
            }
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = channelDescription
                }
            )
        }

        fun schedule(context: Context) {
            val scheduler = context.getSystemService(JobScheduler::class.java)
            if (scheduler.getPendingJob(JOB_ID) != null) return
            val job = JobInfo.Builder(JOB_ID, ComponentName(context, UpdateNotificationJob::class.java))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPersisted(true)
                .setPeriodic(TimeUnit.HOURS.toMillis(12))
                .build()
            scheduler.schedule(job)
        }

        fun checkNow(context: Context) {
            if (!checkRunning.compareAndSet(false, true)) {
                android.os.Handler(context.mainLooper).postDelayed({ checkNow(context.applicationContext) }, 2_000L)
                return
            }
            Thread {
                try {
                    checkForUpdate(context.applicationContext)
                } finally {
                    checkRunning.set(false)
                }
            }.start()
        }

        private fun checkForUpdate(context: Context) {
            try {
                val connection = URL(BUILD_INFO_URL).openConnection() as HttpURLConnection
                val buildInfo = try {
                    connection.connectTimeout = 12_000
                    connection.readTimeout = 15_000
                    connection.setRequestProperty("Cache-Control", "no-cache")
                    if (connection.responseCode !in 200..299) return
                    if (connection.contentLengthLong > 64_000L) return
                    connection.inputStream.bufferedReader(Charsets.UTF_8).use { JSONObject(it.readText()) }
                } finally {
                    connection.disconnect()
                }

                val latestCode = buildInfo.optLong("versionCode", 0L)
                val versionName = buildInfo.optString("versionName", "")
                if (!buildInfo.optBoolean("releaseReady") ||
                    buildInfo.optString("applicationId") != context.packageName ||
                    latestCode <= 0L || versionName.isBlank()
                ) return

                @Suppress("DEPRECATION")
                val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                val installedCode = if (Build.VERSION.SDK_INT >= 28) {
                    packageInfo.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    packageInfo.versionCode.toLong()
                }
                if (latestCode <= installedCode) return

                val manager = context.getSystemService(NotificationManager::class.java)
                if (Build.VERSION.SDK_INT >= 33 &&
                    context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                ) return
                if (!manager.areNotificationsEnabled()) return

                val preferences = context.getSharedPreferences("yidream_launcher", Context.MODE_PRIVATE)
                if (preferences.getLong("update_notification_version_code", 0L) >= latestCode) return

                createNotificationChannel(context)
                val copy = notificationCopy(preferredLanguage(context), versionName)
                val openIntent = Intent(context, MainActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                val openPending = PendingIntent.getActivity(
                    context,
                    NOTIFICATION_ID,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val installIntent = Intent(context, MainActivity::class.java)
                    .setAction(ACTION_INSTALL_UPDATE)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                val installPending = PendingIntent.getActivity(
                    context,
                    NOTIFICATION_ID + 1,
                    installIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val notification = Notification.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_update_notice)
                    .setContentTitle(copy[0])
                    .setContentText(copy[1])
                    .setStyle(Notification.BigTextStyle().bigText(copy[1]))
                    .setContentIntent(openPending)
                    .setAutoCancel(true)
                    .addAction(android.R.drawable.stat_sys_download_done, copy[2], installPending)
                    .build()
                manager.notify(NOTIFICATION_ID, notification)
                preferences.edit().putLong("update_notification_version_code", latestCode).apply()
            } catch (_: Exception) {
                // Network failures are retried at the next scheduled or foreground check.
            }
        }

        private fun preferredLanguage(context: Context): String {
            val selected = context.getSharedPreferences("yidream_launcher", Context.MODE_PRIVATE)
                .getString("app_language", null)
            return selected?.takeIf { it in setOf("en", "fr", "he", "yi") }
                ?: Locale.getDefault().language.takeIf { it in setOf("en", "fr", "he", "yi") }
                ?: "fr"
        }

        private fun notificationCopy(language: String, version: String): List<String> = when (language) {
            "en" -> listOf(
                "YiDream update available",
                "Version " + version + " is ready to install.",
                "Install"
            )
            "he" -> listOf(
                "עדכון YiDream חדש זמין",
                "גרסה " + version + " מוכנה להתקנה.",
                "התקנה"
            )
            "yi" -> listOf(
                "אַ נײַע YiDream־דערהייַנטיקונג איז גרייט",
                "די ווערסיע " + version + " איז גרייט צו אינסטאַלירן.",
                "אינסטאַלירן"
            )
            else -> listOf(
                "Nouvelle mise à jour YiDream",
                "La version " + version + " est prête à installer.",
                "Installer"
            )
        }
    }
}
