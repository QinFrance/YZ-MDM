# YZ MDM · WebADB réel

Cette page utilise WebUSB/WebADB dans le navigateur : elle peut réellement détecter un téléphone, lire ses informations et installer des APK par ADB après consentement sur l’appareil.

## Prérequis
- Chrome, Edge ou Brave à jour, sur l’adresse HTTPS de GitHub Pages.
- Un téléphone Android connecté avec un câble USB qui transfère les données.
- Options développeur et débogage USB activés ; accepter l’empreinte RSA sur le téléphone.
- Fermer un autre client ADB qui pourrait déjà monopoliser la connexion.

L’ouverture de la fenêtre USB et l’autorisation RSA exigent un clic et une validation côté téléphone. Le site ne peut pas connecter silencieusement un appareil.

## Applications
- **YiDream Launcher** : build de release signé si les secrets de signature sont configurés ; sinon l’installateur demande de choisir un APK signé localement.
- **Zemer** : l’installateur consulte la dernière release officielle de Zemer et installe l’APK publié par l’équipe Zemer. Si le navigateur bloque le téléchargement, sélectionnez l’APK officiel.
- **Waze et Pulsar** : vérification de présence réelle. Pour respecter leurs canaux de distribution, l’installateur ne récupère pas d’APK tiers. Installez via Google Play ou choisissez un APK que vous avez obtenu légalement.
- Les APK existants sont conservés ; l’installateur installe uniquement les applications sélectionnées qui manquent.

## Mode appareil dédié
Le bouton est séparé et facultatif. L’activation de Device Owner est normalement réservée à un appareil neuf/réinitialisé, sans compte ajouté. Elle applique ensuite le kiosque et les restrictions configurées. Elle ne doit pas être déclenchée avant d’avoir installé toutes les applications prévues.

## Signature release (indispensable pour distribuer des mises à jour)
Ne placez jamais la clé privée dans le dépôt. Ajoutez ces secrets dans **Settings → Secrets and variables → Actions** :
- `YZMDM_SIGNING_KEYSTORE_BASE64` : keystore en Base64.
- `YZMDM_STORE_PASSWORD`
- `YZMDM_KEY_ALIAS`
- `YZMDM_KEY_PASSWORD`

La même clé doit signer toutes les versions futures, sinon Android refusera une mise à jour par-dessus l’APK existant. Après l’ajout des quatre secrets, le workflow **Build and publish YZ MDM WebADB** démarre automatiquement au prochain changement dans `web-installer/` ou `yz-mdm/`. Il compile alors la release signée et la publie dans `downloads/yz-mdm.apk`, que l’installateur charge depuis le site. Les versions suivantes suivent le même processus.

## Développement
Le site est compilé avec Vite et les bibliothèques WebADB de Yume-chan. `npm ci && npm run build` dans `web-installer`.
