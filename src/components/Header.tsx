/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Monitor, Cpu, Database, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  rateLimitRemaining: number;
  onReset: () => void;
  isResetting: boolean;
}

export default function Header({ rateLimitRemaining, onReset, isResetting }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Cpu className="text-slate-900 h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight">Fintech API & Microservices Gate</h1>
            <p className="text-xs text-slate-400 font-mono">Senior Architecture Simulation & ACID Sandbox</p>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">User Service:</span>
            <span className="text-emerald-400 font-bold">UP (JWT Auth)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Wallet Service:</span>
            <span className="text-emerald-400 font-bold">UP (Pessimistic-Lock)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <Radio className="h-3 w-3 text-sky-400 animate-pulse" />
            <span className="text-slate-400">Messaging:</span>
            <span className="text-sky-400 font-bold">Kafka/RabbitMQ Broker</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <Database className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-slate-400">Database:</span>
            <span className="text-slate-200">PostgreSQL (Serializable)</span>
          </div>

          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-100 hover:text-white px-3 py-1.5 rounded border border-red-800/80 cursor-pointer transition"
          >
            <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>
    </header>
  );
}
