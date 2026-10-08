# YZ MDM

Side project. **Un seul APK** qui est à la fois :
- le **launcher** (activité HOME) de l'appareil,
- le **Device Owner** (DPC / mini-MDM),
- un **kiosque** qui n'autorise que **Zemer** (`com.jtech.zemer`) et **Réglages**.

L'app de musique n'est pas incluse : on utilise l'APK Zemer officiel (GPL-3.0, https://github.com/ZemerTeam/zemer-app). Aucun code Zemer n'est dans ce dépôt.
Zemer dépend des serveurs de l'équipe Zemer : prévenez-les si le projet grossit.

## Interface

L'écran d'accueil reprend la maquette YiDream en HTML embarqué dans l'APK (aucun accès réseau requis pour ses icônes). Les raccourcis ouvrent l'application Zemer existante, Waze et les écrans système Bluetooth/son. Zemer reste une application distincte afin de conserver son paquet officiel et ses données.

Le champ de code de sortie quotidien est un emplacement d'interface : le service YiDream de validation n'est pas encore relié. L'accès administrateur existant reste disponible par sept appuis sur « Zemer » dans le tiroir puis le PIN local.

## Ce que fait la politique (`Policy.kt`)
- Lock task (kiosque) limité à : YZ, Réglages, Zemer et Waze si l'app est installée. Bouton Accueil et notifications autorisés (commandes média). Réglages rapides bloqués.
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

    ./scripts/setup.sh app-debug.apk zemer.apk [waze.apk]

Si Waze doit être disponible dans le kiosque, passe aussi son APK en troisième argument pour l'installer avant l'activation du Device Owner.

Puis **tout de suite** : 7 appuis sur « Zemer » dans le tiroir → créer le code administrateur (sinon quelqu'un d'autre peut le créer).

## Menu administrateur (7 appuis sur « Zemer » + code)
- Réappliquer la politique / reprendre le kiosque
- Quitter le kiosque
- Mode maintenance (lève le blocage d'installation pour `adb install -r` d'une mise à jour de Zemer ; « Réappliquer » le remet)
- Retirer le Device Owner (sinon seule la réinitialisation d'usine le retire)

## Limites connues
- **Non compilé ni testé sur appareil au moment de la génération** : attendez-vous à corriger quelques erreurs de compilation ou de comportement. Testez sur un téléphone de rechange.
- Android 8/9 (API 26-27) : pas de réglage fin du kiosque, le bouton Accueil est désactivé en kiosque ; Retour ramène à YiDream.
- Les constructeurs (Samsung, Xiaomi, Huawei…) ajoutent parfois leurs propres verrous sur le Device Owner et sur les paquets Réglages : ajustez `Config.EXTRA_ALLOWED_PACKAGES` si un écran de Réglages est refusé.
- Les mises à jour de Zemer se font en mode maintenance + `adb install -r` (pas encore de mise à jour silencieuse intégrée).
- Zemer a son propre système de mise à jour intégré : sur appareil géré il ne pourra pas installer (restriction), ce qui est voulu.
- Licence de ce dépôt : à choisir.
