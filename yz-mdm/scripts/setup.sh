#!/usr/bin/env bash
# Usage : ./scripts/setup.sh yz-mdm.apk zemer.apk [waze.apk]
# Prérequis : adb, débogage USB activé, appareil NEUF ou réinitialisé,
#             AUCUN compte (Google ou autre) sur l'appareil, un seul utilisateur.
set -euo pipefail
YZ_APK="${1:?APK YZ (app-debug.apk)}"
ZEMER_APK="${2:?APK Zemer officiel}"
WAZE_APK="${3:-}"

adb devices | grep -q "device$" || { echo "Aucun appareil adb"; exit 1; }
adb install -r "$ZEMER_APK"
if [[ -n "$WAZE_APK" ]]; then
  adb install -r "$WAZE_APK"
fi
adb install -r "$YZ_APK"
adb shell dpm set-device-owner com.yz.mdm/.AdminReceiver
adb shell am start -n com.yz.mdm/.MainActivity
echo "OK. Appuyez 7 fois sur « YZ » pour créer le code administrateur."
