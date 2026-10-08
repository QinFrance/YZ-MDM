# YiDream / YZ MDM

Cette application Android combine le launcher YiDream et un contrôleur Device Owner (DPC). Elle n’intègre pas les applications de musique externes.

## Launcher
- Zemer officiel : `com.jtech.zemer`
- Waze : `com.waze`
- Pulsar : `com.rhmsoft.pulsar`
- Réglages Android et raccourci Bluetooth
- Mode voiture adaptatif selon l’orientation du téléphone

Pulsar et Waze ne peuvent être ouverts que s’ils sont installés. Ils sont inclus dans la liste du kiosque uniquement quand ils existent sur l’appareil.

## Politique kiosque
La politique Device Owner autorise YiDream, les Réglages, Zemer, et Waze/Pulsar s’ils sont installés. Elle désactive la réinitialisation, l’installation et la désinstallation depuis l’interface Android, et fixe YiDream comme launcher par défaut. Le débogage USB reste activé pour autoriser les opérations WebADB.

L’activation Device Owner est facultative et séparée de l’installation. Android l’autorise généralement seulement sur un appareil neuf/réinitialisé avant d’ajouter un compte. Le site Web affiche cet avertissement et demande une confirmation distincte.

## Compilation et signature
Le workflow Pages compile le site puis l’APK de release. La release est signée uniquement quand les secrets suivants existent dans les Actions du dépôt : `YZMDM_SIGNING_KEYSTORE_BASE64`, `YZMDM_STORE_PASSWORD`, `YZMDM_KEY_ALIAS` et `YZMDM_KEY_PASSWORD`. Gardez le keystore privé et sauvegardez-le : une même clé est nécessaire pour toutes les mises à jour.

Le workflow `build-apk` produit une APK debug pour les essais ; ce fichier n’est pas destiné à la distribution ni aux mises à jour de release.

## Installation
Le site [WebADB YiDream](https://qinfrance.github.io/YZ-MDM/) détecte les paquets, installe la dernière APK officielle de Zemer, permet de choisir un APK local pour Waze/Pulsar, installe la release YiDream lorsqu’elle est disponible, puis peut activer le Device Owner après confirmation.
