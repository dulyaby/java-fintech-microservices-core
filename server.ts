/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { User, Wallet, Transaction, WebhookLog, SystemLog } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Fintech Mock Databases
let users: User[] = [
  { id: 'usr_1', name: 'Alice Kilama', email: 'alice@fintech.test', phone: '+255712345678', role: 'PAYEE' },
  { id: 'usr_2', name: 'Bob Malima', email: 'bob@fintech.test', phone: '+255787654321', role: 'PAYER' },
  { id: 'usr_3', name: 'Safari Lodge Merchant', email: 'merchant@safari.test', phone: '+255655112233', role: 'MERCHANT' }
];

let wallets: Wallet[] = [
  { id: 'wlt_1', userId: 'usr_1', phone: '+255712345678', balance: 180000, currency: 'TZS', lastUpdated: new Date().toISOString() },
  { id: 'wlt_2', userId: 'usr_2', phone: '+255787654321', balance: 45000, currency: 'TZS', lastUpdated: new Date().toISOString() },
  { id: 'wlt_3', userId: 'usr_3', phone: '+255655112233', balance: 500000, currency: 'TZS', lastUpdated: new Date().toISOString() }
];

let transactions: Transaction[] = [];
let systemLogs: SystemLog[] = [
  { id: 'log_init', timestamp: new Date().toISOString(), service: 'Payment Gateway', level: 'INFO', message: 'Fintech Microservices Gateway Simulator Booted.' }
];
let webhookLogs: WebhookLog[] = [];
let webhookSecret = 'fintech_auth_webhook_secure_hash_secret_key_2026';

// Simulated Webhook URL (Default is a mock loopback URL or user customized)
let webhookUrl = 'https://webhook.site/demo-fintech-callback';

// JWT Signing Secret
const JWT_SECRET = 'fintech_super_secret_session_token_key_for_jwt_2026';

// Rate Limiter configuration (Token Bucket)
const RATE_LIMIT_CAPACITY = 10;
const RATE_LIMIT_REFILL_RATE = 1; // 1 token per second
let rateLimiterBucket = {
  tokens: RATE_LIMIT_CAPACITY,
  lastRefilled: Date.now()
};

// Rate limiting token bucket logic
function refillBucket() {
  const now = Date.now();
  const secondsElapsed = (now - rateLimiterBucket.lastRefilled) / 1000;
  rateLimiterBucket.tokens = Math.min(
    RATE_LIMIT_CAPACITY,
    rateLimiterBucket.tokens + secondsElapsed * RATE_LIMIT_REFILL_RATE
  );
  rateLimiterBucket.lastRefilled = now;
}

// Custom simple JWT generator to show real encryption/decryption without heavy external dependencies
function signJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const sPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${sHeader}.${sPayload}`);
  const signature = hmac.digest('base64url');
  
  return `${sHeader}.${sPayload}.${signature}`;
}

function verifyJWT(token: string): any {
  try {
    const [sHeader, sPayload, signature] = token.split('.');
    if (!sHeader || !sPayload || !signature) return null;
    
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${sHeader}.${sPayload}`);
    const validSignature = hmac.digest('base64url');
    
    if (signature === validSignature) {
      const payloadStr = Buffer.from(sPayload, 'base64url').toString();
      return JSON.parse(payloadStr);
    }
  } catch (err) {
    return null;
  }
  return null;
}

// Add system log helper
function addLog(service: SystemLog['service'], level: SystemLog['level'], message: string) {
  const newLog: SystemLog = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    service,
    level,
    message
  };
  systemLogs.unshift(newLog);
  if (systemLogs.length > 100) systemLogs.pop();
}

