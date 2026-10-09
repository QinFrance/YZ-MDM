import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDevice, AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { PackageManager } from '@yume-chan/android-bin';

const APP = {
  launcher: { package: 'com.yz.mdm' },
  zemer: { package: 'com.jtech.zemer' },
  waze: { package: 'com.waze' },
  pulsar: { package: 'com.rhmsoft.pulsar' },
};
const OWNER_COMPONENT = 'com.yz.mdm/.AdminReceiver';
const STRINGS = {
  fr: {
    filesTitle:'Installation automatique',
    filesHint:'Les applications déjà installées sont conservées. YiDream et Zemer se téléchargent automatiquement ; l’installation de Waze et Pulsar passe par Google Play.',
    chooseApk:'Choisir un APK',
    noFileSelected:'Aucun fichier choisi',
    launcherName:'YiDream Launcher',
    launcherFileHint:'APK signé du launcher',
    zemerName:'Zemer',
    zemerFileHint:'APK officiel · installation manuelle',
    wazeName:'Waze',
    wazeFileHint:'APK officiel',
    pulsarName:'Pulsar',
    pulsarFileHint:'APK officiel',
    storeWaze:'Télécharger Waze sur Google Play',
    storePulsar:'Télécharger Pulsar sur Google Play',
    ownerSummary:'Option avancée : configurer l’appareil dédié',
    ownerWarning:'À utiliser uniquement sur un appareil neuf ou réinitialisé, avant d’ajouter un compte. Android bloque généralement cette configuration après la mise en service. Le mode dédié verrouille ensuite le téléphone sur les applications autorisées.',
    ownerButton:'Activer le mode dédié',
    filesTitle: "Installation automatique",
    filesHint: "YiDream et Zemer se téléchargent automatiquement. Pour Waze et Pulsar, Android ouvre Google Play afin de confirmer l’installation.",
    storeWaze: "Installer Waze sur le téléphone",
    storePulsar: "Installer Pulsar sur le téléphone",
    storeOpened: "Google Play est ouvert sur le téléphone. Terminez l’installation, puis revérifiez les applications.",
    ownerRemoveButton: "Retirer les restrictions du mode dédié",
    ownerRemoveWarning: "Le retrait désactive les restrictions de YiDream sans effacer vos applications ni vos fichiers. Réinitialisez séparément le téléphone avant de le vendre.",
    ownerRemoveConfirm: "Cela retire YiDream comme administrateur et désactive les restrictions du mode dédié. Les applications et les données ne sont pas supprimées. Certaines règles peuvent rester : réinitialisez l’appareil avant de le vendre. Continuer ?",
    ownerRemoved: "Les restrictions du mode dédié ont été retirées. Vous pouvez maintenant modifier le launcher ou réinitialiser le téléphone.",
    ownerRemoveError: "Android n’a pas pu retirer les droits administrateur.",
    openingStore: "Ouverture de Google Play sur le téléphone…",
    storeOpenError: "Impossible d’ouvrir Google Play sur ce téléphone.",
    storeZemer: "Installer Zemer sur le téléphone",
    signedApk:'APK signé',
    ready: 'WebADB prêt. Connectez un appareil Android avec le débogage USB activé.',
    unsupported: 'WebUSB n’est pas disponible ici. Ouvrez ce site dans Chrome, Edge ou Brave.',
    searching: 'Choisissez le téléphone dans la fenêtre du navigateur…',
    connecting: 'Connexion USB en cours…',
    authenticating: 'Confirmez l’autorisation ADB sur le téléphone…',
    connected: 'Téléphone connecté',
    disconnected: 'Téléphone déconnecté.',
    cancel: 'Aucun téléphone sélectionné.',
    busy: 'Un autre programme utilise ADB. Fermez-le puis réessayez.',
    connect: 'Connecter',
    disconnect: 'Déconnecter',
    check: 'Vérifier les applications',
    install: 'Installer les applications sélectionnées',
    phoneFound: 'Téléphone détecté. Vérifiez les applications avant l’installation.',
    checking: 'Vérification des applications sur le téléphone…',
    checkDone: 'Vérification terminée. Les applications présentes sont conservées.',
    installStart: 'Installation des applications absentes…',
    installDone: 'Installation terminée. Vérifiez le résultat sur le téléphone.',
    ownerDone: 'Mode appareil dédié activé. YiDream est défini comme écran d’accueil.',
    ownerConfirm: 'Cette action configure YiDream comme administrateur de l’appareil. Elle est prévue pour un téléphone neuf ou réinitialisé, sans compte ajouté. Android peut refuser si le téléphone a déjà été configuré. Continuer ?',
    noDevice: 'Connectez d’abord un téléphone.',
    noLauncher: 'Le launcher YiDream est absent et aucun APK signé n’est publié pour cette version.',
    needApk: 'Sélectionnez l’APK officiel pour cette application, puis relancez l’installation.',
    launcherReady: 'APK signé prêt à télécharger.',
    launcherSigning: 'APK signé indisponible : vérifiez la signature GitHub et la dernière compilation.',
    installed: 'Installée',
    missing: 'Absente',
    notSelected: 'Non sélectionnée',
    zemerRelease: 'Récupération de la dernière version officielle de Zemer…',
    zemerFetchFail: 'Le téléchargement automatique de Zemer a échoué. Utilisez le bouton Google Play pour l’installer.',
    skipped: 'Pas d’APK fourni : ouvrez Google Play, installez l’application puis revérifiez.',
    ownerError: 'Android n’a pas activé le mode dédié. Le téléphone doit généralement être neuf/réinitialisé et sans compte.',
    permission: 'Autorisez le débogage USB sur le téléphone, puis réessayez.',
    steps: 'Activez les options développeur et le débogage USB, branchez un câble de données et acceptez l’empreinte RSA.',
    statusCurrent: 'Installée · conservée',
    updateAvailable: 'Mise à jour disponible',
    statusMissing: 'Absente · à installer',
    statusUnselected: 'Non sélectionnée',
    statusNeedsPlay: 'Absente · Google Play',
    sizeError: 'APK invalide ou trop volumineux.',
    operationFailed: 'Échec de l’opération.',
    noRelease: 'La release officielle de Zemer ne contient pas d’APK compatible.',
  },
  en: {
    filesTitle:'Automatic installation',
    filesHint:'Apps already installed are kept. YiDream and Zemer download automatically; Waze and Pulsar installation goes through Google Play.',
    chooseApk:'Choose APK',
    noFileSelected:'No file selected',
    launcherName:'YiDream Launcher',
    launcherFileHint:'Signed launcher APK',
    zemerName:'Zemer',
    zemerFileHint:'Official APK · manual install',
    wazeName:'Waze',
    wazeFileHint:'Official APK',
    pulsarName:'Pulsar',
    pulsarFileHint:'Official APK',
    storeWaze:'Get Waze on Google Play',
    storePulsar:'Get Pulsar on Google Play',
    ownerSummary:'Advanced option: set up a dedicated device',
    ownerWarning:'Use this only on a new or factory-reset phone, before adding an account. Android generally blocks this setup after the phone has been configured. Dedicated mode then locks the phone to the allowed apps.',
    ownerButton:'Enable dedicated mode',
    filesTitle: "Automatic installation",
    filesHint: "YiDream and Zemer download automatically. For Waze and Pulsar, Android opens Google Play so you can confirm installation.",
    storeWaze: "Install Waze on the phone",
    storePulsar: "Install Pulsar on the phone",
    storeOpened: "Google Play is open on the phone. Finish the installation, then check the apps again.",
    ownerRemoveButton: "Remove dedicated-device restrictions",
    ownerRemoveWarning: "This removes YiDream's restrictions without deleting apps or files. Factory-reset the phone separately before selling it.",
    ownerRemoveConfirm: "This removes YiDream as device administrator and turns off dedicated-device restrictions. Apps and data are not deleted. Some policies may remain; factory-reset the phone before selling it. Continue?",
    ownerRemoved: "Dedicated-device restrictions are removed. You can now change the launcher or factory-reset the phone.",
    ownerRemoveError: "Android could not remove device administrator access.",
    openingStore: "Opening Google Play on the phone…",
    storeOpenError: "Could not open Google Play on this phone.",
    storeZemer: "Install Zemer on the phone",
    signedApk:'Signed APK',
    ready: 'WebADB is ready. Connect an Android device with USB debugging enabled.',
    unsupported: 'WebUSB is unavailable here. Open this site in Chrome, Edge, or Brave.',
    searching: 'Choose your phone in the browser dialog…',
    connecting: 'Connecting over USB…',
    authenticating: 'Approve the ADB authorization on your phone…',
    connected: 'Phone connected',
    disconnected: 'Phone disconnected.',
    cancel: 'No phone selected.',
    busy: 'Another program is using ADB. Close it and try again.',
    connect: 'Connect',
    disconnect: 'Disconnect',
    check: 'Check apps',
    install: 'Install selected apps',
    phoneFound: 'Phone detected. Check its apps before installing.',
    checking: 'Checking apps on the phone…',
    checkDone: 'Check complete. Apps already present will be kept.',
    installStart: 'Installing missing apps…',
    installDone: 'Installation complete. Check the result on the phone.',
    ownerDone: 'Dedicated-device mode enabled. YiDream is now the home screen.',
    ownerConfirm: 'This sets YiDream as device owner. It is intended for a new or reset phone with no account added. Android may reject this on a phone already set up. Continue?',
    noDevice: 'Connect a phone first.',
    noLauncher: 'YiDream Launcher is missing and no signed APK has been published for this version.',
    needApk: 'Choose the official APK for this app, then start installation again.',
    launcherReady: 'Signed APK is ready to download.',
    launcherSigning: 'Signed APK unavailable: check the GitHub signing setup and latest build.',
    installed: 'Installed',
    missing: 'Missing',
    notSelected: 'Not selected',
    zemerRelease: 'Getting the latest official Zemer release…',
    zemerFetchFail: 'Automatic Zemer download failed. Use the Google Play button to install it.',
    skipped: 'No APK selected. Open Google Play, install the app, then check again.',
    ownerError: 'Android could not enable dedicated-device mode. The phone usually must be new/reset and have no account.',
    permission: 'Approve USB debugging on the phone, then try again.',
    steps: 'Enable Developer options and USB debugging, use a data-capable cable, and approve the RSA fingerprint.',
    statusCurrent: 'Installed · kept',
    updateAvailable: 'Update available',
    statusMissing: 'Missing · to install',
    statusUnselected: 'Not selected',
    statusNeedsPlay: 'Missing · Google Play',
    sizeError: 'Invalid or oversized APK.',
    operationFailed: 'The operation failed.',
    noRelease: 'The official Zemer release has no compatible APK.',
  },
  he: {
    filesTitle:'אפליקציות להוספה',
    filesHint:'אפליקציות שכבר מותקנות יישארו. YiDream ו‑Zemer יורדו אוטומטית; התקנת Waze ו‑Pulsar מתבצעת דרך Google Play.',
    chooseApk:'בחירת APK',
    noFileSelected:'לא נבחר קובץ',
    launcherName:'YiDream Launcher',
    launcherFileHint:'קובץ APK חתום של המשגר',
    zemerName:'Zemer',
    zemerFileHint:'APK רשמי · התקנה ידנית',
    wazeName:'Waze',
    wazeFileHint:'APK רשמי',
    pulsarName:'Pulsar',
    pulsarFileHint:'APK רשמי',
    storeWaze:'הורדת Waze מ‑Google Play',
    storePulsar:'הורדת Pulsar מ‑Google Play',
    ownerSummary:'אפשרות מתקדמת: הגדרת מכשיר ייעודי',
    ownerWarning:'השתמשו באפשרות זו רק בטלפון חדש או מאופס להגדרות היצרן, לפני הוספת חשבון. Android בדרך כלל חוסם הגדרה זו לאחר שהטלפון הוגדר. לאחר מכן מצב ייעודי נועל את הטלפון לאפליקציות המורשות.',
    ownerButton:'הפעלת מצב ייעודי',
    filesTitle: "התקנה אוטומטית",
    filesHint: "YiDream ו‑Zemer יורדו אוטומטית. עבור Waze ו‑Pulsar, Android יפתח את Google Play כדי לאשר את ההתקנה.",
    storeWaze: "התקנת Waze בטלפון",
    storePulsar: "התקנת Pulsar בטלפון",
    storeOpened: "Google Play פתוח בטלפון. השלימו את ההתקנה ובדקו שוב את האפליקציות.",
    ownerRemoveButton: "הסרת ההגבלות של מצב ייעודי",
    ownerRemoveWarning: "הסרה זו מבטלת את הגבלות YiDream בלי למחוק אפליקציות או קבצים. לפני מכירה, אפסו את הטלפון בנפרד.",
    ownerRemoveConfirm: "פעולה זו מסירה את YiDream כמנהל המכשיר ומבטלת את הגבלות המצב הייעודי. האפליקציות והנתונים לא יימחקו. ייתכן שחלק מהמדיניות תישאר; אפסו את הטלפון לפני מכירה. להמשיך?",
    ownerRemoved: "הגבלות המצב הייעודי הוסרו. כעת ניתן להחליף משגר או לאפס את הטלפון.",
    ownerRemoveError: "Android לא הצליח להסיר את הרשאות מנהל המכשיר.",
    openingStore: "פותח את Google Play בטלפון…",
    storeOpenError: "לא ניתן לפתוח את Google Play בטלפון הזה.",
    storeZemer: "התקנת Zemer בטלפון",
    signedApk:'APK חתום',
    ready: 'WebADB מוכן. חברו מכשיר Android עם ניפוי באגים ב‑USB.',
    unsupported: 'WebUSB אינו זמין כאן. פתחו את האתר ב‑Chrome, Edge או Brave.',
    searching: 'בחרו את הטלפון בחלון הדפדפן…',
    connecting: 'מתחבר דרך USB…',
    authenticating: 'אשרו את הרשאת ADB בטלפון…',
    connected: 'הטלפון מחובר',
    disconnected: 'הטלפון נותק.',
    cancel: 'לא נבחר טלפון.',
    busy: 'תוכנה אחרת משתמשת ב‑ADB. סגרו אותה ונסו שוב.',
    connect: 'חיבור',
    disconnect: 'ניתוק',
    check: 'בדיקת אפליקציות',
    install: 'התקנת האפליקציות שנבחרו',
    phoneFound: 'הטלפון זוהה. בדקו את האפליקציות לפני ההתקנה.',
    checking: 'בודק אפליקציות בטלפון…',
    checkDone: 'הבדיקה הושלמה. אפליקציות קיימות יישארו.',
    installStart: 'מתקין אפליקציות חסרות…',
    installDone: 'ההתקנה הושלמה. בדקו את התוצאה בטלפון.',
    ownerDone: 'מצב מכשיר ייעודי הופעל. YiDream הוגדר כמסך הבית.',
    ownerConfirm: 'פעולה זו מגדירה את YiDream כמנהל המכשיר. מיועדת לטלפון חדש או מאופס, ללא חשבון. Android עשוי לסרב אם הטלפון כבר הוגדר. להמשיך?',
    noDevice: 'חברו תחילה טלפון.',
    noLauncher: 'YiDream Launcher חסר ולא פורסם APK חתום לגרסה זו.',
    needApk: 'בחרו APK רשמי לאפליקציה זו והפעילו שוב את ההתקנה.',
    launcherReady: 'APK חתום מוכן להורדה.',
    launcherSigning: 'APK חתום אינו זמין: בדקו את הגדרות החתימה ב‑GitHub ואת הבנייה האחרונה.',
    installed: 'מותקנת',
    missing: 'חסרה',
    notSelected: 'לא נבחרה',
    zemerRelease: 'מוריד את הגרסה הרשמית האחרונה של Zemer…',
    zemerFetchFail: 'ההורדה האוטומטית של Zemer נכשלה. השתמשו בכפתור Google Play להתקנה.',
    skipped: 'לא נבחר APK. פתחו את Google Play, התקינו את האפליקציה ובדקו שוב.',
    ownerError: 'Android לא הפעיל מצב ייעודי. בדרך כלל הטלפון צריך להיות חדש/מאופס וללא חשבון.',
    permission: 'אשרו ניפוי באגים ב‑USB בטלפון ונסו שוב.',
    steps: 'הפעילו אפשרויות מפתחים וניפוי באגים ב‑USB, השתמשו בכבל נתונים ואשרו את טביעת RSA.',
    statusCurrent: 'מותקנת · נשארת',
    updateAvailable: 'עדכון זמין',
    statusMissing: 'חסרה · להתקנה',
    statusUnselected: 'לא נבחרה',
    statusNeedsPlay: 'חסרה · Google Play',
    sizeError: 'APK לא תקין או גדול מדי.',
    operationFailed: 'הפעולה נכשלה.',
    noRelease: 'בגרסת Zemer הרשמית אין APK תואם.',
  },
  yi: {
    filesTitle:'אַפּס צו צולייגן',
    filesHint:'שוין אינסטאַלירטע אַפּס בלײַבן. YiDream און Zemer ווערן אראפגעלאָדן אויטאָמאַטיש; Waze און Pulsar אינסטאַלאַציע גייט דורך Google Play.',
    chooseApk:'קלײַבן APK',
    noFileSelected:'קיין טעקע נישט אויסגעקליבן',
    launcherName:'YiDream Launcher',
    launcherFileHint:'אונטערגעשריבענער Launcher APK',
    zemerName:'Zemer',
    zemerFileHint:'אָפֿיציעלער APK · מאַנועלע אינסטאַלאַציע',
    wazeName:'Waze',
    wazeFileHint:'אָפֿיציעלער APK',
    pulsarName:'Pulsar',
    pulsarFileHint:'אָפֿיציעלער APK',
    storeWaze:'ברענגט Waze פֿון Google Play',
    storePulsar:'ברענגט Pulsar פֿון Google Play',
    ownerSummary:'פֿאָרגעשריטענע אָפּציע: אײַנשטעלן אַ דעדיקירטן מכשיר',
    ownerWarning:'ניצט דאָס נאָר אויף אַ נײַעם אָדער צוריקגעשטעלטן טעלעפֿאָן, איידער איר לייגט צו אַ חשבון. Android בלאָקירט בדרך־כּלל די אײַנשטעלונג נאָכן צוגרייטן דעם טעלעפֿאָן. דערנאָך פֿאַרשליסט דער דעדיקירטער מאָדוס דעם טעלעפֿאָן צו די ערלויבטע אַפּס.',
    ownerButton:'אַקטיווירן דעדיקירטן מאָדוס',
    filesTitle: "אָטאָמאַטישע אינסטאַלאַציע",
    filesHint: "YiDream און Zemer ווערן אראפגעלאָדן אויטאָמאַטיש. פֿאַר Waze און Pulsar עפֿנט Android Google Play כּדי איר זאָלט באַשטעטיקן די אינסטאַלאַציע.",
    storeWaze: "אינסטאַלירן Waze אויפֿן טעלעפֿאָן",
    storePulsar: "אינסטאַלירן Pulsar אויפֿן טעלעפֿאָן",
    storeOpened: "Google Play איז אָפֿן אויפֿן טעלעפֿאָן. ענדיקט די אינסטאַלאַציע און קאָנטראָלירט די אַפּס ווידער.",
    ownerRemoveButton: "אַראָפּנעמען די באַגרענעצונגען פֿון דעדיקירטן מאָדוס",
    ownerRemoveWarning: "דאָס נעמט אַראָפּ YiDream'ס באַגרענעצונגען אָן אויסמעקן אַפּס אָדער טעקעס. איידער איר פֿאַרקויפֿט דעם טעלעפֿאָן, מאַכט אַ באַזונדערע פֿאַבריק־אויפֿשטעלונג.",
    ownerRemoveConfirm: "דאָס נעמט אַראָפּ YiDream ווי מיטל־אַדמיניסטראַטאָר און שאַלט אָפּ די באַגרענעצונגען. אַפּס און דאַטן ווערן נישט אויסגעמעקט. עטלעכע כּללים קענען בלײַבן; שטעלט דעם טעלעפֿאָן צוריק פֿאַרן פֿאַרקויפֿן. ווײַטער?",
    ownerRemoved: "די באַגרענעצונגען פֿון דעדיקירטן מאָדוס זענען אַוועק. איר קענט איצט טוישן דעם Launcher אָדער צוריקשטעלן דעם טעלעפֿאָן.",
    ownerRemoveError: "Android האָט נישט געקענט אַראָפּנעמען די אַדמיניסטראַטאָר־רעכט.",
    openingStore: "עפֿנט Google Play אויפֿן טעלעפֿאָן…",
    storeOpenError: "Google Play האָט זיך נישט געקענט עפֿענען אויפֿן טעלעפֿאָן.",
    storeZemer: "אינסטאַלירן Zemer אויפֿן טעלעפֿאָן",
    signedApk:'אונטערגעשריבענער APK',
    ready: 'WebADB איז גרייט. פֿאַרבינדט אַן Android מיט USB-דעבאַגינג.',
    unsupported: 'WebUSB איז נישט בנימצא. עפֿנט דעם פּלאַץ אין Chrome, Edge אָדער Brave.',
    searching: 'קלײַבט דעם טעלעפֿאָן אינעם בלעטערער־פֿענצטער…',
    connecting: 'פֿאַרבינדט זיך דורך USB…',
    authenticating: 'באַשטעטיקט די ADB דערלויבעניש אויפֿן טעלעפֿאָן…',
    connected: 'טעלעפֿאָן פֿאַרבונדן',
    disconnected: 'דער טעלעפֿאָן איז אָפּגעטיילט געוואָרן.',
    cancel: 'קיין טעלעפֿאָן נישט אויסגעקליבן.',
    busy: 'אַן אַנדער פּראָגראַם ניצט ADB. פֿאַרמאַכט זי און פּרוּווט ווידער.',
    connect: 'פֿאַרבינדן',
    disconnect: 'אָפּטיילן',
    check: 'קאָנטראָלירן אַפּס',
    install: 'אינסטאַלירן אויסגעקליבענע אַפּס',
    phoneFound: 'טעלעפֿאָן געפֿונען. קאָנטראָלירט די אַפּס איידער דער אינסטאַלאַציע.',
    checking: 'קאָנטראָלירט אַפּס אויפֿן טעלעפֿאָן…',
    checkDone: 'דער קאָנטראָל איז פֿאַרטיק. שוין אינסטאַלירטע אַפּס בלײַבן.',
    installStart: 'אינסטאַלירט די פֿעלנדיקע אַפּס…',
    installDone: 'די אינסטאַלאַציע איז פֿאַרטיק. קאָנטראָלירט דעם טעלעפֿאָן.',
    ownerDone: 'דעדיקירטער־מכשיר מאָדוס איז אַקטיוו. YiDream איז דער היים־עקראַן.',
    ownerConfirm: 'דאָס שטעלט YiDream ווי דעם מכשיר־באַזיצער. עס איז פֿאַר אַ נײַעם אָדער צוריקגעשטעלטן טעלעפֿאָן אָן צוגעלייגטן חשבון. Android קען אָפּזאָגן אויב דער טעלעפֿאָן איז שוין איינגעשטעלט. ווײַטער?',
    noDevice: 'פֿאַרבינדט ערשט אַ טעלעפֿאָן.',
    noLauncher: 'YiDream Launcher פֿעלט, און עס איז נישט פֿאַרעפֿנטלעכט קיין אונטערגעשריבענער APK פֿאַר דער ווערסיע.',
    needApk: 'קלײַבט דעם אָפֿיציעלן APK פֿאַר דער אַפּ און הייבט אָן ווידער.',
    launcherReady: 'דער אונטערגעשריבענער APK איז גרייט צום אָפּלאָדן.',
    launcherSigning: 'דער אונטערגעשריבענער APK איז נישט בנימצא: קאָנטראָלירט GitHub signing און די לעצטע build.',
    installed: 'אינסטאַלירט',
    missing: 'פֿעלט',
    notSelected: 'נישט אויסגעקליבן',
    zemerRelease: 'ברענגט די לעצטע אָפֿיציעלע Zemer release…',
    zemerFetchFail: 'Zemer האָט זיך נישט געקענט אראפלאדן אויטאָמאַטיש. ניצט דעם Google Play קנעפּל צו אינסטאַלירן.',
    skipped: 'קיין APK נישט אויסגעקליבן. עפֿנט Google Play, אינסטאַלירט די אַפּ און קאָנטראָלירט ווידער.',
    ownerError: 'Android האָט נישט געקענט אַקטיווירן דעם דעדיקירטן מאָדוס. געוויינטלעך דאַרף דער טעלעפֿאָן זײַן נײַ/צוריקגעשטעלט אָן חשבון.',
    permission: 'דערלויבט USB-דעבאַגינג אויפֿן טעלעפֿאָן און פּרוּווט ווידער.',
    steps: 'אַקטיווירט Developer options און USB-דעבאַגינג, ניצט אַ דאַטן־קאַבל און באַשטעטיקט די RSA פֿינגער־אָפּדרוק.',
    statusCurrent: 'אינסטאַלירט · בלײַבט',
    updateAvailable: 'אַ דערהייַנטיקונג איז בנימצא',
    statusMissing: 'פֿעלט · אינסטאַלירן',
    statusUnselected: 'נישט אויסגעקליבן',
    statusNeedsPlay: 'פֿעלט · Google Play',
    sizeError: 'APK איז נישט גילטיק אָדער צו גרויס.',
    operationFailed: 'די אָפּעראַציע איז דורכגעפֿאַלן.',
    noRelease: 'די אָפֿיציעלע Zemer release האָט נישט קיין פּאַסיקן APK.',
  },
};

