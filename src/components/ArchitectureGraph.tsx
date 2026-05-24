/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ArrowRight, LogIn, Shield, Database, Send, Radio, Mail, Landmark } from 'lucide-react';

interface GraphProps {
  activeTxStep: string | null;
}

export default function ArchitectureGraph({ activeTxStep }: GraphProps) {
  // Map step log to active service
  const getActiveService = () => {
    if (!activeTxStep || typeof activeTxStep !== 'string') return null;
    const s = activeTxStep.toLowerCase();
    if (s.includes('auth') || s.includes('jwt') || s.includes('security')) return 'gateway';
    if (s.includes('db:') || s.includes('lock') || s.includes('deduct') || s.includes('credit') || s.includes('wallet')) return 'wallet';
    if (s.includes('kafka') || s.includes('publish') || s.includes('queue')) return 'queue';
    if (s.includes('notification') || s.includes('sms') || s.includes('email') || s.includes('dispatch')) return 'notification';
    if (s.includes('webhook') || s.includes('callback')) return 'webhook';
    return 'client';
  };

  const activeService = getActiveService();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-inner relative overflow-hidden text-slate-100">
      <div className="absolute top-2 right-4 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[10px] font-mono text-slate-400">Live Active Architecture Map</span>
      </div>

      <h3 className="text-sm font-bold font-sans tracking-wide text-slate-300 mb-6 uppercase">System Microservices Topology</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Dynamic moving packet animation depending on state */}
        {activeService && activeService !== 'client' && (
          <div className="absolute inset-0 pointer-events-none hidden md:block">
            <svg className="w-full h-full" style={{ minHeight: '140px' }}>
              <defs>
                <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {activeService === 'gateway' && (
                <path d="M 50 70 L 220 70" fill="none" stroke="url(#glow)" strokeWidth="3" strokeDasharray="5" className="animate-[dash_1s_linear_infinite]" />
              )}
              {activeService === 'wallet' && (
                <path d="M 220 70 L 410 70" fill="none" stroke="url(#glow)" strokeWidth="3" strokeDasharray="5" className="animate-[dash_1s_linear_infinite]" />
              )}
            </svg>
          </div>
        )}

        {/* Client Module */}
        <div className={`col-span-1 rounded-xl p-4 border transition duration-300 flex flex-col items-center text-center ${
          activeService === 'client' ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 border border-indigo-500/20">
            <Send className="h-6 w-6" />
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold mb-1">PAYMENT CLIENT</span>
          <h4 className="text-sm font-semibold text-slate-200">Express SDK</h4>
          <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2">Authenticates, formats amount & dispatches API POST</p>
        </div>

        {/* API Gateway (Rate limit + JWT Check) */}
        <div className={`col-span-1 rounded-xl p-4 border transition duration-300 flex flex-col items-center text-center ${
          activeService === 'gateway' ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold mb-1">API GATEWAY</span>
          <h4 className="text-sm font-semibold text-slate-200">Rate Limiter / Security</h4>
          <p className="text-[10px] text-slate-400 mt-1">Verifies JWT, intercepts request rate to prevent abuse</p>
        </div>

        {/* Wallet Service + PostgreSQL ACID Engine */}
        <div className={`col-span-1 rounded-xl p-4 border transition duration-300 flex flex-col items-center text-center ${
          activeService === 'wallet' ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 border border-amber-500/20">
            <Database className="h-6 w-6" />
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold mb-1">WALLET CORE</span>
          <h4 className="text-sm font-semibold text-slate-200">PostgreSQL DB</h4>
          <p className="text-[10px] text-slate-400 mt-1">Isolates balance records, enforces rollback upon fail</p>
        </div>

        {/* Queue Broker (Kafka / RabbitMQ) */}
        <div className={`col-span-1 rounded-xl p-4 border transition duration-300 flex flex-col items-center text-center ${
          activeService === 'queue' ? 'bg-pink-950/40 border-pink-500 ring-2 ring-pink-500/20' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 mb-3 border border-pink-500/20">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-bold mb-1">BROKER BUS</span>
          <h4 className="text-sm font-semibold text-slate-200">Kafka / RabbitMQ</h4>
          <p className="text-[10px] text-slate-400 mt-1">Asynchronous dispatching decoupled topics pipeline</p>
        </div>
      </div>

      {/* Downstream Async consumers (Notification and Webhook customer systems) */}
      <div className="mt-6 border-t border-slate-800/80 pt-6">
        <h4 className="text-xs font-semibold uppercase text-slate-400/80 tracking-wider mb-4 flex items-center gap-1">
          <span>Decoupled Downstream Workers</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-normal">Consumed Asynchronously</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`border rounded-lg p-3 transition duration-300 flex items-center gap-3 ${
            activeService === 'notification' ? 'bg-sky-950/30 border-sky-500/80 shadow' : 'bg-slate-950/30 border-slate-800/80'
          }`}>
            <div className="h-9 w-9 bg-sky-500/10 text-sky-400 flex items-center justify-center rounded">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Notification Worker</p>
              <p className="text-[10px] text-slate-400">Processes SMS/Email dispatching dynamically from Queue</p>
            </div>
          </div>

          <div className={`border rounded-lg p-3 transition duration-300 flex items-center gap-3 ${
            activeService === 'webhook' ? 'bg-fuchsia-950/30 border-fuchsia-500/80 shadow' : 'bg-slate-950/30 border-slate-800/80'
          }`}>
            <div className="h-9 w-9 bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center rounded">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Customer Callback Listener</p>
              <p className="text-[10px] text-slate-400">Receives verified signed SHA-256 callback status reports</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}
