# YZ MDM

Side project. **Un seul APK** qui est à la fois :
- le **launcher** (activité HOME) de l'appareil,
- le **Device Owner** (DPC / mini-MDM),
- un **kiosque** qui n'autorise que **Zemer** (`com.jtech.zemer`) et **Réglages**.

L'app de musique n'est pas incluse : on utilise l'APK Zemer officiel (GPL-3.0, https://github.com/ZemerTeam/zemer-app). Aucun code Zemer n'est dans ce dépôt.
Zemer dépend des serveurs de l'équipe Zemer : prévenez-les si le projet grossit.

## Ce que fait la politique (`Policy.kt`)
- Lock task (kiosque) limité à : YZ, Réglages, Zemer. Bouton Accueil et notifications autorisés (commandes média). Réglages rapides bloqués.
- YZ devient le launcher persistant.
- Restrictions : pas d'installation/désinstallation, pas de sources inconnues, pas de reset d'usine, pas de mode sans échec, pas d'ajout d'utilisateur.
- Débogage USB laissé actif par défaut (`Config.BLOCK_DEBUGGING`).
- Écran de verrouillage désactivé, permissions de Zemer accordées automatiquement, arrêt forcé de Zemer bloqué (Android 11+).
- Pousse des « restrictions d'application » à Zemer (`Config.ZEMER_APP_RESTRICTIONS`). **Le Zemer officiel ne les lit pas encore** : sans fork ou contribution, elles n'ont aucun effet.

## Compiler
**Option GitHub** : poussez le dépôt, onglet Actions → `build-apk` → artefact `yz-mdm-debug-apk`.
**Option locale** : ouvrez le dossier dans Android Studio (génère le wrapper Gradle) puis `Build > Build APK`, ou `gradle :app:assembleDebug` avec JDK 17.
L'APK est signé avec la clé de debug : suffisant pour un side project.

## Installer sur un appareil
Conditions : appareil neuf ou réinitialisé, **aucun compte** dessus, un seul utilisateur, débogage USB activé.

    ./scripts/setup.sh app-debug.apk zemer.apk

Puis **tout de suite** : 7 appuis sur « YZ » → créer le code administrateur (sinon quelqu'un d'autre peut le créer).

## Menu administrateur (7 appuis sur « YZ » + code)
- Réappliquer la politique / reprendre le kiosque
- Quitter le kiosque
- Mode maintenance (lève le blocage d'installation pour `adb install -r` d'une mise à jour de Zemer ; « Réappliquer » le remet)
- Retirer le Device Owner (sinon seule la réinitialisation d'usine le retire)

## Limites connues
- **Non compilé ni testé sur appareil au moment de la génération** : attendez-vous à corriger quelques erreurs de compilation ou de comportement. Testez sur un téléphone de rechange.
- Android 8/9 (API 26-27) : pas de réglage fin du kiosque, le bouton Accueil est désactivé en kiosque ; Retour ramène à YZ.
- Les constructeurs (Samsung, Xiaomi, Huawei…) ajoutent parfois leurs propres verrous sur le Device Owner et sur les paquets Réglages : ajustez `Config.EXTRA_ALLOWED_PACKAGES` si un écran de Réglages est refusé.
- Les mises à jour de Zemer se font en mode maintenance + `adb install -r` (pas encore de mise à jour silencieuse intégrée).
- Zemer a son propre système de mise à jour intégré : sur appareil géré il ne pourra pas installer (restriction), ce qui est voulu.
- Licence de ce dépôt : à choisir.
