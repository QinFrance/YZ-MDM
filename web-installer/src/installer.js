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
    noLauncher: 'YiDream Launcher est absent. Ajoutez un APK signé avec la clé de la version déjà installée, ou activez le téléchargement de release.',
    needApk: 'Sélectionnez l’APK officiel pour cette application, puis relancez l’installation.',
    launcherReady: 'APK signé prêt à télécharger.',
    launcherSigning: 'APK de release indisponible : ajoutez les secrets de signature GitHub ou choisissez un APK signé.',
    installed: 'Installée',
    missing: 'Absente',
    notSelected: 'Non sélectionnée',
    zemerRelease: 'Récupération de la dernière version officielle de Zemer…',
    zemerFetchFail: 'Téléchargement automatique de Zemer impossible. Choisissez son APK officiel.',
    skipped: 'Pas d’APK fourni : ouvrez Google Play, installez l’application puis revérifiez.',
    ownerError: 'Android n’a pas activé le mode dédié. Le téléphone doit généralement être neuf/réinitialisé et sans compte.',
    permission: 'Autorisez le débogage USB sur le téléphone, puis réessayez.',
    steps: 'Activez les options développeur et le débogage USB, branchez un câble de données et acceptez l’empreinte RSA.',
    statusCurrent: 'Installée · conservée',
    statusMissing: 'Absente · à installer',
    statusUnselected: 'Non sélectionnée',
    statusNeedsPlay: 'Absente · Google Play',
    sizeError: 'APK invalide ou trop volumineux.',
    operationFailed: 'Échec de l’opération.',
    noRelease: 'La release officielle de Zemer ne contient pas d’APK compatible.',
  },
  en: {
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
    noLauncher: 'YiDream Launcher is missing. Choose an APK signed with the same key as any existing install, or enable release downloads.',
    needApk: 'Choose the official APK for this app, then start installation again.',
    launcherReady: 'Signed APK is ready to download.',
    launcherSigning: 'Release APK unavailable: add GitHub signing secrets or choose a signed APK.',
    installed: 'Installed',
    missing: 'Missing',
    notSelected: 'Not selected',
    zemerRelease: 'Getting the latest official Zemer release…',
    zemerFetchFail: 'Could not download Zemer automatically. Choose its official APK.',
    skipped: 'No APK selected. Open Google Play, install the app, then check again.',
    ownerError: 'Android could not enable dedicated-device mode. The phone usually must be new/reset and have no account.',
    permission: 'Approve USB debugging on the phone, then try again.',
    steps: 'Enable Developer options and USB debugging, use a data-capable cable, and approve the RSA fingerprint.',
    statusCurrent: 'Installed · kept',
    statusMissing: 'Missing · to install',
    statusUnselected: 'Not selected',
    statusNeedsPlay: 'Missing · Google Play',
    sizeError: 'Invalid or oversized APK.',
    operationFailed: 'The operation failed.',
    noRelease: 'The official Zemer release has no compatible APK.',
  },
  he: {
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
    noLauncher: 'YiDream Launcher חסר. בחרו APK חתום באותו מפתח או הפעילו הורדות release.',
    needApk: 'בחרו APK רשמי לאפליקציה זו והפעילו שוב את ההתקנה.',
    launcherReady: 'APK חתום מוכן להורדה.',
    launcherSigning: 'APK release אינו זמין: הוסיפו סודות חתימה ב‑GitHub או בחרו APK חתום.',
    installed: 'מותקנת',
    missing: 'חסרה',
    notSelected: 'לא נבחרה',
    zemerRelease: 'מוריד את הגרסה הרשמית האחרונה של Zemer…',
    zemerFetchFail: 'לא ניתן להוריד את Zemer אוטומטית. בחרו APK רשמי.',
    skipped: 'לא נבחר APK. פתחו את Google Play, התקינו את האפליקציה ובדקו שוב.',
    ownerError: 'Android לא הפעיל מצב ייעודי. בדרך כלל הטלפון צריך להיות חדש/מאופס וללא חשבון.',
    permission: 'אשרו ניפוי באגים ב‑USB בטלפון ונסו שוב.',
    steps: 'הפעילו אפשרויות מפתחים וניפוי באגים ב‑USB, השתמשו בכבל נתונים ואשרו את טביעת RSA.',
    statusCurrent: 'מותקנת · נשארת',
    statusMissing: 'חסרה · להתקנה',
    statusUnselected: 'לא נבחרה',
    statusNeedsPlay: 'חסרה · Google Play',
    sizeError: 'APK לא תקין או גדול מדי.',
    operationFailed: 'הפעולה נכשלה.',
    noRelease: 'בגרסת Zemer הרשמית אין APK תואם.',
  },
  yi: {
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
    noLauncher: 'YiDream Launcher פֿעלט. קלײַבט אַן APK אונטערגעשריבן מיט דעם זעלבן שליסל ווי אַן עקזיסטירנדיקער אינסטאַלאַציע, אָדער שטעלט צו release downloads.',
    needApk: 'קלײַבט דעם אָפֿיציעלן APK פֿאַר דער אַפּ און הייבט אָן ווידער.',
    launcherReady: 'דער אונטערגעשריבענער APK איז גרייט צום אָפּלאָדן.',
    launcherSigning: 'Release APK איז נישט בנימצא: שטעלט צו GitHub signing secrets אָדער קלײַבט אַן אונטערגעשריבענעם APK.',
    installed: 'אינסטאַלירט',
    missing: 'פֿעלט',
    notSelected: 'נישט אויסגעקליבן',
    zemerRelease: 'ברענגט די לעצטע אָפֿיציעלע Zemer release…',
    zemerFetchFail: 'קען נישט אָפּלאָדן Zemer אויטאָמאַטיש. קלײַבט דעם אָפֿיציעלן APK.',
    skipped: 'קיין APK נישט אויסגעקליבן. עפֿנט Google Play, אינסטאַלירט די אַפּ און קאָנטראָלירט ווידער.',
    ownerError: 'Android האָט נישט געקענט אַקטיווירן דעם דעדיקירטן מאָדוס. געוויינטלעך דאַרף דער טעלעפֿאָן זײַן נײַ/צוריקגעשטעלט אָן חשבון.',
    permission: 'דערלויבט USB-דעבאַגינג אויפֿן טעלעפֿאָן און פּרוּווט ווידער.',
    steps: 'אַקטיווירט Developer options און USB-דעבאַגינג, ניצט אַ דאַטן־קאַבל און באַשטעטיקט די RSA פֿינגער־אָפּדרוק.',
    statusCurrent: 'אינסטאַלירט · בלײַבט',
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
    return result.out.match(/versionName=([^\s]+)/)?.[1] || '';
  }

  async installApk(file) {
    if (!file || file.size < 100_000 || file.size > 300_000_000) throw new Error('APK_SIZE');
    const packageManager = new PackageManager(this.require());
    await packageManager.installStream(file.size, file.stream());
  }

  static isSuccess(result) {
    if (result.exitCode === 0) return true;
    if (result.exitCode === null) return /Success/i.test(result.out);
    return false;
  }

  setDeviceOwner() {
    return this.sh(['dpm', 'set-device-owner', OWNER_COMPONENT]);
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
  el('ownerBtn').disabled = !adb.adb || !appState?.launcher?.installed;
}

