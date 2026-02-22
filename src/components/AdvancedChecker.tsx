"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Square, ShieldCheck, Terminal, DollarSign, AlertTriangle } from "lucide-react";

export interface AdvancedCheckResult {
  cardInfo: string;
  status: "Approved (Charged)" | "Approved (Auth Only)" | "Declined (Insuff. Funds)" | "Declined (Fraud)" | "Unknown";
  message: string;
  gateway: string;
  timeTaken: string;
}

export interface AdvancedCheckerRef {
  addCards: (cards: string[]) => void;
}

const GATEWAYS = ["Stripe v3 (Auth)", "Braintree (Charge)", "Adyen (Auth)", "Authorize.Net"];

const AdvancedChecker = forwardRef<AdvancedCheckerRef>((props, ref) => {
  const [queue, setQueue] = useState<string[]>([]);
  const [results, setResults] = useState<{
    charged: AdvancedCheckResult[];
    auth: AdvancedCheckResult[];
    declined: AdvancedCheckResult[];
    unknown: AdvancedCheckResult[];
  }>({
    charged: [],
    auth: [],
    declined: [],
    unknown: []
  });

  const [status, setStatus] = useState<"idle" | "checking" | "paused" | "finished">("idle");
  const [activeTab, setActiveTab] = useState<"Queue" | "Charged" | "Auth" | "Declined" | "Unknown">("Queue");
  const [totalAdded, setTotalAdded] = useState(0);

  useImperativeHandle(ref, () => ({
    addCards: (newCards: string[]) => {
      setQueue((prev) => {
        const uniqueNew = newCards.filter(c => !prev.includes(c) && 
          !results.charged.some(r => r.cardInfo === c) &&
          !results.auth.some(r => r.cardInfo === c) &&
          !results.declined.some(r => r.cardInfo === c) &&
          !results.unknown.some(r => r.cardInfo === c)
        );
        if (uniqueNew.length > 0) {
          setTotalAdded(t => t + uniqueNew.length);
          return [...prev, ...uniqueNew];
        }
        return prev;
      });
    }
  }));

  // Helper to simulate an advanced, slower check
  const performAdvancedCheck = (cardInfo: string): AdvancedCheckResult => {
    // Highly simulated weighted outcome for "Live" cards
    const rand = Math.random();
    let statusValue: AdvancedCheckResult["status"] = "Unknown";
    let msg = "";

    if (rand > 0.85) {
      statusValue = "Approved (Charged)";
      msg = "Gateway returned success code 1000. $1.00 Charge successful.";
    } else if (rand > 0.4) {
      statusValue = "Approved (Auth Only)";
      msg = "CVV matches. $0.00 Auth successful. Address not verified.";
    } else if (rand > 0.15) {
      statusValue = "Declined (Insuff. Funds)";
      msg = "Card is valid but gateway returned 51: Insufficient Funds.";
    } else {
      statusValue = "Declined (Fraud)";
      msg = "Gateway returned 59: Suspected Fraud or Restricted Card.";
    }

    return {
      cardInfo,
      status: statusValue,
      message: msg,
      gateway: GATEWAYS[Math.floor(Math.random() * GATEWAYS.length)],
      timeTaken: (Math.random() * 2 + 0.5).toFixed(2) + "s"
    };
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === "checking" && queue.length > 0) {
      // Intentionally slower and slightly randomized delay (1.5s - 3s)
      const delay = Math.floor(Math.random() * 1500) + 1500;
      
      timer = setTimeout(() => {
        const nextCard = queue[0];
        const result = performAdvancedCheck(nextCard);

        setResults((prev) => {
          const newResults = { ...prev };
          if (result.status === "Approved (Charged)") newResults.charged = [result, ...prev.charged];
          else if (result.status === "Approved (Auth Only)") newResults.auth = [result, ...prev.auth];
          else if (result.status.startsWith("Declined")) newResults.declined = [result, ...prev.declined];
          else newResults.unknown = [result, ...prev.unknown];
          return newResults;
        });

        setQueue((prev) => prev.slice(1));
      }, delay);
    } else if (status === "checking" && queue.length === 0) {
        setTimeout(() => setStatus("finished"), 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, queue]);

  const progressPercent = totalAdded === 0 ? 0 : Math.max(0, Math.min(100, ((totalAdded - queue.length) / totalAdded) * 100));

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-16 pb-32" id="advanced-checker-section">
      
      {/* Header */}
      <div className="border border-titanium bg-titanium/10 p-8 relative flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="absolute -top-3 left-6 bg-black px-2 text-xs uppercase tracking-widest text-[#00ffbb] flex items-center font-bold">
          <ShieldCheck size={14} className="mr-2" /> Advanced deep check
        </div>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase mb-2">Secondary Auth Verification</h2>
          <p className="text-zinc-500 max-w-lg font-mono text-sm leading-relaxed">
            Pushes live BINs through simulated localized payment gateways to determine exact transaction viability (Charge/Auth/Declined).
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex border border-titanium bg-[#0a0a0a] p-2">
            {status === "checking" ? (
              <button onClick={() => setStatus("paused")} className="text-red-500 hover:text-red-400 p-3 bg-black border border-titanium/50 rounded-sm hover:border-red-500/50 transition-colors"><Pause size={20} /></button>
            ) : status === "idle" || status === "paused" ? (
              <button onClick={() => { if(queue.length > 0) setStatus("checking") }} className="text-[#00ffbb] hover:text-white p-3 disabled:opacity-50 disabled:bg-transparent bg-black border border-titanium/50 rounded-sm hover:border-[#00ffbb]/50 transition-colors" disabled={queue.length === 0}><Play size={20} className="ml-1" /></button>
            ) : (
              <button disabled className="text-zinc-700 p-3 bg-black border border-titanium/50 rounded-sm"><Square size={20} /></button>
            )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-8 bg-black border border-titanium relative overflow-hidden flex items-center">
        <div 
          className="absolute top-0 left-0 h-full bg-[#00ffbb]/20 border-r border-[#00ffbb] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
        <div className="absolute top-0 left-0 w-full h-full flex items-center px-4 text-xs font-mono text-zinc-500 z-10 justify-between">
            <span>QUEUE {queue.length} / {totalAdded}</span>
            <span>{Math.round(progressPercent)}% COMPLETION LAYER</span>
        </div>
      </div>

      {/* Results Terminal */}
      <div className="border border-titanium bg-black">
        <div className="flex border-b border-titanium bg-[#0F0F0F] overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab("Queue")}
            className={`flex-none min-w-[140px] flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Queue" ? 'text-white bg-black' : 'text-zinc-600 hover:text-silver'}`}
          >
            Queue <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{queue.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Charged")}
            className={`flex-none min-w-[140px] flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Charged" ? 'text-[#00ffbb] bg-black shadow-[inset_0_2px_0_#00ffbb]' : 'text-zinc-600 hover:text-silver'}`}
          >
            Charged <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.charged.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Auth")}
            className={`flex-none min-w-[140px] flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Auth" ? 'text-acid bg-black shadow-[inset_0_2px_0_#ccff00]' : 'text-zinc-600 hover:text-silver'}`}
          >
            Auth Only <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.auth.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Declined")}
            className={`flex-none min-w-[140px] flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Declined" ? 'text-red-500 bg-black shadow-[inset_0_2px_0_#ef4444]' : 'text-zinc-600 hover:text-silver'}`}
          >
            Declined <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.declined.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Unknown")}
            className={`flex-none min-w-[140px] flex justify-center items-center py-6 transition-colors ${activeTab === "Unknown" ? 'text-yellow-500 bg-black shadow-[inset_0_2px_0_#eab308]' : 'text-zinc-600 hover:text-silver'}`}
          >
            Unknown <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.unknown.length}</span>
          </button>
        </div>

        <div className="p-8 font-mono text-xs h-[400px] overflow-y-auto custom-scrollbar relative bg-[#050505]">
          {activeTab === "Queue" ? (
             queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm">
                   <Terminal size={32} className="mb-4 opacity-30" />
                   Waiting for card injection from Live bucket.
                </div>
             ) : (
                <>
                {queue.map((card, idx) => (
                  <div key={`queue-${idx}`} className="flex mb-3 whitespace-nowrap text-zinc-500 items-center animate-in fade-in duration-300 pb-2 border-b border-titanium/30">
                    <span className="w-8 text-titanium">{(idx + 1).toString().padStart(3, '0')}</span>
                    {idx === 0 && status === "checking" ? (
                      <span className="text-[#00ffbb] animate-pulse mx-4 w-12 text-center">T/X</span>
                    ) : (
                      <span className="text-zinc-700 mx-4 w-12 text-center">IDLE</span>
                    )}
                    <span className={idx === 0 && status === "checking" ? "text-white" : ""}>{card}</span>
                  </div>
                ))}
                </>
             )
          ) : (
            results[activeTab.toLowerCase() as keyof typeof results].length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm">
                 <ShieldCheck size={32} className="mb-4 opacity-30" />
                 No gateway responses recorded in this tier yet.
              </div>
            ) : (
              results[activeTab.toLowerCase() as keyof typeof results].map((res, idx) => (
                <div key={idx} className="flex items-start md:items-center flex-col md:flex-row mb-3 whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-500 pb-3 border-b border-titanium/50 hover:bg-titanium/10 px-2 -mx-2">
                  
                  {/* Status Indicator */}
                  <div className={`flex flex-col w-32 shrink-0 ${res.status.includes('Charged') ? 'text-[#00ffbb]' : res.status.includes('Auth') ? 'text-acid' : res.status.includes('Declined') ? 'text-red-500' : 'text-yellow-500'}`}>
                    <span className="font-bold flex items-center">
                        {res.status.includes('Charged') ? <DollarSign size={12} className="mr-1" /> : 
                         res.status.includes('Declined') ? <AlertTriangle size={12} className="mr-1" /> : 
                         <ShieldCheck size={12} className="mr-1" />}
                        {res.status.split(' ')[0]}
                    </span>
                    <span className="text-[10px] opacity-70 border border-current/20 px-1 py-0.5 mt-1 inline-block w-max rounded-sm bg-current/5">
                        {res.status.split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                  
                  <span className="text-zinc-700 mx-4 hidden md:inline">|</span>
                  
                  {/* Card Data */}
                  <div className="flex flex-col w-56 shrink-0 mt-2 md:mt-0">
                    <span className="text-white font-bold tracking-wider">{res.cardInfo.split('|')[0]}</span>
                    <div className="flex text-[10px] text-zinc-500 mt-1 space-x-2">
                        <span className="bg-titanium p-0.5 rounded-sm text-silver">{res.cardInfo.split('|')[1]}/{res.cardInfo.split('|')[2]}</span>
                        <span className="bg-titanium p-0.5 rounded-sm text-silver flex items-center">{res.cardInfo.split('|')[3]}</span>
                    </div>
                  </div>

                  <span className="text-zinc-700 mx-4 hidden md:inline">|</span>
                  
                  {/* Gateway Details */}
                  <div className="flex flex-col flex-1 mt-2 md:mt-0 min-w-0">
                    <span className="text-zinc-600 text-[10px] uppercase tracking-widest">{res.gateway} <span className="text-zinc-700 mx-1">•</span> <span className="text-acid">{res.timeTaken}</span></span>
                    <span className="text-zinc-400 mt-1 truncate max-w-full">{res.message}</span>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

    </div>
  );
});

AdvancedChecker.displayName = "AdvancedChecker";
export default AdvancedChecker;