// Initialize Gemini client (telemetry verified: user-agent applied)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Mock Webhook Target sender
async function triggerWebhook(transaction: Transaction) {
  const payload = {
    eventType: 'payment.completed',
    timestamp: new Date().toISOString(),
    data: {
      transactionId: transaction.id,
      reference: transaction.reference,
      sender: transaction.senderPhone,
      receiver: transaction.receiverPhone,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      failReason: transaction.failReason
    }
  };

  // HMAC SHA256 Signature computation for webhook authorization safety
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(JSON.stringify(payload));
  const signature = hmac.digest('hex');

  const logId = 'wh_' + Math.random().toString(36).substr(2, 9);
  addLog('Queue Broker', 'INFO', `Webhook dispatch triggered for Tx: ${transaction.id}`);

  // In standard systems, we attempt to make a fetch. Since this is a demo, we will log it.
  // We simulate a successful call or a failure based on target URL
  const isDemoFailure = webhookUrl.includes('fail-sandbox');
  const whLog: WebhookLog = {
    id: logId,
    timestamp: new Date().toISOString(),
    url: webhookUrl,
    payload,
    status: isDemoFailure ? 'FAILED' : 'SUCCESS',
    responseCode: isDemoFailure ? 500 : 200
  };
  webhookLogs.unshift(whLog);
  
  if (isDemoFailure) {
    addLog('Queue Broker', 'ERROR', `Webhook callback to ${webhookUrl} failed (simulated 500)`);
  } else {
    addLog('Queue Broker', 'SUCCESS', `Webhook callback successfully verified under signature head 'X-Fintech-Signature'`);
  }
}

// Simulated Async Messaging Queue Broker (Kafka / RabbitMQ Simulation)
function publishToAsyncQueue(transaction: Transaction) {
  addLog('Queue Broker', 'INFO', `Publishing transaction event to topic 'transaction-events-v1'`);
  
  setTimeout(() => {
    addLog('Notification Service', 'INFO', `Async Notification listener picked up event 'payment.completed' from queue`);
    
    // Simulating SMS/Email Dispatch
    const smsMsg = `Habari! Umepokea ${transaction.currency} ${transaction.amount.toLocaleString()} kutoka kwa ${transaction.senderPhone}. Kumbukumbu No: ${transaction.reference}. Ahsante!`;
    const buyerEmail = `Dear Customer, you have successfully sent ${transaction.currency} ${transaction.amount.toLocaleString()} to ${transaction.receiverPhone}. Wallet Tx: ${transaction.id}.`;
    
    addLog('Notification Service', 'SUCCESS', `SMS successfully dispatched to: ${transaction.receiverPhone} -> [Content: ${smsMsg.substring(0, 45)}...]`);
    addLog('Notification Service', 'SUCCESS', `Receipt email completed for: ${transaction.senderPhone}`);
    
    // Hook callback async pipeline trigger
    triggerWebhook(transaction);
  }, 1000);
}

// API Endpoints
// Auth login for getting microservices JWT
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // High secure dummy validator
  const matchedUser = users.find(u => u.email === email);
  if (!matchedUser) {
    return res.status(401).json({ success: false, error: 'User not registered in server' });
  }

  const token = signJWT({
    id: matchedUser.id,
    name: matchedUser.name,
    email: matchedUser.email,
    phone: matchedUser.phone,
    role: matchedUser.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 Hour
  });

  addLog('User Service', 'SUCCESS', `JWT Token successfully signed & generated for user: ${matchedUser.email}`);
  res.json({ success: true, token, user: matchedUser });
});

// GET Wallet Details
app.get('/api/wallets', (req, res) => {
  res.json({ success: true, wallets, users });
});

// Reset simulation state
app.post('/api/simulation/reset', (req, res) => {
  wallets = [
    { id: 'wlt_1', userId: 'usr_1', phone: '+255712345678', balance: 180000, currency: 'TZS', lastUpdated: new Date().toISOString() },
    { id: 'wlt_2', userId: 'usr_2', phone: '+255787654321', balance: 45000, currency: 'TZS', lastUpdated: new Date().toISOString() },
    { id: 'wlt_3', userId: 'usr_3', phone: '+255655112233', balance: 500000, currency: 'TZS', lastUpdated: new Date().toISOString() }
  ];
  transactions = [];
  systemLogs = [
    { id: 'log_reset', timestamp: new Date().toISOString(), service: 'Payment Gateway', level: 'INFO', message: 'Simulation Database Reset completed successfully.' }
  ];
  webhookLogs = [];
  res.json({ success: true, wallets, transactions, systemLogs, webhookLogs });
});