function renderStatuses() {
  if (!appState) return;
  for (const id of ['launcher', 'zemer', 'waze', 'pulsar']) {
    const status = el(`status-${id}`);
    const isSelected = id === 'launcher' || selectedApps()[id];
    if (!isSelected) {
      status.textContent = msg('statusUnselected');
      status.className = 'result';
    } else if (appState[id]?.installed) {
      const version = appState[id]?.version ? ` · v${appState[id].version}` : '';
      status.textContent = `${msg('statusCurrent')}${version}`;
      status.className = 'result ok';
    } else if ((id === 'waze' || id === 'pulsar') && !el(`file-${id}`).files.length) {
      status.textContent = msg('statusNeedsPlay');
      status.className = 'result warn';
    } else {
      status.textContent = msg('statusMissing');
      status.className = 'result warn';
    }
  }
  updateButtons();
}

function showFileOptions() {
  const selected = selectedApps();
  const showFor = {
    launcher: !appState?.launcher?.installed && !buildInfo.releaseReady,
    zemer: selected.zemer && !appState?.zemer?.installed,
    waze: selected.waze && !appState?.waze?.installed,
    pulsar: selected.pulsar && !appState?.pulsar?.installed,
  };
  let visible = false;
  for (const id of Object.keys(showFor)) {
    const label = el(`pick-${id}-label`);
    label.hidden = !showFor[id];
    visible ||= showFor[id];
  }
  el('storeLinks').hidden = !(showFor.waze || showFor.pulsar);
  el('runtimeFiles').hidden = !visible;
  if (!buildInfo.releaseReady && showFor.launcher) {
    el('fileTitle').textContent = msg('launcherSigning');
  } else {
    el('fileTitle').textContent = msg('needApk');
  }
}

