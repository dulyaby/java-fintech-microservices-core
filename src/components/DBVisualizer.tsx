/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Database, Table, Radio, Flame, CheckCircle2, XCircle, RefreshCcw, Bell } from 'lucide-react';
import { Wallet, Transaction, WebhookLog, SystemLog } from '../types';

interface DBVisualizerProps {
  wallets: Wallet[];
  transactions: Transaction[];
  systemLogs: SystemLog[];
  webhookLogs: WebhookLog[];
  webhookUrl: string;
  webhookSecret: string;
  onRefresh: () => void;
  onResetLogs: () => void;
}

export default function DBVisualizer({
  wallets,
  transactions,
  systemLogs,
  webhookLogs,
  webhookUrl,
  webhookSecret,
  onRefresh,
  onResetLogs
}: DBVisualizerProps) {
  return (
    <div className="space-y-6">
      {/* SECTION 1: DATABASE WALLET TABLES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Table className="text-emerald-400 h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Simulated PostgreSQL Wallets Table</h3>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <RefreshCcw className="h-3 w-3" />
            <span>Refesh tables</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                <th className="py-2.5 px-3">Wallet ID</th>
                <th className="py-2.5 px-3">Phone Identifier</th>
                <th className="py-2.5 px-3">Currency</th>
                <th className="py-2.5 px-3 text-right">Available Balance</th>
                <th className="py-2.5 px-3">Last Mutated Time</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.id} className="border-b border-slate-800/60 hover:bg-slate-950/40 transition">
                  <td className="py-2.5 px-3 text-emerald-500 font-bold">{wallet.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">
                    {wallet.phone} <span className="text-[10px] text-slate-500">({wallet.phone === '+255712345678' ? 'Alice' : wallet.phone === '+255787654321' ? 'Bob' : 'Merchant'})</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{wallet.currency}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400 text-sm">
                    {wallet.balance.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-500">
                    {new Date(wallet.lastUpdated).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: WEBHOOK CALLBACK DISPATCH LOGS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
          <Bell className="text-fuchsia-400 h-5 w-5 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Webhook Delivery Sandbox</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h4 className="font-semibold text-slate-300 font-sans">Verification Configuration</h4>
            <div className="space-y-1 text-[11px] font-mono">
              <p className="text-slate-500">Target URL callback endpoint:</p>
              <p className="bg-slate-900 px-2 py-1 rounded text-fuchsia-400 truncate">{webhookUrl}</p>
              <p className="text-slate-500 mt-2">Shared Cryptographic Secret Key (Used in HMAC signature):</p>
              <p className="bg-slate-900 px-2 py-1 rounded text-slate-400 font-mono text-[9px] truncate">{webhookSecret}</p>
              <p className="text-slate-500 mt-2">Fintech Signature header:</p>
              <p className="bg-slate-900 px-2 py-1 rounded text-slate-400 truncate">X-Fintech-Signature</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 font-sans">Recent callback triggers</h4>
            <div className="max-h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {webhookLogs.length === 0 ? (
                <div className="text-slate-600 text-[11px] italic p-3 text-center bg-slate-950/20 border border-slate-800/50 rounded">
                  No webhooks sent. Execute payments to trigger async background hook dispatches.
                </div>
              ) : (
                webhookLogs.map((wh) => (
                  <div key={wh.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono leading-relaxed space-y-1.5 hover:bg-slate-950/80 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-fuchsia-500 font-semibold">{wh.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        wh.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-red-950 text-red-400 border border-red-900'
                      }`}>
                        HTTP {wh.responseCode} {wh.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      <span>Ref: {wh.payload.data?.reference}</span>
                      <span className="ml-3 font-normal opacity-70">Sig: {wh.payload.data?.transactionId?.substring(0,8)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SYSTEM INTERNAL MICROSERVICES EVENT PIPELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="text-sky-400 h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Asynchronous Pipeline Logs</h3>
          </div>
          <button
            onClick={onResetLogs}
            className="text-[10px] text-red-400 hover:underline"
          >
            Clear log traces
          </button>
        </div>

        <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800/80 max-h-[220px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {systemLogs.length === 0 ? (
            <div className="text-slate-600 text-xs italic font-mono text-center py-6">No event logged.</div>
          ) : (
            systemLogs.map((log) => {
              let tagColor = 'bg-slate-900 text-slate-400 border-slate-800';
              if (log.service === 'Wallet Service') tagColor = 'bg-amber-950 text-amber-300 border-amber-900';
              else if (log.service === 'User Service') tagColor = 'bg-emerald-950 text-emerald-300 border-emerald-900';
              else if (log.service === 'Notification Service') tagColor = 'bg-sky-950 text-sky-300 border-sky-900';
              else if (log.service === 'Queue Broker') tagColor = 'bg-pink-950 text-pink-300 border-pink-900';

              let bulletColor = 'bg-slate-500';
              if (log.level === 'SUCCESS') bulletColor = 'bg-emerald-500';
              else if (log.level === 'ERROR') bulletColor = 'bg-red-500 animate-pulse';
              else if (log.level === 'WARNING') bulletColor = 'bg-amber-500';

              return (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-900/40 pb-2 text-[11px] font-mono">
                  <div className="flex items-start gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${bulletColor}`} />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${tagColor}`}>
                          {log.service}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-slate-300 select-all">{log.message}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