let language = document.documentElement.lang || 'fr';
let buildInfo = { releaseReady: false };
let appState = null;
let deviceOwnerActive = false;
let zemerFetchFailed = false;

class YZWebAdb {
  constructor() {
    this.adb = null;
    this.info = null;
    this.credentialStore = new AdbWebCredentialStore('YiDream YZ-MDM WebADB');
    this.onDisconnect = () => {};
  }

  static get supported() {
    return Boolean(AdbDaemonWebUsbDeviceManager.BROWSER);
  }

  require() {
    if (!this.adb) throw new Error('NOT_CONNECTED');
    return this.adb;
  }

  async connect(onStep) {
    const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
    if (!manager) throw new Error('UNSUPPORTED');
    onStep('searching');
    const device = await manager.requestDevice();
    if (!device) throw new Error('NO_DEVICE');
    onStep('connecting');
    let connection;
    try {
      connection = await device.connect();
    } catch (error) {
      if (error instanceof AdbDaemonWebUsbDevice.DeviceBusyError) throw new Error('ADB_BUSY');
      throw error;
    }
    onStep('authenticating');
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore: this.credentialStore,
    });
    this.adb = new Adb(transport);
    this.adb.disconnected.then(() => {
      this.adb = null;
      this.info = null;
      this.onDisconnect();
    });
    this.info = await this.readInfo();
    return this.info;
  }

  async disconnect() {
    const adb = this.adb;
    this.adb = null;
    this.info = null;
    if (adb) await adb.close();
  }

  async sh(args) {
    const sub = this.require().subprocess;
    if (sub.shellProtocol) {
      const result = await sub.shellProtocol.spawnWaitText(args);
      return { exitCode: result.exitCode, out: `${result.stdout}${result.stderr}`.trim() };
    }
    const output = await sub.noneProtocol.spawnWaitText(args);
    return { exitCode: null, out: output.trim() };
  }

  async readInfo() {
    const adb = this.require();
    const [model, manufacturer, android, sdk] = await Promise.all([
      adb.getProp('ro.product.model'),
      adb.getProp('ro.product.manufacturer'),
      adb.getProp('ro.build.version.release'),
      adb.getProp('ro.build.version.sdk'),
    ]);
    return { serial: adb.serial, model: model || '?', manufacturer: manufacturer || '', android, sdk };
  }

  async isInstalled(pkg) {
    const result = await this.sh(['pm', 'list', 'packages', pkg]);
    return result.out.split('\n').some((line) => line.trim() === `package:${pkg}`);
  }

  async appVersion(pkg) {
    const result = await this.sh(['dumpsys', 'package', pkg]);
    return {
      name: result.out.match(/versionName=([^\s]+)/)?.[1] || '',
      code: Number(result.out.match(/versionCode=(\d+)/)?.[1] || 0),
    };
  }

  async installApk(file) {
    if (!file || file.size < 100_000 || file.size > 300_000_000) throw new Error('APK_SIZE');
    const packageManager = new PackageManager(this.require());
    await packageManager.installStream(file.size, file.stream());
  }

  static isSuccess(result) {
    if (result.exitCode === 0) return true;
    if (result.exitCode === null) return /Success|Starting:\s*Intent/i.test(result.out);
    return false;
  }

  async isDeviceOwner() {
    const result = await this.sh(['dumpsys', 'device_policy']);
    const start = result.out.search(/Device Owner(?:\s*\([^)]*\))?\s*:/i);
    if (start < 0) return false;
    const tail = result.out.slice(start, start + 1200);
    const profileOwner = tail.search(/Profile Owner\s*:/i);
    const section = profileOwner >= 0 ? tail.slice(0, profileOwner) : tail;
    return section.includes('com.yz.mdm') && section.includes('AdminReceiver');
  }

  setDeviceOwner() {
    return this.sh(['dpm', 'set-device-owner', OWNER_COMPONENT]);
  }

  removeDeviceOwner() {
    return this.sh(['dpm', 'remove-active-admin', OWNER_COMPONENT]);
  }
}

