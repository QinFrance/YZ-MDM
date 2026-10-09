plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val signingStoreFile = System.getenv("YZMDM_SIGNING_STORE_FILE")
val signingStorePassword = System.getenv("YZMDM_STORE_PASSWORD")
val signingKeyAlias = System.getenv("YZMDM_KEY_ALIAS")
val signingKeyPassword = System.getenv("YZMDM_KEY_PASSWORD")
val releaseSigningReady = listOf(
    signingStoreFile, signingStorePassword, signingKeyAlias, signingKeyPassword
).all { !it.isNullOrBlank() }

android {
    namespace = "com.yz.mdm"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.yz.mdm"
        minSdk = 26
        targetSdk = 35
        versionCode = 8
        versionName = "0.2.6"
    }

    signingConfigs {
        create("release") {
            if (releaseSigningReady) {
                storeFile = file(signingStoreFile!!)
                storePassword = signingStorePassword
                keyAlias = signingKeyAlias
                keyPassword = signingKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (releaseSigningReady) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
// La clé de release est fournie par GitHub Actions, jamais stockée dans ce dépôt.
