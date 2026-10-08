# YiDream · YZ MDM

YiDream transforme un appareil Android dédié en launcher musical. Ce dépôt contient l’application Android et le site d’installation WebADB.

## Installer depuis un navigateur

Ouvrir [https://qinfrance.github.io/YZ-MDM/](https://qinfrance.github.io/YZ-MDM/) dans Chrome, Edge ou Brave, puis :

1. Activez les options développeur et le débogage USB sur Android.
2. Branchez un câble USB qui transfère les données et acceptez la demande RSA sur le téléphone.
3. Cliquez sur **Connecter**, puis sur **Vérifier les applications**.
4. Installez les applications sélectionnées manquantes.
5. Si vous voulez le mode kiosque, ouvrez l’option correspondante après avoir installé les applications prévues.

WebADB fonctionne dans le navigateur ; aucune connexion silencieuse n’est possible. Le sélecteur USB et l’autorisation sur le téléphone exigent votre action.

## APK signé

Le workflow **Build and publish YZ MDM WebADB** compile l’application et le site. Une APK publique de release n’est publiée que si les quatre secrets suivants sont configurés dans **Settings → Secrets and variables → Actions** :

- `YZMDM_SIGNING_KEYSTORE_BASE64`
- `YZMDM_STORE_PASSWORD`
- `YZMDM_KEY_ALIAS`
- `YZMDM_KEY_PASSWORD`

Conservez le keystore hors du dépôt et sauvegardez-le. Toutes les mises à jour doivent réutiliser la même clé ; Android refusera une mise à jour signée par une clé différente. Tant que la clé n’est pas configurée, la page WebADB peut vérifier les appareils et installer les autres APK, mais ne propose pas de release YiDream signée.

## Applications externes

Zemer est récupéré depuis sa dernière release GitHub officielle. Waze et Pulsar sont vérifiés sur l’appareil ; leur APK n’est pas redistribué par ce dépôt. Installez-les via Google Play ou sélectionnez un APK que vous avez obtenu depuis leur canal officiel.

## Mode kiosque

Le bouton **Activer le mode dédié** exécute `dpm set-device-owner` après une confirmation explicite. Android exige généralement un appareil neuf ou réinitialisé, sans compte utilisateur ajouté. Le mode Device Owner fixe YiDream comme écran d’accueil et applique les restrictions décrites dans `yz-mdm/app/src/main/java/com/yz/mdm/Policy.kt`.

## Développement

- Android : dossier `yz-mdm`, JDK 17, Gradle 8.9.
- WebADB : `cd web-installer && npm ci && npm run build`.
- `build-apk` produit une APK debug de test comme artefact GitHub Actions ; elle n’est pas la release de distribution.