const adb = new YZWebAdb();
const el = (id) => document.getElementById(id);
const msg = (key) => (STRINGS[language] || STRINGS.fr)[key] || STRINGS.fr[key] || key;

function setStatus(text, kind = '') {
  const status = el('runtimeStatus');
  status.textContent = text;
  status.className = `runtime-message ${kind}`;
}

function setStep(active) {
  [1, 2, 3].forEach((number) => {
    const node = el(`step${number}`);
    node.classList.toggle('active', number === active);
  });
}

function selectedApps() {
  return {
    zemer: document.querySelector('[data-app="zemer"] .select').checked,
    waze: document.querySelector('[data-app="waze"] .select').checked,
    pulsar: document.querySelector('[data-app="pulsar"] .select').checked,
  };
}

function setDeviceUi(connected, info = null) {
  window.webAdbConnected = connected;
  if (!connected) deviceOwnerActive = false;
  const connectBtn = el('connectBtn');
  connectBtn.textContent = msg(connected ? 'disconnect' : 'connect');
  connectBtn.disabled = false;
  el('checkBtn').disabled = !connected;
  el('installBtn').disabled = !connected || !window.webAdbHasCheck;
  el('usbIcon').textContent = connected ? '✓' : '⌁';
  el('usbIcon').style.color = connected ? 'var(--green)' : '';
  if (info) {
    const phone = [info.manufacturer, info.model].filter(Boolean).join(' ');
    el('deviceTitle').textContent = phone || msg('connected');
    el('deviceSubtitle').textContent = `Android ${info.android || '?'} · SDK ${info.sdk || '?'}`;
    el('deviceMeta').hidden = false;
    el('deviceMeta').textContent = `ADB · ${info.serial}`;
    el('actionNote').textContent = msg('phoneFound');
    setStep(2);
  } else {
    el('deviceTitle').textContent = msg(connected ? 'connected' : 'deviceTitle');
    el('deviceSubtitle').textContent = msg(connected ? 'usbAllowed' : 'deviceHint');
    el('deviceMeta').hidden = true;
    el('deviceMeta').textContent = '';
    el('actionNote').textContent = msg(connected ? 'phoneFound' : 'startHint');
    window.webAdbHasCheck = false;
    appState = null;
    updateButtons();
    if (!connected) setStep(1);
  }
  updateButtons();
}

