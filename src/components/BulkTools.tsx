"use client";

import { useState, useEffect } from "react";
import { generateMass, MassGeneratorOptions, validateCard, CheckResult } from "@/lib/card-utils";
import { Play, Pause, Square, Settings, CreditCard } from "lucide-react";
import AdvancedChecker, { AdvancedCheckerRef } from "./AdvancedChecker";
import { useRef } from "react";

export default function BulkTools() {
  const [options, setOptions] = useState<MassGeneratorOptions>({
    bin: "",
    quantity: 10,
    month: "Random",
    year: "Random",
    cvv: "",
    format: "PIPE"
  });

  const [toggles, setToggles] = useState({
    date: true,
    cvv: true,
    money: false
  });

  const [queue, setQueue] = useState<string[]>([]);
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const [totalToCheck, setTotalToCheck] = useState(0);
  
  const [results, setResults] = useState<{ live: CheckResult[]; die: CheckResult[]; unknown: CheckResult[] }>({
    live: [],
    die: [],
    unknown: []
  });

  const [status, setStatus] = useState<"idle" | "checking" | "paused" | "finished">("idle");
  const [activeTab, setActiveTab] = useState<"Generated" | "Live" | "Die" | "Unknown">("Generated");
  const [isHydrated, setIsHydrated] = useState(false);
  
  const advancedCheckerRef = useRef<AdvancedCheckerRef>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("bulkToolsState");
    if (saved) {
      setTimeout(() => {
        try {
           const parsed = JSON.parse(saved);
           if (parsed.options) setOptions(parsed.options);
           if (parsed.toggles) setToggles(parsed.toggles);
           if (parsed.queue) setQueue(parsed.queue);
           if (parsed.generatedList) setGeneratedList(parsed.generatedList);
           if (parsed.totalToCheck) setTotalToCheck(parsed.totalToCheck);
           if (parsed.results) setResults(parsed.results);
           if (parsed.status) setStatus(parsed.status === "checking" ? "paused" : parsed.status);
           if (parsed.activeTab) setActiveTab(parsed.activeTab);
        } catch (error) {
           console.error("Hydration error:", error);
        }
        setIsHydrated(true);
      }, 0);
    } else {
      setTimeout(() => setIsHydrated(true), 0);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("bulkToolsState", JSON.stringify({
      options, toggles, queue, generatedList, totalToCheck, results, status, activeTab
    }));
  }, [options, toggles, queue, generatedList, totalToCheck, results, status, activeTab, isHydrated]);

  const handleGenerate = () => {
    if (!options.bin || options.bin.length < 6) return;
    const generated = generateMass(options);
    setQueue(generated);
    setGeneratedList(generated);
    setTotalToCheck(generated.length);
    setResults({ live: [], die: [], unknown: [] });
    setStatus("idle");
    setActiveTab("Generated");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "checking" && queue.length > 0) {
      timer = setTimeout(() => {
        const nextCard = queue[0];
        const result = validateCard(nextCard);

        setResults((prev) => {
          const newResults = { ...prev };
          if (result.status === "Live") newResults.live = [result, ...prev.live];
          else if (result.status === "Die") newResults.die = [result, ...prev.die];
          else newResults.unknown = [result, ...prev.unknown];
          return newResults;
        });

        setQueue((prev) => prev.slice(1));
      }, 50); // Faster simulation speed
    } else if (status === "checking" && queue.length === 0) {
      setTimeout(() => setStatus("finished"), 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, queue]);

  const extractAndUseAll = (cards: CheckResult[]) => {
    if (advancedCheckerRef.current && cards.length > 0) {
      const cardInfos = cards.map(c => c.cardInfo);
      advancedCheckerRef.current.addCards(cardInfos);
      
      const el = document.getElementById("advanced-checker-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const progressPercent = totalToCheck === 0 ? 0 : Math.max(0, Math.min(100, ((totalToCheck - queue.length) / totalToCheck) * 100));

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-700">
      
      {/* --- MASS GENERATOR FORM --- */}
      <div className="border border-titanium bg-black p-8 relative">
        <div className="absolute -top-3 left-6 bg-black px-2 text-xs uppercase tracking-widest text-acid flex items-center">
          <Settings size={14} className="mr-2" /> Generator Config
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* BIN Input & Format */}
          <div className="space-y-6">
            <div className="relative border border-titanium group focus-within:border-acid transition-colors">
              <label className="absolute -top-2.5 left-4 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400 group-focus-within:text-acid transition-colors">BIN</label>
              <input 
                type="text" 
                placeholder="e.g: 453590" 
                className="w-full bg-transparent p-4 tex-lg text-white font-mono placeholder-zinc-700 focus:outline-none"
                value={options.bin}
                onChange={(e) => setOptions({ ...options, bin: e.target.value.replace(/[^0-9\sxX]/g, '') })}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 w-32">
                <button 
                  onClick={() => setToggles({...toggles, date: !toggles.date})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${toggles.date ? 'bg-acid justify-end' : 'bg-titanium justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-black"></div>
                </button>
                <span className={`text-xs font-bold tracking-widest ${toggles.date ? 'text-acid' : 'text-zinc-500'}`}>DATE</span>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4 opacity-100 transition-opacity">
                <div className="relative border border-titanium">
                  <label className="absolute -top-2.5 left-2 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">EXP MONTH</label>
                  <select 
                    disabled={!toggles.date}
                    className="w-full bg-transparent p-3 text-sm text-silver font-mono appearance-none focus:outline-none disabled:opacity-50"
                    value={options.month}
                    onChange={(e) => setOptions({...options, month: e.target.value})}
                  >
                    <option value="Random">Random</option>
                    {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="relative border border-titanium">
                  <label className="absolute -top-2.5 left-2 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">EXP YEAR</label>
                  <select 
                    disabled={!toggles.date}
                    className="w-full bg-transparent p-3 text-sm text-silver font-mono appearance-none focus:outline-none disabled:opacity-50"
                    value={options.year}
                    onChange={(e) => setOptions({...options, year: e.target.value})}
                  >
                    <option value="Random">Random</option>
                    {Array.from({length: 10}, (_, i) => (new Date().getFullYear() + i).toString()).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 w-32">
                <button 
                  onClick={() => setToggles({...toggles, cvv: !toggles.cvv})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${toggles.cvv ? 'bg-acid justify-end' : 'bg-titanium justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-black"></div>
                </button>
                <span className={`text-xs font-bold tracking-widest ${toggles.cvv ? 'text-acid' : 'text-zinc-500'}`}>CVV</span>
              </div>
              <div className="flex-1 relative border border-titanium">
                <label className="absolute -top-2.5 left-2 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">CVV</label>
                <input 
                  type="text" 
                  disabled={!toggles.cvv}
                  placeholder="Leave blank to randomize"
                  className="w-full bg-transparent p-3 text-sm text-silver font-mono placeholder-zinc-700 focus:outline-none disabled:opacity-50"
                  value={options.cvv}
                  onChange={(e) => setOptions({...options, cvv: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Format, Quantity, Money */}
          <div className="space-y-6">
            <div className="relative border border-titanium">
               <label className="absolute -top-2.5 left-4 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">FORMAT</label>
               <select 
                  className="w-full bg-transparent p-4 text-white font-mono appearance-none focus:outline-none"
                  value={options.format}
                  onChange={(e) => setOptions({...options, format: e.target.value as "PIPE"})}
                >
                  <option value="PIPE">PIPE (pan|mm|yy|cvv)</option>
                </select>
            </div>

            <div className="relative border border-titanium">
               <label className="absolute -top-2.5 left-4 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">QUANTITY</label>
               <select 
                  className="w-full bg-transparent p-3 text-sm text-silver font-mono appearance-none focus:outline-none"
                  value={options.quantity.toString()}
                  onChange={(e) => setOptions({...options, quantity: parseInt(e.target.value)})}
                >
                  {[5, 10, 20, 50, 100].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 w-32">
                <button 
                  onClick={() => setToggles({...toggles, money: !toggles.money})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${toggles.money ? 'bg-acid justify-end' : 'bg-titanium justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-black"></div>
                </button>
                <span className={`text-xs font-bold tracking-widest ${toggles.money ? 'text-acid' : 'text-zinc-500'}`}>MONEY</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                 <div className="relative border border-titanium opacity-50">
                  <label className="absolute -top-2.5 left-2 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">CURRENCY</label>
                  <select disabled className="w-full bg-transparent p-3 text-sm text-zinc-500 font-mono appearance-none focus:outline-none">
                    <option>USD</option>
                  </select>
                </div>
                <div className="relative border border-titanium opacity-50">
                  <label className="absolute -top-2.5 left-2 bg-black px-1 text-[10px] font-bold tracking-widest text-zinc-400">BALANCE</label>
                  <select disabled className="w-full bg-transparent p-3 text-sm text-zinc-500 font-mono appearance-none focus:outline-none">
                    <option>500-1000</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={handleGenerate}
            disabled={!options.bin || options.bin.length < 6}
            className="flex items-center bg-acid text-black font-bold uppercase tracking-widest text-sm px-8 py-4 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings size={18} className="mr-3" /> Generate
          </button>
        </div>
      </div>

      {/* --- MOCK CHECKER UI --- */}
      <div className="border border-titanium bg-black p-8 relative flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-3xl">
          <div className="flex justify-between items-center text-xs font-mono tracking-widest mb-4">
            <span className="text-zinc-500">CHECKING.</span>
            <span className="text-zinc-400">
              [<span className="text-acid">LIVE: {results.live.length}</span> | <span className="text-red-500">DIE: {results.die.length}</span> | <span className="text-yellow-500">UNKNOWN: {results.unknown.length}</span>]
            </span>
          </div>

          <div className="w-full h-8 bg-titanium/30 border border-titanium relative overflow-hidden mb-6 flex items-center">
            <div 
              className="absolute top-0 left-0 h-full bg-acid/20 border-r border-acid transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center px-4 text-xs font-mono text-zinc-500 z-10">
              {Math.round(progressPercent)}%
            </div>
          </div>

          <div className="flex justify-center w-full border border-titanium bg-[#0a0a0a] p-2">
            {status === "checking" ? (
              <button onClick={() => setStatus("paused")} className="text-red-500 hover:text-red-400 p-2"><Pause size={20} /></button>
            ) : status === "idle" || status === "paused" ? (
              <button onClick={() => { if(queue.length > 0) setStatus("checking") }} className="text-red-500 hover:text-red-400 p-2 disabled:opacity-50" disabled={queue.length === 0}><Play size={20} /></button>
            ) : (
              <button disabled className="text-zinc-700 p-2"><Square size={20} /></button>
            )}
          </div>
        </div>
      </div>

      {/* --- RESULTS VIEWER --- */}
      <div className="border border-titanium bg-black">
        <div className="flex border-b border-titanium bg-[#0F0F0F]">
          <button 
            onClick={() => setActiveTab("Generated")}
            className={`flex-1 flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Generated" ? 'text-white bg-black' : 'text-zinc-600 hover:text-silver'}`}
          >
            Generated <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{generatedList.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Live")}
            className={`flex-1 flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Live" ? 'text-acid bg-black' : 'text-zinc-600 hover:text-silver'}`}
          >
            Live <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.live.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Die")}
            className={`flex-1 flex justify-center items-center py-6 border-r border-titanium transition-colors ${activeTab === "Die" ? 'text-white bg-black' : 'text-zinc-600 hover:text-silver'}`}
          >
            Die <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.die.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("Unknown")}
            className={`flex-1 flex justify-center items-center py-6 transition-colors ${activeTab === "Unknown" ? 'text-white bg-black' : 'text-zinc-600 hover:text-silver'}`}
          >
            Unknown <span className="ml-3 bg-titanium text-white text-xs px-2 py-0.5 rounded-sm">{results.unknown.length}</span>
          </button>
        </div>

        <div className="p-8 font-mono text-sm h-[300px] overflow-y-auto custom-scrollbar relative">
          {activeTab === "Generated" ? (
             generatedList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                   <CreditCard size={32} className="mb-4 opacity-50" />
                   No generated cards waiting.
                </div>
             ) : (
                <>
                <div className="sticky top-0 right-0 z-10 flex justify-end mb-4">
                  <button onClick={() => navigator.clipboard.writeText(generatedList.join('\n'))} className="text-xs text-acid border border-acid bg-black/80 backdrop-blur-md px-3 py-2 hover:bg-acid hover:text-black transition-colors font-bold uppercase tracking-widest">Copy All</button>
                </div>
                {generatedList.map((card, idx) => (
                  <div key={`gen-${idx}`} className="flex mb-2 whitespace-nowrap text-zinc-400 animate-in fade-in duration-300">
                    {card}
                  </div>
                ))}
                </>
             )
          ) : (
            results[activeTab.toLowerCase() as keyof typeof results].length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                 <CreditCard size={32} className="mb-4 opacity-50" />
                 No results yet.
              </div>
            ) : (
              <>
                {activeTab === "Live" && (
                  <div className="sticky top-0 right-0 z-10 flex justify-end mb-4">
                    <button 
                      onClick={() => extractAndUseAll(results.live)}
                      className="text-xs text-[#00ffbb] border border-[#00ffbb] bg-black/80 backdrop-blur-md px-3 py-2 hover:bg-[#00ffbb] hover:text-black transition-colors font-bold uppercase tracking-widest"
                    >
                      Send All to Checker
                    </button>
                  </div>
                )}
                {results[activeTab.toLowerCase() as keyof typeof results].map((res, idx) => (
                  <div key={idx} className="flex items-center mb-2 whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-300">
                    <span className={`w-16 ${res.status === 'Live' ? 'text-acid' : res.status === 'Die' ? 'text-red-500' : 'text-yellow-500 font-bold'}`}>
                      {res.status}
                    </span>
                    <span className="text-zinc-600 mx-2">|</span>
                    <span className="text-zinc-300 mr-4">{res.cardInfo}</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-zinc-400 mx-4">[BIN: 🇺🇸 - {res.network} - credit]</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-zinc-400 ml-4 flex-1">{res.message}</span>
                  </div>
                ))}
              </>
            )
          )}
        </div>
      </div>

      <AdvancedChecker ref={advancedCheckerRef} />
    </div>
  );
}
