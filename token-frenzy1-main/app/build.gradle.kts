plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.tokenfrenzy.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tokenfrenzy.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Core Android & WebView
    implementation("androidx.webkit:webkit:1.10.0")
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")

    // Solana Mobile MWA
    implementation("com.solanamobile:mobile-wallet-adapter-clientlib-ktx:2.0.3")

    // Solana web3 (transaction building, public keys)
    implementation("com.solanamobile:web3-solana:0.2.5")

    // Solana RPC client
    implementation("com.solanamobile:rpc-core:0.2.8")

    // Ktor network driver (required by rpc-core)
    implementation("io.ktor:ktor-client-cio:2.3.7")

    // Base58
    implementation("org.bitcoinj:bitcoinj-core:0.16.2")

    // Android lifecycle + activity
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-ktx:1.8.2")

    // Fix for NoClassDefFoundError: Failed resolution of: Lcom/ditchoom/buffer/BufferFactoryJvm
    implementation("com.ditchoom:buffer-jvm:1.3.0")
}

configurations.all {
    exclude(group = "com.ditchoom", module = "buffer-android")
    resolutionStrategy {
        force("androidx.core:core-ktx:1.12.0")
        force("androidx.core:core:1.12.0")
        force("androidx.activity:activity:1.8.2")
        force("androidx.activity:activity-ktx:1.8.2")
    }
}