function updateButtons() {
  el('checkBtn').disabled = !adb.adb;
  el('installBtn').disabled = !adb.adb || !window.webAdbHasCheck;
  el('ownerBtn').disabled = !adb.adb || !appState?.launcher?.installed || deviceOwnerActive;
  el('ownerBtn').hidden = deviceOwnerActive;
  el('ownerRemoveWarning').hidden = !deviceOwnerActive;
  el('removeOwnerBtn').disabled = !adb.adb || !deviceOwnerActive;
  el('removeOwnerBtn').hidden = !deviceOwnerActive;
}

async function refreshOwnerStatus() {
  if (!adb.adb) {
    deviceOwnerActive = false;
    updateButtons();
    return;
  }
  try { deviceOwnerActive = await adb.isDeviceOwner(); }
  catch { deviceOwnerActive = false; }
  updateButtons();
}

function needsLauncherUpdate() {
  return Boolean(appState?.launcher?.installed && buildInfo.releaseReady &&
    buildInfo.versionCode && appState.launcher.versionCode &&
    appState.launcher.versionCode < Number(buildInfo.versionCode));
}

function renderStatuses() {
  if (!appState) return;
  for (const id of ['launcher', 'zemer', 'waze', 'pulsar']) {
    const status = el(`status-${id}`);
    const isSelected = id === 'launcher' || selectedApps()[id];
    if (!isSelected) {
      status.textContent = msg('statusUnselected');
      status.className = 'result';
    } else if (id === 'launcher' && needsLauncherUpdate()) {
      status.textContent = `${msg('updateAvailable')} · v${appState.launcher.version || appState.launcher.versionCode} → v${buildInfo.versionName}`;
      status.className = 'result warn';
    } else if (appState[id]?.installed) {
      const version = appState[id]?.version ? ` · v${appState[id].version}` : '';
      status.textContent = `${msg('statusCurrent')}${version}`;
      status.className = 'result ok';
    } else if (id === 'waze' || id === 'pulsar') {
      status.textContent = msg('statusNeedsPlay');
      status.className = 'result warn';
    } else {
      status.textContent = msg('statusMissing');
      status.className = 'result warn';
    }
  }
  updateButtons();
}

