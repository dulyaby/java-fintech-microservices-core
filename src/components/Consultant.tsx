/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Cpu, Send, RefreshCw, HelpCircle, Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  message: string;
}

export default function Consultant() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const templates = [
    { label: 'Single/Double Entry ledger design', prompt: 'Explain the table structures and ledger constraints for a dual-entry book ledger system in a relational database.' },
    { label: 'Mbinu za kulinda fintech API', prompt: 'Eleza kwa undani mbinu (Architectural patterns) za kulinda FinTech API dhidi ya Brute-force attacks, replay attacks, na Man-in-the-middle.' },
    { label: 'Exactly-Once with Postgres/Kafka', prompt: 'How do I guarantee transaction Exactly-Once delivery when updating PostgreSQL balances and publishing events to Kafka asynchronously?' }
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputVal;
    if (!promptToSend.trim() || isLoading) return;

    setErrorMsg('');
    setIsLoading(true);
    setInputVal('');

    const newMsg: ChatMessage = { role: 'user', message: promptToSend };
    const updatedHistory = [...history, newMsg];
    setHistory(updatedHistory);

    try {
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          history: history
        })
      });

      const data = await response.json();
      if (data.success) {
        setHistory(prev => [...prev, { role: 'model', message: data.reply }]);
      } else {
        setErrorMsg(data.reply || 'Server did not return a valid Gemini response. Please verify that your GEMINI_API_KEY is configured in AI Studio Secrets settings.');
      }
    } catch (err: any) {
      setErrorMsg('Gateway error matching AI assistant: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setHistory([]);
    setErrorMsg('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-[520px]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Bot className="text-emerald-400 h-5 w-5 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">AI Fintech Architecture Guide</h3>
        </div>
        <button
          onClick={handleClearChat}
          className="text-[10px] text-slate-500 hover:text-red-400 font-mono"
        >
          Reset Session
        </button>
      </div>

      {/* Templates Prompt list */}
      {history.length === 0 && (
        <div className="mb-4">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-2 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>Select a template architect question to ask AI:</span>
          </span>
          <div className="flex flex-col gap-2">
            {templates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(tpl.prompt)}
                className="text-left bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-2.5 rounded text-xs text-slate-300 font-normal cursor-pointer transition"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat scroll workspace */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2 font-sans text-xs scrollbar-thin scrollbar-thumb-slate-800">
        {history.length === 0 && (
          <div className="text-slate-500 italic h-64 flex flex-col items-center justify-center text-center gap-2 font-sans">
            <Bot className="h-10 w-10 text-emerald-500/30 shrink-0" />
            <span className="max-w-[280px]">Ask questions about Spring Boot locks, ACID compliance, Kakfa queue decoupling, security and API rate designs.</span>
          </div>
        )}

        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-emerald-950/30 border border-emerald-800 text-slate-200 ml-auto'
                : 'bg-slate-950/80 border border-slate-805 text-slate-300 mr-auto font-sans leading-relaxed whitespace-pre-wrap'
            }`}
          >
            <span className="text-[9px] uppercase font-mono text-slate-500 mb-1">
              {msg.role === 'user' ? 'Architect' : 'Gemini AI Advisor'}
            </span>
            <p className="text-[11px] leading-relaxed select-text">{msg.message}</p>
          </div>
        ))}

        {isLoading && (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 text-slate-500 flex items-center gap-2 mr-auto">
            <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
            <span className="font-mono text-[10px]">Gemini consultant synthesizing architectural feedback...</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800 rounded-lg p-3 text-red-300 mr-auto max-w-[90%] font-mono text-[11px] leading-relaxed">
            <p className="font-bold">Execution Error:</p>
            <p>{errorMsg}</p>
            <p className="mt-2 text-[10px] text-slate-400 font-sans">Note: To test AI features, please provide a Gemini API Key in the settings secrets pane in Google AI Studio interface.</p>
          </div>
        )}
      </div>

      {/* Input messaging dispatch */}
      <div className="mt-4 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-emerald-500 transition">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type fintech question..."
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-transparent text-xs text-slate-200 outline-none p-1.5"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputVal.trim()}
          className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 font-bold p-1 rounded-lg text-slate-950 flex items-center justify-center cursor-pointer transition disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
