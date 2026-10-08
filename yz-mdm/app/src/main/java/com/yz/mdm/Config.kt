package com.yz.mdm

/** Tout ce qu'on règle à la main se trouve ici. */
object Config {
    /** Paquet(s) de l'app de musique autorisée (Zemer officiel : com.jtech.zemer). */
    val ZEMER_PACKAGES = listOf("com.jtech.zemer")
    const val WAZE_PACKAGE = "com.waze"

    /** Autres paquets à autoriser en kiosque (ex. un service Wi-Fi propre à un constructeur). */
    val EXTRA_ALLOWED_PACKAGES = listOf<String>()

    /**
     * true = interdit le débogage USB (adb). Laissé à false pour ne pas vous enfermer dehors
     * pendant les tests. Passez à true seulement pour un appareil "final".
     */
    const val BLOCK_DEBUGGING = false

    /**
     * Restrictions d'application poussées à Zemer (Android « app restrictions »).
     * ATTENTION : le Zemer officiel ne les lit pas encore. Elles prendront effet seulement
     * avec un fork/une contribution qui lit RestrictionsManager. Les clés sont des propositions.
     */
    val ZEMER_APP_RESTRICTIONS = mapOf(
        "block_videos" to true,
        "block_podcasts" to true,
        "playback_mode" to "DIRECT", // ou "RELAY" pour les appareils filtrés
    )
}