async function checkApps() {
  if (!adb.adb) throw new Error('NOT_CONNECTED');
  setStatus(msg('checking'));
  const entries = await Promise.all(Object.entries(APP).map(async ([id, app]) => {
    const installed = await adb.isInstalled(app.package);
    return [id, { installed, version: installed ? await adb.appVersion(app.package) : '' }];
  }));
  appState = Object.fromEntries(entries);
  window.webAdbHasCheck = true;
  renderStatuses();
  showFileOptions();
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
  if (buildInfo.releaseReady) {
    const url = new URL('./downloads/yz-mdm.apk', location.href);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('LAUNCHER_DOWNLOAD');
    return response.blob();
  }
  const local = el('file-launcher').files[0];
  if (local) return local;
  throw new Error('LAUNCHER_NOT_READY');
}

async function installOne(id, file) {
  setStatus(`${id}: ${file.name || 'APK'}`);
  await adb.installApk(file);
}

async function installSelected() {
  await buildInfoPromise;
  if (!adb.adb || !appState) throw new Error('NOT_CONNECTED');
  const selection = selectedApps();
  const list = ['zemer', 'waze', 'pulsar'].filter((id) => selection[id] && !appState[id].installed);
  const launcherMissing = !appState.launcher.installed;
  if (launcherMissing && !buildInfo.releaseReady && !el('file-launcher').files[0]) {
    showFileOptions();
    throw new Error('LAUNCHER_NOT_READY');
  }
  setStatus(msg('installStart'));
  el('runtimeProgress').hidden = false;
  el('progressLabel').textContent = msg('installStart');
  setStep(3);
  const failed = [];
  const skipped = [];
  for (const id of list) {
    try {
      let file = el(`file-${id}`).files[0];
      if (!file && id === 'zemer') {
        el('progressLabel').textContent = msg('zemerRelease');
        try { file = await fetchLatestZemer(); }
        catch { showFileOptions(); throw new Error('ZEMER_FETCH'); }
      }
      if (!file) {
        skipped.push(id);
        setStatus(`${id}: ${msg('skipped')}`, 'warn');
        continue;
      }
      el('progressLabel').textContent = `${id} · ${file.name || 'APK'}`;
      await installOne(id, file);
    } catch (error) {
      failed.push({ id, error });
    }
  }
  if (launcherMissing) {
    try {
      const file = await getLauncherApk();
      await installOne('launcher', file);
    } catch (error) {
      failed.push({ id: 'launcher', error });
    }
  }
  el('runtimeProgress').hidden = true;
  await checkApps();
  if (failed.length) {
    const reason = failed.map(({ id, error }) => `${id}: ${error?.message || msg('operationFailed')}`).join(' · ');
    setStatus(reason, 'error');
    el('actionNote').textContent = msg('operationFailed');
  } else if (skipped.length) {
    const reason = `${msg('installDone')} ${skipped.join(', ')}: ${msg('skipped')}`;
    setStatus(reason, 'warn');
    el('actionNote').textContent = reason;
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
  setStatus(msg('ownerDone'), 'success');
  el('actionNote').textContent = msg('ownerDone');
}

function userError(error) {
  const value = error?.message || '';
  if (value === 'NOT_CONNECTED') return msg('noDevice');
  if (value === 'UNSUPPORTED') return msg('unsupported');
  if (value === 'NO_DEVICE' || error?.name === 'NotFoundError' || error?.name === 'AbortError') return msg('cancel');
  if (value === 'ADB_BUSY') return msg('busy');
  if (value === 'LAUNCHER_NOT_READY') return msg('noLauncher');
  if (value === 'ZEMER_FETCH') return msg('zemerFetchFail');
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
  setStatus(msg('connected'), 'success');
  adb.onDisconnect = () => {
    setDeviceUi(false);
    setStatus(msg('disconnected'));
  };
}));
el('checkBtn').addEventListener('click', () => handle(checkApps));
el('installBtn').addEventListener('click', () => handle(installSelected));
el('ownerBtn').addEventListener('click', () => handle(activateOwner));

for (const input of document.querySelectorAll('.apk-file input')) {
  input.addEventListener('change', () => {
    if (window.webAdbHasCheck) renderStatuses();
  });
}

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
  if (window.webAdbHasCheck) {
    renderStatuses();
    showFileOptions();
  }
  if (buildInfo.releaseReady) el('copyApkDownload').textContent = `YiDream Launcher · v${buildInfo.versionName} · APK`;
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
    link.textContent = `YiDream Launcher · v${buildInfo.versionName} · APK signé`;
    setStatus(msg('launcherReady'), 'success');
  } else {
    el('copyApkDownload').hidden = true;
    setStatus(msg('launcherSigning'));
  }
  if (!YZWebAdb.supported) setStatus(msg('unsupported'), 'warn');
  else if (!buildInfo.releaseReady) el('actionNote').textContent = msg('launcherSigning');
  if (window.webAdbHasCheck) showFileOptions();
}

window.webAdbConnected = false;
window.webAdbHasCheck = false;
window.webAdbSetStatus = setStatus;
const buildInfoPromise = loadBuildInfo();
