package com.yz.mdm

import android.content.Context
import java.security.MessageDigest
import java.util.UUID

/** Code administrateur local (haché + sel). Créé au premier accès admin : faites-le tout de suite. */
object Pin {
    private fun prefs(c: Context) = c.getSharedPreferences("yz", Context.MODE_PRIVATE)

    private fun hash(salt: String, pin: String) =
        MessageDigest.getInstance("SHA-256").digest((salt + pin).toByteArray())
            .joinToString("") { "%02x".format(it) }

    fun isSet(c: Context) = prefs(c).contains("pin_hash")

    fun set(c: Context, pin: String) {
        val salt = UUID.randomUUID().toString()
        prefs(c).edit().putString("salt", salt).putString("pin_hash", hash(salt, pin)).apply()
    }

    fun check(c: Context, pin: String): Boolean {
        val p = prefs(c)
        return hash(p.getString("salt", "") ?: "", pin) == p.getString("pin_hash", "")
    }
}