// API Live Rate Limiting check
app.get('/api/simulate/rate-limit', (req, res) => {
  refillBucket();
  
  const limit = RATE_LIMIT_CAPACITY;
  const resetTime = Math.ceil((RATE_LIMIT_CAPACITY - rateLimiterBucket.tokens) / RATE_LIMIT_REFILL_RATE);
  
  res.setHeader('X-Rate-Limit-Limit', limit.toString());
  res.setHeader('X-Rate-Limit-Remaining', Math.floor(rateLimiterBucket.tokens).toString());
  res.setHeader('X-Rate-Limit-Reset', resetTime.toString());

  if (rateLimiterBucket.tokens < 1) {
    addLog('Payment Gateway', 'ERROR', `Preemptive security rate limiting tripped! Request rejected with HTTP 429`);
    return res.status(429).json({
      success: false,
      error: 'Preemptive rate limit exceeded. Brute force mitigation active.',
      retryAfterSeconds: resetTime
    });
  }

  rateLimiterBucket.tokens -= 1;
  res.json({
    success: true,
    tokensRemaining: Math.floor(rateLimiterBucket.tokens),
    maxCapacity: RATE_LIMIT_CAPACITY,
    message: 'Request authorized under microservices security context'
  });
});

// Configure webhook URL
app.post('/api/webhooks/config', (req, res) => {
  const { url, secret } = req.body;
  if (url) webhookUrl = url;
  if (secret) webhookSecret = secret;
  addLog('Payment Gateway', 'INFO', `Webhook callback endpoint reconfigured: ${webhookUrl}`);
  res.json({ success: true, webhookUrl, webhookSecret });
});

