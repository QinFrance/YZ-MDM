package com.yz.mdm

import android.app.admin.DeviceAdminReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class AdminReceiver : DeviceAdminReceiver() {
    companion object {
        fun component(c: Context) = ComponentName(c.applicationContext, AdminReceiver::class.java)
    }

    override fun onEnabled(context: Context, intent: Intent) {
        Policy.apply(context)
    }
}
