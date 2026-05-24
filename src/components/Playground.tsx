/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Send, AlertTriangle, CheckCircle2, Terminal, Info, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';

interface PlaygroundProps {
  onPaymentSuccess: () => void;
  rateLimitStatus: any;
  setRateLimitStatus: any;
}

export default function Playground({ onPaymentSuccess, rateLimitStatus, setRateLimitStatus }: PlaygroundProps) {
  const [sender, setSender] = useState('+255712345678'); // Alice default
  const [receiver, setReceiver] = useState('+255655112233'); // Merchant default
  const [amount, setAmount] = useState('25000');
  const [currency, setCurrency] = useState('TZS');
  const [failureMode, setFailureMode] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [txResult, setTxResult] = useState<Transaction | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Authenticate user to obtain token first
  useEffect(() => {
    // Default logged in Bob or Alice token simulation on mount
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@fintech.test' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setUserToken(data.token);
        }
      });
  }, []);

  // Animate printing out logs one-by-one
  useEffect(() => {
    if (consoleLogs.length === 0) return;
    setDisplayedLogs([]);
    let timerId: any;
    let index = 0;

    const printNextLog = () => {
      if (index < consoleLogs.length) {
        setDisplayedLogs(prev => [...prev, consoleLogs[index]]);
        index++;
        timerId = setTimeout(printNextLog, 250);
      }
    };

    printNextLog();
    return () => clearTimeout(timerId);
  }, [consoleLogs]);

  const handleSendPayment = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setConsoleLogs([]);
    setDisplayedLogs([]);
    setTxResult(null);

    // Initial loading outputs
    const startupLogs = [
      '[Preparing] Client constructing signed payment envelope...',
      '[Handshake] Dispatching POST \'/api/payment/request\' over HTTPS...'
    ];
    setConsoleLogs(startupLogs);

    try {
      // Small pause for visual realism
      await new Promise(r => setTimeout(r, 600));

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          senderPhone: sender,
          receiverPhone: receiver,
          amount,
          currency,
          failureMode
        })
      });

      const data = await response.json();
      
      if (data.logs) {
        setConsoleLogs(data.logs);
      } else {
        setConsoleLogs(prev => [...prev, '[SYSTEM ERROR] Unknown backend execution trace.']);
      }

      if (data.success) {
        setTxResult(data.transaction);
        onPaymentSuccess();
      } else {
        if (data.transaction) {
          setTxResult(data.transaction);
        }
        onPaymentSuccess(); // refresh db balances regardless to show updates/fails
      }
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `[FATAL] Gateway Connection Refused: ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <Send className="text-amber-500 h-5 w-5" />
        <h3 className="text-md font-bold text-slate-200">Payment Gateway API Playground</h3>
      </div>

      <form onSubmit={handleSendPayment} className="space-y-4">
        {/* Sender and Receiver */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Sender Account (Debited)</label>
            <select
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="+255712345678">Alice Kilama (+255712345678) [TZS 180K]</option>
              <option value="+255787654321">Bob Malima (+255787654321) [TZS 45K]</option>
              <option value="+255655112233">Safari Merchant (+255655112233) [TZS 500K]</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Receiver Account (Credited)</label>
            <select
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="+255655112233">Safari Lodge Merchant (+255655112233) [TZS 500K]</option>
              <option value="+255712345678">Alice Kilama (+255712345678) [TZS 180K]</option>
              <option value="+255787654321">Bob Malima (+255787654321) [TZS 45K]</option>
            </select>
          </div>
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1">Transfer Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-mono text-slate-400 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="TZS">TZS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Fault Injection Mode */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Fintech System Fault Injection Simulator</span>
          </div>
          <select
            value={failureMode}
            onChange={(e) => setFailureMode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-amber-400 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="none" className="text-slate-200">🟢 No Fault (Simulate Regular TZS Successful Transaction)</option>
            <option value="insufficient_balance" className="text-amber-400">🟡 Insufficient Funds (Simulates immediate business exception check)</option>
            <option value="database_crash" className="text-red-400">🔴 Postgres Connection Crash (Tests database transaction rollback & ACID consistency)</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-2">
            ACID validation: If &apos;Postgres Connection Failure&apos; is selected, a rollback is executed, ensuring balances do not remain in a partial split state.
          </p>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isLoading || (sender === receiver)}
          className={`w-full text-sm font-bold font-sans py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition ${
            sender === receiver 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Simulating Microservices Consensus...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Execute API Payment Request</span>
            </>
          )}
        </button>
      </form>

      {/* Interactive Microservices Trace Logs Terminal */}
      <div className="mt-5 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[280px]">
        <div className="bg-slate-900 px-3.5 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-300">Gateway Execution Traces (Serializable ISO)</span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        <div className="p-3.5 font-mono text-xs overflow-y-auto space-y-1.5 flex-1 select-none scrollbar-thin scrollbar-thumb-slate-800">
          {displayedLogs.length === 0 && (
            <div className="text-slate-500 italic h-full flex flex-col items-center justify-center gap-2">
              <Info className="h-5 w-5 opacity-40" />
              <span>Pending transaction initiation...</span>
              <span className="text-[10px] text-slate-600 font-normal">Select parameters above and run to simulate deep banking ledger states.</span>
            </div>
          )}
          {displayedLogs.map((log, i) => {
            if (!log || typeof log !== 'string') return null;
            let color = 'text-slate-300';
            if (log.includes('[ERROR]') || log.includes('[ABORT]') || log.includes('EXCEPTION')) color = 'text-red-400 font-bold';
            else if (log.includes('[Preparing]') || log.includes('[Handshake]')) color = 'text-sky-400';
            else if (log.includes('COMMIT') || log.includes('SUCCESS') || log.includes('verified')) color = 'text-emerald-400 font-semibold';
            else if (log.includes('ROLLBACK') || log.includes('RESTORED') || log.includes('rollbacks')) color = 'text-amber-500 font-bold';
            
            return (
              <div key={i} className={`leading-relaxed border-l-2 pl-2 ${color} border-slate-800`}>
                {log}
              </div>
            );
          })}
        </div>

        {txResult && (
          <div className={`p-3 text-xs flex items-center justify-between border-t border-slate-800 font-sans ${
            txResult.status === 'SUCCESSFUL' ? 'bg-emerald-950/20 text-emerald-300' : 'bg-red-950/20 text-red-300'
          }`}>
            <span className="font-semibold">{txResult.reference}</span>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
              {txResult.status === 'SUCCESSFUL' ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>SUCCESS (ACID Balance Transferred)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  <span>{txResult.status} ({txResult.failReason})</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