// POST Payment request (ACID database transactions simulated step-by-step)
app.post('/api/payment/request', (req, res) => {
  // Authorization simulation logger
  const authHeader = req.headers['authorization'];
  let loggedInUser = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    loggedInUser = verifyJWT(token);
  }

  const { senderPhone, receiverPhone, amount, currency, failureMode } = req.body;
  const numAmount = parseFloat(amount);
  const txRef = 'TXN_' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] INITIALIZING fintech dual-entry ledger block context.`);
  logs.push(`[${new Date().toISOString()}] PARSING metadata. Amount: ${currency} ${numAmount}, Sender: ${senderPhone}, Receiver: ${receiverPhone}`);

  if (loggedInUser) {
    logs.push(`[${new Date().toISOString()}] SECURITY: JWT Verified. Authenticated sub: ${loggedInUser.email}`);
  } else {
    logs.push(`[${new Date().toISOString()}] SECURITY: No valid JWT in headers, processing in Dev Sandbox context.`);
  }

  // Pre-checks
  if (!senderPhone || !receiverPhone || isNaN(numAmount) || numAmount <= 0) {
    logs.push(`[${new Date().toISOString()}] [ABORT] Invalid transaction input arguments.`);
    return res.status(400).json({ success: false, error: 'Invalid input parameters', logs });
  }

  // Find Wallets under simulated DB Locking (ACID compliance simulation)
  addLog('Wallet Service', 'INFO', `Tx request ${txRef}: Acquiring pessimistic write locks on wallets.`);
  logs.push(`[${new Date().toISOString()}] DB: SELECT * FROM wallets WHERE phone IN ('${senderPhone}', '${receiverPhone}') FOR UPDATE (Pessimistic Write Lock)`);

  const senderWalletIndex = wallets.findIndex(w => w.phone === senderPhone);
  const receiverWalletIndex = wallets.findIndex(w => w.phone === receiverPhone);

  if (senderWalletIndex === -1 || receiverWalletIndex === -1) {
    addLog('Wallet Service', 'ERROR', `Tx request ${txRef} aborted. Sender or receiver wallet not found.`);
    logs.push(`[${new Date().toISOString()}] [ABORT] Lock acquired failed: Target wallet not found in DB tables.`);
    return res.status(404).json({ success: false, error: 'Sender or receiver phone wallet record not found', logs });
  }

  const senderWallet = wallets[senderWalletIndex];
  const receiverWallet = wallets[receiverWalletIndex];

  // Begin Transaction
  logs.push(`[${new Date().toISOString()}] DB: BEGIN TRANSACTION (isolation_level = ISOLATION_SERIALIZABLE)`);

  // Check balance
  logs.push(`[${new Date().toISOString()}] WALLET STATE: Balance check -> Sender balance: ${senderWallet.balance}, Deduction requested: ${numAmount}`);
  if (senderWallet.balance < numAmount || failureMode === 'insufficient_balance') {
    logs.push(`[${new Date().toISOString()}] [ERROR] Balance validation failed. Insufficient funds in ${senderPhone}.`);
    logs.push(`[${new Date().toISOString()}] DB: ROLLBACK TRANSACTION TO SAVEPOINT_INIT. Balance unchanged.`);
    
    addLog('Wallet Service', 'WARNING', `Tx ${txRef} failed: Insufficient funds for sender phone ${senderPhone}`);
    
    const failedTx: Transaction = {
      id: 'txn_' + Math.random().toString(36).substr(2, 9),
      reference: txRef,
      senderPhone,
      receiverPhone,
      amount: numAmount,
      currency,
      status: 'FAILED',
      failReason: 'Insufficient Funds',
      timestamp: new Date().toISOString(),
      stepLogs: logs
    };
    transactions.unshift(failedTx);
    return res.status(400).json({ success: false, error: 'Insufficient funds inside wallet', logs, transaction: failedTx });
  }

  // If Simulated Database/System Error for rollback demonstration
  if (failureMode === 'database_crash') {
    // We deduct sender wallet first to show "dirty calculation", but crash midway and trigger ACID rollback restoring balance!
    logs.push(`[${new Date().toISOString()}] STEP 1: Deducting sender balance dynamically.`);
    const tempSenderBalance = senderWallet.balance - numAmount;
    logs.push(`[${new Date().toISOString()}] Sender Balance temporarily set to: ${tempSenderBalance}`);
    
    logs.push(`[${new Date().toISOString()}] STEP 2: Connecting to receiver's ledger unit...`);
    logs.push(`[${new Date().toISOString()}] [CRITICAL FAULT] Simulated DB Transaction Timeout / Database Out of Disk Space.`);
    logs.push(`[${new Date().toISOString()}] EXCEPTION: org.postgresql.util.PSQLException: Connection reset by peer.`);
    logs.push(`[${new Date().toISOString()}] ACID ENGINE: Caught exception, triggering manual rollbacks to guarantee dual-entry ledger alignment!`);
    logs.push(`[${new Date().toISOString()}] DB: ROLLBACK TRANSACTION to snapshot stamp. Restored sender balance back to original ${senderWallet.balance}`);
    
    addLog('Wallet Service', 'ERROR', `ACID TRANSACTION ROLLBACK: Recovered sender phone ${senderPhone} from dirty partial state write!`);
    
    const failedTx: Transaction = {
      id: 'txn_' + Math.random().toString(36).substr(2, 9),
      reference: txRef,
      senderPhone,
      receiverPhone,
      amount: numAmount,
      currency,
      status: 'REVERTED',
      failReason: 'ACID Rollback: Simulated Database System Exception (Deduction Rollback)',
      timestamp: new Date().toISOString(),
      stepLogs: logs
    };
    transactions.unshift(failedTx);
    return res.status(500).json({ success: false, error: 'Postgres DB Exception: Transaction Rollback Executed Successfully', logs, transaction: failedTx });
  }

  // Normal Successful transfer execution
  try {
    // 1. Deduct sender
    logs.push(`[${new Date().toISOString()}] OPERATION: Deduct sender balance: ${senderWallet.balance} - ${numAmount}`);
    senderWallet.balance -= numAmount;
    senderWallet.lastUpdated = new Date().toISOString();

    // 2. Credit receiver
    logs.push(`[${new Date().toISOString()}] OPERATION: Credit receiver balance: ${receiverWallet.balance} + ${numAmount}`);
    receiverWallet.balance += numAmount;
    receiverWallet.lastUpdated = new Date().toISOString();

    // 3. Commit
    logs.push(`[${new Date().toISOString()}] DB: COMMIT TRANSACTION. Dual-entry ledger balance verified.`);
    
    const successTx: Transaction = {
      id: 'txn_' + Math.random().toString(36).substr(2, 9),
      reference: txRef,
      senderPhone,
      receiverPhone,
      amount: numAmount,
      currency,
      status: 'SUCCESSFUL',
      timestamp: new Date().toISOString(),
      stepLogs: logs
    };
    transactions.unshift(successTx);

    addLog('Wallet Service', 'SUCCESS', `Db transaction committed. Tx: ${txRef}. ${currency} ${numAmount} transferred.`);
    
    // Publish message asynchronously to Kafka/RabbitMQ simulating event listeners
    publishToAsyncQueue(successTx);

    res.json({ success: true, transaction: successTx, logs });
  } catch (error: any) {
    // Catch-all system rollback
    logs.push(`[${new Date().toISOString()}] [FATAL] Dual entry ledger mismatch or unhandled exception: ${error.message}`);
    logs.push(`[${new Date().toISOString()}] DB: FORCE ROLLBACK ENFORCED.`);
    
    addLog('Wallet Service', 'ERROR', `System breakdown triggered transaction rollback for Tx ${txRef}`);
    res.status(500).json({ success: false, error: 'Ledger processing exception', logs });
  }
});