function refreshRuntimeCopy() {
  el('storeZemer').textContent = msg('storeZemer');
  el('storeWaze').textContent = msg('storeWaze');
  el('storePulsar').textContent = msg('storePulsar');
  el('ownerSummary').textContent = msg('ownerSummary');
  el('ownerWarning').textContent = msg('ownerWarning');
  el('ownerRemoveWarning').textContent = msg('ownerRemoveWarning');
  el('ownerBtn').textContent = msg('ownerButton');
  el('removeOwnerBtn').textContent = msg('ownerRemoveButton');
}
function showFileOptions() {
  if (!appState) return;
  const selected = selectedApps();
  const missing = {
    zemer: selected.zemer && !appState.zemer?.installed,
    waze: selected.waze && !appState.waze?.installed,
    pulsar: selected.pulsar && !appState.pulsar?.installed,
  };
  const showZemerStore = missing.zemer && zemerFetchFailed;
  const launcherUnavailable = (!appState.launcher?.installed || needsLauncherUpdate()) && !buildInfo.releaseReady;
  el('runtimeFiles').hidden = !Object.values(missing).some(Boolean) && !launcherUnavailable;
  el('fileTitle').textContent = msg('filesTitle');
  el('fileHint').textContent = launcherUnavailable ? msg('launcherSigning') : msg('filesHint');
  el('storeLinks').hidden = !(showZemerStore || missing.waze || missing.pulsar);
  el('storeZemer').hidden = !showZemerStore;
  el('storeWaze').hidden = !missing.waze;
  el('storePulsar').hidden = !missing.pulsar;
}
async function checkApps() {
  if (!adb.adb) throw new Error('NOT_CONNECTED');
  setStatus(msg('checking'));
  setProgress(msg('checking'), 0, 0, true);
  let entries;
  try {
    entries = await Promise.all(Object.entries(APP).map(async ([id, app]) => {
      const installed = await adb.isInstalled(app.package);
      const version = installed ? await adb.appVersion(app.package) : { name: '', code: 0 };
      return [id, { installed, version: version.name, versionCode: version.code }];
    }));
  } finally {
    el('runtimeProgress').hidden = true;
  }
  appState = Object.fromEntries(entries);
  window.webAdbHasCheck = true;
  renderStatuses();
  await refreshOwnerStatus();
  showFileOptions();
  el('runtimeProgress').hidden = true;
  el('actionNote').textContent = msg('checkDone');
  el('installBtn').disabled = false;
  el('ownerBtn').disabled = !appState.launcher.installed;
  setStatus(msg('checkDone'), 'success');
  setStep(2);
}

