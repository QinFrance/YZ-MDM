package com.yz.mdm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.widget.Toast

class UpdateInstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                val confirmation = pendingUserAction(intent)
                if (confirmation != null) {
                    confirmation.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    runCatching { context.startActivity(confirmation) }
                } else {
                    Toast.makeText(context, "Confirme l’installation dans Android", Toast.LENGTH_LONG).show()
                }
            }
            PackageInstaller.STATUS_SUCCESS -> {
                restoreDevicePolicy(context)
                Toast.makeText(context, "YiDream a été mis à jour", Toast.LENGTH_LONG).show()
            }
            else -> {
                restoreDevicePolicy(context)
                val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)
                    ?.takeIf { it.isNotBlank() } ?: "Installation refusée"
                Toast.makeText(context, "Mise à jour non terminée : $message", Toast.LENGTH_LONG).show()
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun pendingUserAction(intent: Intent): Intent? =
        if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
        } else {
            intent.getParcelableExtra(Intent.EXTRA_INTENT)
        }

    private fun restoreDevicePolicy(context: Context) {
        if (Policy.isOwner(context)) {
            Kiosk.suspended = false
            Policy.apply(context)
        }
    }

    companion object {
        const val ACTION = "com.yz.mdm.action.INSTALL_UPDATE"
    }
}
