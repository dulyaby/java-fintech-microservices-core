/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Lock, Unlock, Key, RefreshCcw } from 'lucide-react';

export default function SecuritySimulator() {
  // Rate limiter state
  const [tokens, setTokens] = useState(10);
  const [limitStatus, setLimitStatus] = useState<string>('Preemptive rate-limiter loaded');
  const [lockoutSecs, setLockoutSecs] = useState<number>(0);
  const [triggerCount, setTriggerCount] = useState(0);

  // Encryption state
  const [plainText, setPlainText] = useState('CARD_NUMBER_4222_5555_1234_1111');
  const [encryptionKey, setEncryptionKey] = useState('fintech_demo_shared_secret_2026');
  const [encryptedValue, setEncryptedValue] = useState('');
  const [decryptedValue, setDecryptedValue] = useState('');
  const [encInfo, setEncInfo] = useState<any>(null);
  const [isEncLoading, setIsEncLoading] = useState(false);

  // Auto recovery countdown ticker for rate limiter lockout
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const interval = setInterval(() => {
      setLockoutSecs(prev => {
        if (prev <= 1) {
          // auto replenish state on client
          setTokens(10);
          setLimitStatus('Rate limit bucket automatically refilled!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSecs]);

  const handleSimulateCall = async () => {
    if (lockoutSecs > 0) return;

    try {
      const response = await fetch('/api/simulate/rate-limit');
      const data = await response.json();
      setTriggerCount(prev => prev + 1);

      if (response.ok) {
        setTokens(data.tokensRemaining);
        setLimitStatus(`HTTP 200 SUCCESS. Bucket remaining: ${data.tokensRemaining}/10 API tokens.`);
      } else if (response.status === 429) {
        setTokens(0);
        setLockoutSecs(data.retryAfterSeconds || 10);
        setLimitStatus(`❌ HTTP 429 EXCEEDED! Rate limiter lockout. Brute force defense triggered.`);
      }
    } catch (e: any) {
      setLimitStatus('Connection error: ' + e.message);
    }
  };

  const handleEncryptData = async () => {
    setIsEncLoading(true);
    setDecryptedValue('');
    try {
      const res = await fetch('/api/crypto/aes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plainText, mode: 'encrypt', keyInput: encryptionKey })
      });
      const data = await res.json();
      if (data.success) {
        setEncryptedValue(data.fullySecureString);
        setEncInfo({
          iv: data.ivHex,
          tag: data.tagHex,
          cipherHex: data.encryptedHex
        });
      }
    } catch (err: any) {
      setEncryptedValue('Encryption error: ' + err.message);
    } finally {
      setIsEncLoading(false);
    }
  };

  const handleDecryptData = async () => {
    if (!encryptedValue) return;
    setIsEncLoading(true);
    try {
      const res = await fetch('/api/crypto/aes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: encryptedValue, mode: 'decrypt', keyInput: encryptionKey })
      });
      const data = await res.json();
      if (data.success) {
        setDecryptedValue(data.decrypted);
      } else {
        setDecryptedValue('❌ Authentication signature invalid! Decryption blocked (Key tampering audit)');
      }
    } catch (err: any) {
      setDecryptedValue('Error decrypting: ' + err.message);
    } finally {
      setIsEncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* RATE LIMITING SIMULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
          <ShieldAlert className="text-amber-500 h-5 w-5 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Preemptive Security Sandbox: Rate Limiting</h3>
        </div>

        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          FinTech architecture employs token-rate controls to prevent scrapers or automated tools from exhausting processing computing limits. This demo uses a **Token Bucket** algorithm (capacity: 10, refill: 1/sec).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Visual Liquid Tank Meter */}
          <div className="flex flex-col items-center justify-center bg-slate-950 p-4 border border-slate-800 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-slate-500 mb-3">Rate Limit Bucket Level</span>
            <div className="w-16 h-36 bg-slate-900 border border-slate-700 rounded-2xl relative overflow-hidden shadow-inner flex flex-col justify-end">
              {/* Dynamic level background tank */}
              <div
                className="bg-gradient-to-t from-sky-600 to-sky-400 w-full transition-all duration-300"
                style={{ height: `${lockoutSecs > 0 ? 0 : (tokens / 10) * 100}%` }}
              />
              {/* Centered current count indicator */}
              <div className="absolute inset-0 flex items-center justify-center font-bold text-lg font-mono text-slate-100 drop-shadow">
                {lockoutSecs > 0 ? '0' : Math.floor(tokens)}
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-2">Tokens remaining / 10</span>
          </div>

          {/* Simulate controls and counts */}
          <div className="col-span-2 space-y-4">
            <div className="bg-slate-950/40 p-3.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Bucket Status</span>
              <p className="text-xs font-mono font-bold text-amber-500">{limitStatus}</p>

              {lockoutSecs > 0 && (
                <div className="mt-2.5 p-2 bg-red-950/50 border border-red-900/50 rounded flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  <p className="text-[11px] font-mono text-red-400 font-bold">
                    PREEMPTIVE BLOCK: Wait {lockoutSecs}s for token buffer regeneration.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateCall}
              disabled={lockoutSecs > 0}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs font-sans tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition ${
                lockoutSecs > 0
                  ? 'bg-red-950/40 text-red-500 border border-red-900/30 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 text-slate-950 shadow-[0_2px_10px_rgba(14,165,233,0.15)]'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>SPAM DIRECT API CALL (Simulate Brute Force Attack)</span>
            </button>

            <div className="text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Simulation calls triggered: <b className="text-slate-300">{triggerCount}</b></span>
              <span>Algorithm: Bucket4j / Sliding-window count</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA CONFIDENTIALITY ENCRYPTION SANDBOX */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
          <Lock className="text-emerald-400 h-5 w-5" />
          <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Fintech Core Encryption GCM Sandbox</h3>
        </div>

        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          FinTech standard requirements (PCI-DSS) restrict saving text credentials in database cells. This sandbox demonstrates **AES-256-GCM (Galois/Counter Mode)** verified block crypto with individual Initialization Vectors (IV).
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Sensitive Data Field</label>
              <input
                type="text"
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Cryptographic Base Key</label>
              <div className="flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <input
                  type="text"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleEncryptData}
              disabled={isEncLoading || !plainText}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>ENCRYPT TO AES-256-GCM CELL STRING [PCI-DSS COMPLIANT]</span>
            </button>

            {encryptedValue && (
              <div className="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-lg font-mono text-[11px] leading-relaxed select-all">
                <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Encrypted Payload Result (Base64 string):</span>
                <p className="text-emerald-400 break-all">{encryptedValue}</p>

                {encInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <div>
                      <span className="block font-bold">Initialization Vector (IV):</span>
                      <span className="text-slate-400 break-all">{encInfo.iv}</span>
                    </div>
                    <div>
                      <span className="block font-bold">AES HMAC Auth Tag:</span>
                      <span className="text-slate-400 break-all">{encInfo.tag}</span>
                    </div>
                    <div>
                      <span className="block font-bold">Encrypted CipherHex:</span>
                      <span className="text-slate-400 break-all">{encInfo.cipherHex}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={handleDecryptData}
                    className="bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white px-3 py-1.5 rounded text-[10px] cursor-pointer"
                  >
                    DECRYPT TARGET STRING WITH BASE KEY
                  </button>
                  {decryptedValue && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
                      <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Decrypted string:</span>
                      <span className="bg-slate-900 font-mono px-2 py-0.5 rounded border border-slate-800 text-emerald-300 select-all">{decryptedValue}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