async function fetchLatestZemer() {
  const response = await fetch('https://api.github.com/repos/ZemerTeam/zemer-app/releases/latest', {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('ZEMER_RELEASE');
  const release = await response.json();
  const asset = release.assets?.find((item) => /\.apk$/i.test(item.name));
  if (!asset?.browser_download_url) throw new Error('ZEMER_NO_APK');
  const apk = await fetch(asset.browser_download_url);
  if (!apk.ok) throw new Error('ZEMER_DOWNLOAD');
  const blob = await apk.blob();
  if (!blob.type.includes('android') && blob.size < 100_000) throw new Error('ZEMER_DOWNLOAD');
  return blob;
}

async function getLauncherApk() {
  if (!buildInfo.releaseReady) throw new Error('LAUNCHER_NOT_READY');
  const url = new URL('./downloads/yz-mdm.apk', location.href);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('LAUNCHER_DOWNLOAD');
  return response.blob();
}

function setProgress(label, completed = 0, total = 0, busy = false) {
  const root = el('runtimeProgress');
  const fill = el('progressFill');
  root.hidden = false;
  el('progressLabel').textContent = label;
  el('progressCount').textContent = total
    ? `${Math.min(completed + (busy ? 1 : 0), total)} / ${total}`
    : '';
  fill.classList.toggle('busy', busy);
  fill.style.width = total ? `${Math.round(completed / total * 100)}%` : '0%';
}

async function openStoreApp(id) {
  const packageName = APP[id]?.package;
  if (!packageName) throw new Error('STORE_OPEN_FAILED');
  const market = await adb.sh(['am', 'start', '-a', 'android.intent.action.VIEW', '-d', `market://details?id=${packageName}`]);
  if (YZWebAdb.isSuccess(market)) return;
  const web = await adb.sh(['am', 'start', '-a', 'android.intent.action.VIEW', '-d', `https://play.google.com/store/apps/details?id=${packageName}`]);
  if (!YZWebAdb.isSuccess(web)) throw new Error('STORE_OPEN_FAILED');
}

async function installOne(id, file) {
  setStatus(`${id}: ${file.name || 'APK'}`);
  await adb.installApk(file);
}

async function installSelected() {
  await buildInfoPromise;
  if (!adb.adb || !appState) throw new Error('NOT_CONNECTED');
  const selection = selectedApps();
  zemerFetchFailed = false;
  const missingApps = ['zemer', 'waze', 'pulsar'].filter((id) => selection[id] && !appState[id].installed);
  const launcherNeedsInstall = !appState.launcher.installed || needsLauncherUpdate();
  if (launcherNeedsInstall && !buildInfo.releaseReady) {
    showFileOptions();
    throw new Error('LAUNCHER_NOT_READY');
  }
  const autoApps = missingApps.filter((id) => id === 'zemer');
  const storeApps = missingApps.filter((id) => id === 'waze' || id === 'pulsar');
  const total = autoApps.length + (launcherNeedsInstall ? 1 : 0) + (storeApps.length ? 1 : 0);
  if (!total) {
    setStatus(msg('checkDone'), 'success');
    el('actionNote').textContent = msg('checkDone');
    return;
  }
  setStatus(msg('installStart'));
  setStep(3);
  const failed = [];
  let completed = 0;
  try {
    for (const id of autoApps) {
      setProgress(id === 'zemer' ? msg('zemerRelease') : msg('installStart'), completed, total, true);
      try {
        const file = await fetchLatestZemer();
        setProgress(`${msg('zemerName')} · ${msg('installStart')}`, completed, total, true);
        await installOne(id, file);
      } catch (error) {
        zemerFetchFailed = true;
        failed.push({ id, error: error?.message === 'ZEMER_NO_APK' ? new Error('NO_RELEASE') : new Error('ZEMER_FETCH') });
      }
      completed++;
      setProgress(msg('installStart'), completed, total, false);
    }
    if (launcherNeedsInstall) {
      setProgress(msg('launcherName'), completed, total, true);
      try {
        const file = await getLauncherApk();
        await installOne('launcher', file);
      } catch (error) {
        failed.push({ id: 'launcher', error });
      }
      completed++;
      setProgress(msg('installStart'), completed, total, false);
    }
    if (storeApps.length) {
      const id = storeApps[0];
      setProgress(msg('openingStore'), completed, total, true);
      try { await openStoreApp(id); }
      catch (error) { failed.push({ id, error }); }
      completed++;
      setProgress(msg('installStart'), completed, total, false);
    }
  } finally {
    el('runtimeProgress').hidden = true;
  }
  await checkApps();
  if (failed.length) {
    const reason = failed.map(({ id, error }) => `${id}: ${error?.message || msg('operationFailed')}`).join(' · ');
    setStatus(reason, 'error');
    el('actionNote').textContent = msg('operationFailed');
  } else if (storeApps.length) {
    setStatus(msg('storeOpened'), 'warn');
    el('actionNote').textContent = msg('storeOpened');
  } else {
    setStatus(msg('installDone'), 'success');
    el('actionNote').textContent = msg('installDone');
  }
}
async function activateOwner() {
  if (!adb.adb) throw new Error('NOT_CONNECTED');
  if (!appState?.launcher?.installed) throw new Error('LAUNCHER_NOT_READY');
  if (!window.confirm(msg('ownerConfirm'))) return;
  el('ownerBtn').disabled = true;
  setStatus(msg('connecting'));
  const result = await adb.setDeviceOwner();
  if (!YZWebAdb.isSuccess(result)) {
    const detail = result.out || msg('ownerError');
    throw new Error(`OWNER_REJECTED: ${detail}`);
  }
  await refreshOwnerStatus();
  setStatus(msg('ownerDone'), 'success');
  el('actionNote').textContent = msg('ownerDone');
}

async function removeOwner() {
  if (!adb.adb || !deviceOwnerActive) throw new Error('NOT_CONNECTED');
  if (!window.confirm(msg('ownerRemoveConfirm'))) return;
  el('removeOwnerBtn').disabled = true;
  setStatus(msg('connecting'));
  const result = await adb.removeDeviceOwner();
  if (!YZWebAdb.isSuccess(result)) {
    const detail = result.out || msg('ownerRemoveError');
    throw new Error(`OWNER_REMOVE_REJECTED: ${detail}`);
  }
  await refreshOwnerStatus();
  if (deviceOwnerActive) throw new Error(`OWNER_REMOVE_REJECTED: ${msg('ownerRemoveError')}`);
  setStatus(msg('ownerRemoved'), 'success');
  el('actionNote').textContent = msg('ownerRemoved');
}
function userError(error) {
  const value = error?.message || '';
  if (value === 'NOT_CONNECTED') return msg('noDevice');
  if (value === 'UNSUPPORTED') return msg('unsupported');
  if (value === 'NO_DEVICE' || error?.name === 'NotFoundError' || error?.name === 'AbortError') return msg('cancel');
  if (value === 'ADB_BUSY') return msg('busy');
  if (value === 'LAUNCHER_NOT_READY') return msg('noLauncher');
  if (value === 'ZEMER_FETCH') return msg('zemerFetchFail');
  if (value === 'NO_RELEASE') return msg('noRelease');
  if (value === 'STORE_OPEN_FAILED') return msg('storeOpenError');
  if (value.startsWith('OWNER_REMOVE_REJECTED:')) return `${msg('ownerRemoveError')} ${value.slice('OWNER_REMOVE_REJECTED:'.length)}`;
  if (value.startsWith('OWNER_REJECTED:')) return `${msg('ownerError')} ${value.slice('OWNER_REJECTED:'.length)}`;
  if (error?.name === 'SecurityError' || /permission|denied|authoriz/i.test(value)) return msg('permission');
  return `${msg('operationFailed')} ${value}`;
}

async function handle(action) {
  try { await action(); }
  catch (error) { setStatus(userError(error), 'error'); }
}

el('connectBtn').addEventListener('click', () => handle(async () => {
  if (adb.adb) {
    await adb.disconnect();
    setDeviceUi(false);
    setStatus(msg('disconnected'));
    return;
  }
  if (!YZWebAdb.supported) throw new Error('UNSUPPORTED');
  el('connectBtn').disabled = true;
  try {
    await adb.connect((state) => setStatus(msg(state)));
  } catch (error) {
    el('connectBtn').disabled = false;
    throw error;
  }
  setDeviceUi(true, adb.info);
  await refreshOwnerStatus();
  setStatus(msg('connected'), 'success');
  adb.onDisconnect = () => {
    setDeviceUi(false);
    setStatus(msg('disconnected'));
  };
}));
el('checkBtn').addEventListener('click', () => handle(checkApps));
el('installBtn').addEventListener('click', () => handle(installSelected));
el('ownerBtn').addEventListener('click', () => handle(activateOwner));
el('removeOwnerBtn').addEventListener('click', () => handle(removeOwner));
el('storeZemer').addEventListener('click', () => handle(async () => {
  await openStoreApp('zemer');
  setStatus(msg('storeOpened'), 'warn');
}));
el('storeWaze').addEventListener('click', () => handle(async () => {
  await openStoreApp('waze');
  setStatus(msg('storeOpened'), 'warn');
}));
el('storePulsar').addEventListener('click', () => handle(async () => {
  await openStoreApp('pulsar');
  setStatus(msg('storeOpened'), 'warn');
}));

document.querySelectorAll('.select').forEach((input) => {
  input.addEventListener('change', () => {
    if (!window.webAdbHasCheck) return;
    renderStatuses();
    showFileOptions();
  });
});

window.addEventListener('installer-language', (event) => {
  language = event.detail || 'fr';
  if (adb.adb) {
    el('connectBtn').textContent = msg('disconnect');
    if (adb.info) {
      const phone = [adb.info.manufacturer, adb.info.model].filter(Boolean).join(' ');
      el('deviceTitle').textContent = phone || msg('connected');
    }
  }
  refreshRuntimeCopy();
  if (window.webAdbHasCheck) {
    renderStatuses();
    showFileOptions();
  }
  if (buildInfo.releaseReady) el('copyApkDownload').textContent = `YiDream Launcher · v${buildInfo.versionName} · ${msg('signedApk')}`;
});

async function loadBuildInfo() {
  try {
    const response = await fetch('./build-info.json', { cache: 'no-store' });
    if (response.ok) buildInfo = await response.json();
  } catch {}
  if (buildInfo.releaseReady) {
    const link = el('copyApkDownload');
    link.href = './downloads/yz-mdm.apk';
    link.hidden = false;
    link.textContent = `YiDream Launcher · v${buildInfo.versionName} · ${msg('signedApk')}`;
    setStatus(msg('launcherReady'), 'success');
  } else {
    el('copyApkDownload').hidden = true;
    setStatus(msg('launcherSigning'));
  }
  if (!YZWebAdb.supported) setStatus(msg('unsupported'), 'warn');
  else if (!buildInfo.releaseReady) el('actionNote').textContent = msg('launcherSigning');
  if (window.webAdbHasCheck) { renderStatuses(); showFileOptions(); }
}

window.webAdbConnected = false;
window.webAdbHasCheck = false;
window.webAdbSetStatus = setStatus;
const buildInfoPromise = loadBuildInfo();
