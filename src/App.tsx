/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import ArchitectureGraph from './components/ArchitectureGraph';
import Playground from './components/Playground';
import DBVisualizer from './components/DBVisualizer';
import SecuritySimulator from './components/SecuritySimulator';
import CodeViewer from './components/CodeViewer';
import Consultant from './components/Consultant';
import { Wallet, Transaction, WebhookLog, SystemLog } from './types';
import { Database, ShieldAlert, Cpu, Bot, Award } from 'lucide-react';

export default function App() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [rateLimitRemaining, setRateLimitRemaining] = useState(10);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<'db' | 'security' | 'code' | 'advisor'>('db');

  // Load backend states
  const refreshLogsAndBanks = async () => {
    try {
      const response = await fetch('/api/simulation/logs');
      const data = await response.json();
      if (data.success) {
        setWallets(data.wallets || []);
        setTransactions(data.transactions || []);
        setSystemLogs(data.systemLogs || []);
        setWebhookLogs(data.webhookLogs || []);
        setWebhookUrl(data.webhookUrl || '');
        setWebhookSecret(data.webhookSecret || '');
        setRateLimitRemaining(data.rateLimitRemaining ?? 10);
      }
    } catch (e) {
      console.error('Failure reading dynamic backend log telemetry:', e);
    }
  };

  useEffect(() => {
    refreshLogsAndBanks();
    // Poll every 3 seconds to update webhook logs and background message event consumptions
    const interval = setInterval(refreshLogsAndBanks, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResetSimulation = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWallets(data.wallets);
        setTransactions(data.transactions);
        setSystemLogs(data.systemLogs);
        setWebhookLogs(data.webhookLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const clearSystemLogs = () => {
    // Local clear for visually cleaner traces
    setSystemLogs([]);
  };

  // Extract the latest transaction step dynamically to trigger trace highlights in Architecture graph
  const getLatestTxStep = () => {
    if (transactions.length === 0) return null;
    const latestTx = transactions[0];
    if (latestTx.status === 'PENDING') {
      return 'processing';
    }
    // Extract last step log line
    if (latestTx.stepLogs && latestTx.stepLogs.length > 0) {
      return latestTx.stepLogs[latestTx.stepLogs.length - 1];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      <Header
        rateLimitRemaining={rateLimitRemaining}
        onReset={handleResetSimulation}
        isResetting={isResetting}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* TOP: ARCHITECTURE MAP STATE VISUALIZER */}
        <ArchitectureGraph activeTxStep={getLatestTxStep()} />

        {/* BOTTOM CONTENT WORK-SPACE DIVIDED */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: API GATEWAY SUBMIT PORTAL (Takes 5 slots out of 12) */}
          <div className="lg:col-span-5 space-y-6">
            <Playground
              onPaymentSuccess={refreshLogsAndBanks}
              rateLimitStatus={rateLimitRemaining}
              setRateLimitStatus={setRateLimitRemaining}
            />

            {/* Microservice Architecture Summary Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4.5 text-xs text-slate-400 space-y-3">
              <div className="flex items-center gap-1.5 font-bold font-mono text-slate-200 uppercase tracking-wide">
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Senior System Design Architecture Objectives</span>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 leading-relaxed font-normal">
                <li><b className="text-slate-300">Asynchronous processing:</b> Messaging topics decouple slow SMS dispatch operations, enabling fast microservices transaction completion thresholds.</li>
                <li><b className="text-slate-300">Pessimistic DB Locks:</b> Dual-entry ledger balance updates lock respective tables sequentially, resolving double-spend race conditions.</li>
                <li><b className="text-slate-300">Automatic Webhook verification:</b> Authenticates hook webhook request packets dynamically under custom SHA-256 signatures.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: TAB WORK-SHEETS (Takes 7 slots out of 12) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Dynamic visual tab selector */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono font-bold leading-none select-none">
              <button
                onClick={() => setActiveTab('db')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'db' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Postgres & Webhooks</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'security' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Cyber Security</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'code' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Java Source</span>
              </button>
              <button
                onClick={() => setActiveTab('advisor')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'advisor' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>AI Guide</span>
              </button>
            </div>

            {/* WORK SHEET BODY CONTAINER */}
            <div className="min-h-[480px]">
              {activeTab === 'db' && (
                <DBVisualizer
                  wallets={wallets}
                  transactions={transactions}
                  systemLogs={systemLogs}
                  webhookLogs={webhookLogs}
                  webhookUrl={webhookUrl}
                  webhookSecret={webhookSecret}
                  onRefresh={refreshLogsAndBanks}
                  onResetLogs={clearSystemLogs}
                />
              )}
              {activeTab === 'security' && <SecuritySimulator />}
              {activeTab === 'code' && <CodeViewer />}
              {activeTab === 'advisor' && <Consultant />}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER METADATA STATEMENT */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] font-mono text-slate-600">
        <p>© 2026 Payment Gateway & Microservices Demo • ISO-8583 Serializable Sandbox • Build by Abdulkarim</p>
      </footer>
    </div>
  );
}