// GET System simulation components
app.get('/api/simulation/logs', (req, res) => {
  res.json({
    success: true,
    systemLogs,
    webhookLogs,
    transactions,
    webhookUrl,
    webhookSecret,
    rateLimitRemaining: Math.floor(rateLimiterBucket.tokens)
  });
});

// AES Sandbox helper
app.post('/api/crypto/aes', (req, res) => {
  const { text, mode, keyInput } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'No text provided' });
  
  const encryptionKey = crypto.createHash('sha256').update(keyInput || 'default_fintech_key').digest(); // 32 bytes

  try {
    if (mode === 'encrypt') {
      const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
      const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');
      
      res.json({
        success: true,
        encryptedHex: encrypted,
        ivHex: iv.toString('hex'),
        tagHex: tag,
        fullySecureString: btoa(JSON.stringify({ c: encrypted, i: iv.toString('hex'), t: tag }))
      });
    } else {
      // Decrypt
      let decrypted = '';
      try {
        const parsed = JSON.parse(atob(text));
        const iv = Buffer.from(parsed.i, 'hex');
        const tag = Buffer.from(parsed.t, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
        decipher.setAuthTag(tag);
        decrypted = decipher.update(parsed.c, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        res.json({ success: true, decrypted });
      } catch (e) {
        // Fallback hex extraction if raw input
        res.status(400).json({ success: false, error: 'Could not decrypt the cipher text. Key mismatch or compromised signature!' });
      }
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// server-side Gemini architecture guide
app.post('/api/gemini/explain', async (req, res) => {
  const { history, prompt } = req.body;
  
  if (!ai) {
    return res.status(503).json({
      success: false,
      reply: 'Gemini API not configured. Please add GEMINI_API_KEY in the Secrets panel in AI Studio UI settings.'
    });
  }

  try {
    // Generate contents including context instructions
    const systemInstruction = 
      `You are a Senior Fintech Architecture Consultant specialized in high-performance billing, dual-entry credit/debit core banking ledger engines, Spring Boot, microservices architecture, and security protocols like OAuth, HMAC signatures, rate limit buffers, and queue decouplers (Kafka/RabbitMQ).
      The user queries features related to payment systems, database transactional consistency (ACID, Pessimistic Lock, Isolation Levels), message systems, and OAuth/JWT verification.
      Always reply in a helpful, highly organized, architectural, and educational tone.
      You can reply dynamically in Swahili (as the user started with Swahili) or English, matching the prompt language format. Encourage excellent code and robust fintech structures.`;

    const contents = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.message }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({ success: true, reply: response.text });
  } catch (err: any) {
    console.error('Gemini call error:', err);
    res.status(500).json({ success: false, error: 'Gemini server error: ' + err.message });
  }
});

// Vite middleware flow
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
