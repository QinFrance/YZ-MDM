package com.yz.mdm

import android.app.Activity
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.SystemClock
import android.provider.Settings
import android.text.InputType
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var musicBtn: Button
    private var taps = 0
    private var lastTap = 0L

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Policy.apply(this)
        setContentView(buildUi())
    }

    override fun onResume() {
        super.onResume()
        refresh()
        if (Policy.isOwner(this) && !Kiosk.suspended) {
            val am = getSystemService(ActivityManager::class.java)
            if (am.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) runCatching { startLockTask() }
        }
    }

    private fun buildUi(): LinearLayout {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#101418"))
            setPadding(dp(24), dp(24), dp(24), dp(24))
        }
        val title = TextView(this).apply {
            text = "YZ"
            textSize = 44f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setOnClickListener { onTitleTap() }
        }
        musicBtn = bigButton("♫  Musique") { openZemer() }
        val settingsBtn = bigButton("⚙  Réglages") { openSettings() }
        status = TextView(this).apply {
            textSize = 14f
            setTextColor(Color.parseColor("#9AA5B1"))
            gravity = Gravity.CENTER
        }
        root.addView(title)
        root.addView(musicBtn, buttonParams())
        root.addView(settingsBtn, buttonParams())
        root.addView(status, buttonParams())
        return root
    }

    private fun bigButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        textSize = 24f
        isAllCaps = false
        setPadding(dp(16), dp(28), dp(16), dp(28))
        setOnClickListener { onClick() }
    }

    private fun buttonParams() = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
    ).apply { topMargin = dp(20) }

    private fun refresh() {
        val zemer = Config.ZEMER_PACKAGES.firstOrNull { Policy.isInstalled(this, it) }
        musicBtn.isEnabled = zemer != null
        status.text = buildString {
            append(if (Policy.isOwner(this@MainActivity)) "Appareil géré : oui" else "Appareil géré : NON (lancez scripts/setup.sh)")
            append("\n")
            append(if (zemer != null) "Zemer : installé" else "Zemer : non installé")
        }
    }

    private fun openZemer() {
        val pkg = Config.ZEMER_PACKAGES.firstOrNull { Policy.isInstalled(this, it) } ?: return
        packageManager.getLaunchIntentForPackage(pkg)?.let { startActivity(it) }
    }

    private fun openSettings() {
        runCatching { startActivity(Intent(Settings.ACTION_SETTINGS)) }
            .onFailure { toast("Réglages indisponibles") }
    }

    // ---- Accès administrateur : 7 appuis sur "YZ" puis code ----

    private fun onTitleTap() {
        val now = SystemClock.elapsedRealtime()
        taps = if (now - lastTap > 3000) 1 else taps + 1
        lastTap = now
        if (taps >= 7) { taps = 0; askPin() }
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
                val p = input.text.toString()
                when {
                    !hasPin && p.length >= 4 -> { Pin.set(this, p); adminMenu() }
                    !hasPin -> toast("4 chiffres minimum")
                    Pin.check(this, p) -> adminMenu()
                    else -> toast("Code incorrect")
                }
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    private fun adminMenu() {
        val items = arrayOf(
            "Réappliquer la politique et reprendre le kiosque",
            "Quitter le kiosque (jusqu'à la prochaine réappli.)",
            "Mode maintenance (autoriser installations adb)",
            "Retirer le Device Owner (tout débloquer)",
            "Fermer",
        )
        AlertDialog.Builder(this).setTitle("Administration YZ").setItems(items) { _, which ->
            when (which) {
                0 -> { Kiosk.suspended = false; Policy.apply(this); onResume(); toast("Politique appliquée") }
                1 -> { Kiosk.suspended = true; runCatching { stopLockTask() }; toast("Kiosque suspendu") }
                2 -> { Policy.maintenance(this); toast("Installations autorisées") }
                3 -> confirmRelease()
            }
        }.show()
    }

    private fun confirmRelease() {
        AlertDialog.Builder(this)
            .setTitle("Retirer le Device Owner ?")
            .setMessage("Toutes les restrictions seront levées et YZ ne gèrera plus l'appareil.")
            .setPositiveButton("Retirer") { _, _ ->
                Kiosk.suspended = true
                runCatching { stopLockTask() }
                Policy.release(this)
                refresh()
                toast("Device Owner retiré")
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    private fun toast(s: String) = Toast.makeText(this, s, Toast.LENGTH_SHORT).show()
}
