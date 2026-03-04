package com.tokenfrenzy.app

import android.net.Uri
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import org.bitcoinj.core.Base58
import com.solana.mobilewalletadapter.clientlib.*
import com.solana.publickey.SolanaPublicKey
import com.solana.programs.SystemProgram
import com.solana.transaction.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class SolanaWallet(private val activity: ComponentActivity) {

    companion object {
        private const val TAG = "SolanaWallet"
        private const val RPC_URL = "https://mainnet.helius-rpc.com/?api-key=b011653b-63da-4e7b-a03f-b7d92e6dcd2a"
        private const val CLUSTER = "mainnet-beta"

        private const val APP_NAME = "Token Frenzy"
        private const val APP_URI = "https://tokenfrenzy.app"
        private const val APP_ICON = "favicon.ico"
        
        private const val PREFS_NAME = "TokenFrenzyPrefs"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_WALLET_ADDRESS = "wallet_address"
    }

    private var walletPublicKey: SolanaPublicKey? = null
    private var authToken: String? = null
    
    val isConnected: Boolean get() = walletPublicKey != null
    val walletAddress: String? get() = walletPublicKey?.let { Base58.encode(it.bytes) }

    private val sender = ActivityResultSender(activity)
    private val walletAdapter = MobileWalletAdapter(
        connectionIdentity = ConnectionIdentity(
            identityUri = Uri.parse(APP_URI),
            iconUri = Uri.parse(APP_ICON),
            identityName = APP_NAME
        )
    )

    init {
        val prefs = activity.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
        val savedAddr = prefs.getString(KEY_WALLET_ADDRESS, null)
        authToken = prefs.getString(KEY_AUTH_TOKEN, null)
        if (savedAddr != null && authToken != null) {
            walletPublicKey = SolanaPublicKey(Base58.decode(savedAddr))
            Log.d(TAG, "Restored wallet address: $savedAddr")
        }
    }

    fun connect(
        onSuccess: (walletAddress: String) -> Unit,
        onError: (error: String) -> Unit
    ) {
        activity.lifecycleScope.launch {
            try {
                val result = walletAdapter.connect(sender)
                when (result) {
                    is TransactionResult.Success -> {
                        val account = result.authResult.accounts.first()
                        walletPublicKey = SolanaPublicKey(account.publicKey)
                        val address = Base58.encode(account.publicKey)
                        authToken = result.authResult.authToken
                        
                        activity.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE).edit().apply {
                            putString(KEY_AUTH_TOKEN, authToken)
                            putString(KEY_WALLET_ADDRESS, address)
                            apply()
                        }
                        
                        Log.d(TAG, "Connected: $address")
                        withContext(Dispatchers.Main) { onSuccess(address) }
                    }
                    is TransactionResult.NoWalletFound -> {
                        withContext(Dispatchers.Main) {
                            onError("No Solana wallet app found. Install Phantom or Solflare.")
                        }
                    }
                    is TransactionResult.Failure -> {
                        withContext(Dispatchers.Main) {
                            onError("Connection failed: ${result.e.message}")
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Connect error", e)
                withContext(Dispatchers.Main) { onError("Error: ${e.message}") }
            }
        }
    }

    fun disconnect() {
        walletPublicKey = null
        authToken = null
        activity.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE).edit().clear().apply()
    }

    fun sendSol(
        recipientAddress: String,
        amountInSol: Double,
        onSuccess: (transactionSignature: String) -> Unit,
        onError: (error: String) -> Unit
    ) {
        val pubKey = walletPublicKey
        if (pubKey == null) {
            onError("Wallet not connected")
            return
        }

        activity.lifecycleScope.launch {
            try {
                val lamports = kotlin.math.round(amountInSol * 1_000_000_000.0).toLong()
                val recipientKey = SolanaPublicKey(Base58.decode(recipientAddress))

                Log.d(TAG, "sendSol: fetching blockhash...")
                val blockhash = withContext(Dispatchers.IO) {
                    val url = URL(RPC_URL)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    OutputStreamWriter(conn.outputStream).use {
                        it.write("""{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}""")
                    }
                    val resp = conn.inputStream.bufferedReader().use { it.readText() }
                    conn.disconnect()
                    JSONObject(resp).getJSONObject("result").getJSONObject("value").getString("blockhash")
                }

                val transferTx = buildTransferTransaction(
                    blockhash = blockhash,
                    fromPublicKey = pubKey,
                    toPublicKey = recipientKey,
                    lamports = lamports
                )

                Log.d(TAG, "sendSol: opening wallet...")
                val result = walletAdapter.transact(sender) {
                    val currentToken = authToken
                    if (currentToken != null) {
                        try {
                            val authResult = reauthorize(
                                identityUri = Uri.parse(APP_URI),
                                iconUri = Uri.parse(APP_ICON),
                                identityName = APP_NAME,
                                authToken = currentToken
                            )
                            authToken = authResult.authToken
                        } catch (e: Exception) {
                            Log.d(TAG, "reauthorize failed, falling back to authorize", e)
                            val authResult = authorize(
                                identityUri = Uri.parse(APP_URI),
                                iconUri = Uri.parse(APP_ICON),
                                identityName = APP_NAME,
                                chain = "solana:mainnet"
                            )
                            authToken = authResult.authToken
                        }
                    } else {
                        val authResult = authorize(
                            identityUri = Uri.parse(APP_URI),
                            iconUri = Uri.parse(APP_ICON),
                            identityName = APP_NAME,
                            chain = "solana:mainnet"
                        )
                        authToken = authResult.authToken
                    }

                    signAndSendTransactions(arrayOf(transferTx.serialize()))
                }
                
                // save updated token
                authToken?.let {
                    activity.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE).edit()
                        .putString(KEY_AUTH_TOKEN, it)
                        .apply()
                }

                when (result) {
                    is TransactionResult.Success -> {
                        val sigBytes = result.successPayload?.signatures?.firstOrNull()
                        val signature = if (sigBytes != null) Base58.encode(sigBytes) else "confirmed"
                        withContext(Dispatchers.Main) { onSuccess(signature) }
                    }
                    is TransactionResult.NoWalletFound -> {
                        withContext(Dispatchers.Main) { onError("No wallet app found") }
                    }
                    is TransactionResult.Failure -> {
                        val msg = result.e.message ?: "Unknown"
                        withContext(Dispatchers.Main) {
                            onError(when {
                                msg.contains("decline", true) -> "Transaction declined"
                                msg.contains("reject", true) -> "Transaction rejected"
                                msg.contains("cancel", true) -> "Transaction cancelled"
                                else -> "Transaction failed: $msg"
                            })
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "sendSol error", e)
                withContext(Dispatchers.Main) {
                    onError("Send failed: ${e.message}")
                }
            }
        }
    }

    private fun buildTransferTransaction(
        blockhash: String,
        fromPublicKey: SolanaPublicKey,
        toPublicKey: SolanaPublicKey,
        lamports: Long
    ): Transaction {
        val message = Message.Builder()
            .addInstruction(
                SystemProgram.transfer(fromPublicKey, toPublicKey, lamports)
            )
            .setRecentBlockhash(blockhash)
            .build()
        return Transaction(message)
    }

    @Volatile private var isMinting = false

    fun mintGamePass(
        onSuccess: (signature: String) -> Unit,
        onError: (error: String) -> Unit
    ) {
        if (isMinting) {
            onError("Already processing a mint request")
            return
        }

        val pubKey = walletPublicKey
        if (pubKey == null) {
            onError("Wallet not connected. Please connect first.")
            return
        }

        val ownerAddr = walletAddress
        if (ownerAddr == null) {
            onError("Wallet address unavailable")
            return
        }

        isMinting = true
        activity.lifecycleScope.launch {
            try {
                val lamports = 13_000_000L  // 0.013 SOL
                val treasuryKey = SolanaPublicKey(Base58.decode("pR7YkBj2AsRLB7sSNJEyaSnengSF3c9UUQDH1y26NBi"))

                val blockhash = withContext(Dispatchers.IO) {
                    val url = URL(RPC_URL)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    OutputStreamWriter(conn.outputStream).use {
                        it.write("""{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}""")
                    }
                    val resp = conn.inputStream.bufferedReader().use { it.readText() }
                    conn.disconnect()
                    JSONObject(resp).getJSONObject("result").getJSONObject("value").getString("blockhash")
                }

                val transferTx = buildTransferTransaction(
                    blockhash = blockhash,
                    fromPublicKey = pubKey,
                    toPublicKey = treasuryKey,
                    lamports = lamports
                )

                val txResult = walletAdapter.transact(sender) {
                    val currentToken = authToken
                    if (currentToken != null) {
                        try {
                            val authResult = reauthorize(
                                identityUri = Uri.parse(APP_URI),
                                iconUri = Uri.parse(APP_ICON),
                                identityName = APP_NAME,
                                authToken = currentToken
                            )
                            authToken = authResult.authToken
                        } catch (e: Exception) {
                            Log.d(TAG, "reauthorize failed, falling back to authorize", e)
                            val authResult = authorize(
                                identityUri = Uri.parse(APP_URI),
                                iconUri = Uri.parse(APP_ICON),
                                identityName = APP_NAME,
                                chain = "solana:mainnet"
                            )
                            authToken = authResult.authToken
                        }
                    } else {
                        val authResult = authorize(
                            identityUri = Uri.parse(APP_URI),
                            iconUri = Uri.parse(APP_ICON),
                            identityName = APP_NAME,
                            chain = "solana:mainnet"
                        )
                        authToken = authResult.authToken
                    }
                    signAndSendTransactions(arrayOf(transferTx.serialize()))
                }

                // save updated token
                authToken?.let {
                    activity.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE).edit()
                        .putString(KEY_AUTH_TOKEN, it)
                        .apply()
                }

                when (txResult) {
                    is TransactionResult.Success -> {
                        val sigBytes = txResult.successPayload?.signatures?.firstOrNull()
                        val paymentSig = if (sigBytes != null) Base58.encode(sigBytes) else "confirmed"
                        
                        val mintId = withContext(Dispatchers.IO) {
                            mintNftViaHelius(ownerAddr)
                        }

                        val finalResult = if (mintId != null) "success:$paymentSig:$mintId" else "success:$paymentSig"
                        isMinting = false
                        withContext(Dispatchers.Main) { onSuccess(finalResult) }
                    }
                    is TransactionResult.Failure -> {
                        isMinting = false
                        val msg = txResult.e.message ?: "Unknown"
                        withContext(Dispatchers.Main) {
                            onError(when {
                                msg.contains("reject", true) -> "Transaction rejected"
                                else -> "Transaction failed: $msg"
                            })
                        }
                    }
                    else -> {
                        isMinting = false
                        withContext(Dispatchers.Main) { onError("Mint failed") }
                    }
                }
            } catch (e: Exception) {
                isMinting = false
                Log.e(TAG, "mintGamePass: exception", e)
                withContext(Dispatchers.Main) { onError("Mint failed: ${e.message}") }
            }
        }
    }

    private fun mintNftViaHelius(ownerAddress: String): String? {
        return try {
            val url = URL(RPC_URL)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 30000
            conn.readTimeout = 30000

            val body = JSONObject().apply {
                put("jsonrpc", "2.0")
                put("id", "mint-game-pass")
                put("method", "mintCompressedNft")
                put("params", JSONObject().apply {
                    put("name", "Token Frenzy Game Pass")
                    put("symbol", "TFGP")
                    put("owner", ownerAddress)
                    put("description", "Permanent Game Pass for Token Frenzy")
                    put("imageUrl", "https://gateway.pinata.cloud/ipfs/bafybeielmvw7uejrf4e3qx7zteojlkjab3jox62x22cnodbghquzbv2lva")
                    put("externalUrl", "https://tokenfrenzy.app")
                    put("sellerFeeBasisPoints", 0)
                })
            }

            OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
            val code = conn.responseCode
            val text = if (code in 200..299) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else {
                conn.errorStream?.bufferedReader()?.use { it.readText() } ?: "HTTP $code"
            }
            conn.disconnect()

            if (code in 200..299) {
                val json = JSONObject(text)
                val resultObj = json.optJSONObject("result")
                resultObj?.optString("assetId", "minted") ?: "minted"
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
