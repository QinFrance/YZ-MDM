package com.yz.mdm

import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.ComponentName
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.os.UserManager
import android.provider.Settings

/** Etat du kiosque pour le processus en cours (l'admin peut le suspendre). */
object Kiosk {
    @Volatile var suspended = false
}

object Policy {
    private val INSTALL_RESTRICTIONS = listOf(
        UserManager.DISALLOW_INSTALL_APPS,
        UserManager.DISALLOW_UNINSTALL_APPS,
        UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES,
    )
    private val OTHER_RESTRICTIONS = listOf(
        UserManager.DISALLOW_FACTORY_RESET,
        UserManager.DISALLOW_SAFE_BOOT,
        UserManager.DISALLOW_ADD_USER,
    )

    private fun dpm(c: Context): DevicePolicyManager =
        c.getSystemService(DevicePolicyManager::class.java)

    fun isOwner(c: Context) = dpm(c).isDeviceOwnerApp(c.packageName)

    fun isInstalled(c: Context, pkg: String) =
        c.packageManager.getLaunchIntentForPackage(pkg) != null

    @Suppress("DEPRECATION")
    fun settingsPackage(c: Context): String =
        c.packageManager.resolveActivity(Intent(Settings.ACTION_SETTINGS), 0)
            ?.activityInfo?.packageName ?: "com.android.settings"

    fun allowedPackages(c: Context): List<String> =
        (listOf(c.packageName, settingsPackage(c)) + Config.ZEMER_PACKAGES + Config.EXTRA_ALLOWED_PACKAGES).distinct()

    /** Applique toute la politique. Sans effet si l'app n'est pas Device Owner. */
    fun apply(c: Context): Boolean {
        if (!isOwner(c)) return false
        val d = dpm(c)
        val admin = AdminReceiver.component(c)

        // 1) Kiosque : seules ces apps peuvent rester au premier plan
        d.setLockTaskPackages(admin, allowedPackages(c).toTypedArray())
        if (Build.VERSION.SDK_INT >= 28) {
            // Bouton Accueil (ramène à YZ) + notifications (commandes média). Réglages rapides restent bloqués.
            d.setLockTaskFeatures(
                admin,
                DevicePolicyManager.LOCK_TASK_FEATURE_HOME or DevicePolicyManager.LOCK_TASK_FEATURE_NOTIFICATIONS
            )
        }

        // 2) YZ = launcher permanent
        val home = IntentFilter(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            addCategory(Intent.CATEGORY_DEFAULT)
        }
        d.clearPackagePersistentPreferredActivities(admin, c.packageName)
        d.addPersistentPreferredActivity(admin, home, ComponentName(c, MainActivity::class.java))

        // 3) Restrictions utilisateur
        (INSTALL_RESTRICTIONS + OTHER_RESTRICTIONS).forEach { d.addUserRestriction(admin, it) }
        if (Config.BLOCK_DEBUGGING) d.addUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)
        else d.clearUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)

        // 4) Confort "boîtier musical"
        runCatching { d.setKeyguardDisabled(admin, true) } // échoue si un verrou d'écran existe
        runCatching { d.setPermissionPolicy(admin, DevicePolicyManager.PERMISSION_POLICY_AUTO_GRANT) }
        Config.ZEMER_PACKAGES.forEach { pkg ->
            runCatching { d.setApplicationRestrictions(admin, pkg, restrictionsBundle()) }
            if (Build.VERSION.SDK_INT >= 33) runCatching {
                d.setPermissionGrantState(
                    admin, pkg, "android.permission.POST_NOTIFICATIONS",
                    DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                )
            }
        }
        if (Build.VERSION.SDK_INT >= 30) runCatching {
            // Empêche l'arrêt forcé / l'effacement des données de Zemer depuis les Réglages
            d.setUserControlDisabledPackages(admin, Config.ZEMER_PACKAGES)
        }
        return true
    }

    /** Lève les blocages d'installation (pour mettre à jour Zemer via adb). `apply()` les remet. */
    fun maintenance(c: Context) {
        if (!isOwner(c)) return
        val d = dpm(c)
        val admin = AdminReceiver.component(c)
        INSTALL_RESTRICTIONS.forEach { d.clearUserRestriction(admin, it) }
    }

    /** Retire tout et abandonne le statut Device Owner (évite la réinitialisation d'usine). */
    fun release(c: Context) {
        if (!isOwner(c)) return
        val d = dpm(c)
        val admin = AdminReceiver.component(c)
        (INSTALL_RESTRICTIONS + OTHER_RESTRICTIONS + UserManager.DISALLOW_DEBUGGING_FEATURES)
            .forEach { d.clearUserRestriction(admin, it) }
        d.clearPackagePersistentPreferredActivities(admin, c.packageName)
        d.setLockTaskPackages(admin, emptyArray())
        runCatching { d.setKeyguardDisabled(admin, false) }
        if (Build.VERSION.SDK_INT >= 30) runCatching { d.setUserControlDisabledPackages(admin, emptyList()) }
        @Suppress("DEPRECATION")
        d.clearDeviceOwnerApp(c.packageName)
    }

    private fun restrictionsBundle(): Bundle = Bundle().apply {
        Config.ZEMER_APP_RESTRICTIONS.forEach { (k, v) ->
            when (v) {
                is Boolean -> putBoolean(k, v)
                is String -> putString(k, v)
                is Int -> putInt(k, v)
            }
        }
    }
}
