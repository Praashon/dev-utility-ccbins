"use client";

import { useState, useEffect } from "react";
import GSAPCard from "@/components/GSAPCard";
import BulkTools from "@/components/BulkTools";
import { generateCardData, GeneratedCard } from "@/lib/card-utils";
import { getTempEmail, getMessages, getMessageData, EmailMessage, EmailMessageDetail } from "@/lib/email-api";
import { Copy, RefreshCw, Terminal, Check, ArrowLeft } from "lucide-react";
import gsap from "gsap";
import DOMPurify from "dompurify";

export default function Home() {
  const [view, setView] = useState<"single" | "bulk">("single");
  const [card, setCard] = useState<GeneratedCard | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageDetail | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);

  useEffect(() => {
    // Generate initial card async to avoid hydration mismatch and sync setState error
    const timer = setTimeout(() => {
      setCard(generateCardData("visa"));
      
      // Animate page elements entering
      gsap.fromTo(
        ".stagger-enter",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGenCard = (network: "visa" | "mastercard" | "amex") => {
    setCard(generateCardData(network));
  };

  const handleGenEmail = async () => {
    setLoading(true);
    try {
      const newEmail = await getTempEmail();
      setEmail(newEmail);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const checkMail = async () => {
    if (!email) return;
    try {
      const msgs = await getMessages(email);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenMessage = async (msgId: string) => {
    if (!email) return;
    setLoadingMessage(true);
    try {
      const data = await getMessageData(email, msgId);
      setSelectedMessage(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingMessage(false);
  };

  useEffect(() => {
    if (!email) return;
    checkMail();
    const interval = setInterval(checkMail, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCommand = (e: any) => {
      const { action, network } = e.detail;
      if (action === "GEN_CARD") {
        handleGenCard(network);
      } else if (action === "NEW_EMAIL") {
        handleGenEmail();
      } else if (action === "CHECK_EMAIL") {
        checkMail();
      }
    };

    window.addEventListener("dev-utility-action", handleCommand);
    return () => window.removeEventListener("dev-utility-action", handleCommand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-silver flex flex-col font-sans selection:bg-acid selection:text-black hover:cursor-crosshair">
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center border-b border-titanium/50 stagger-enter">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-acid text-black flex items-center justify-center font-bold">
            <Terminal size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">Dev<span className="text-silver">Utility</span></h1>
        </div>
        
        <div className="flex border border-titanium bg-black p-1">
          <button 
            onClick={() => setView("single")}
            className={`px-6 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${view === 'single' ? 'bg-acid text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Single
          </button>
          <button 
            onClick={() => setView("bulk")}
            className={`px-6 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${view === 'bulk' ? 'bg-acid text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Bulk Output
          </button>
        </div>

        <div className="text-xs font-mono tracking-[0.2em] text-zinc-500 uppercase border border-titanium px-4 py-2 hover:border-acid hover:text-acid transition-colors">
          Press CMD+K
        </div>
      </header>

      {/* Main Content Area */}
      {view === "single" ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-titanium/50">
          
          {/* Left Panel: Card Gen */}
        <section className="bg-black p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-titanium rounded-full blur-[160px] opacity-5 group-hover:opacity-20 transition-opacity duration-1000 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="z-10 mb-16 transform hover:scale-[1.02] hover:-translate-y-2 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer stagger-enter" onClick={() => copyToClipboard(card?.number || "")}>
            <GSAPCard card={card} />
          </div>

          <div className="z-10 flex space-x-0 border border-titanium stagger-enter">
            <button onClick={() => handleGenCard("visa")} className="px-8 py-4 border-r border-titanium hover:bg-white hover:text-black transition-colors uppercase tracking-widest text-xs font-bold w-32 text-center">
              Visa
            </button>
            <button onClick={() => handleGenCard("mastercard")} className="px-8 py-4 border-r border-titanium hover:bg-white hover:text-black transition-colors uppercase tracking-widest text-xs font-bold w-32 text-center">
              Master
            </button>
            <button onClick={() => handleGenCard("amex")} className="px-8 py-4 hover:bg-white hover:text-black transition-colors uppercase tracking-widest text-xs font-bold w-32 text-center">
              Amex
            </button>
          </div>

          {card && (
            <div className="mt-16 w-full max-w-lg border border-titanium p-8 text-sm font-mono stagger-enter relative bg-black/50">
               <div className="absolute -top-3 left-6 bg-black px-2 text-xs uppercase tracking-widest text-acid">Identity payload</div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-zinc-600 mb-2 uppercase text-xs tracking-widest">Street</div>
                  <div className="text-foreground flex justify-between items-center group/btn cursor-pointer hover:text-acid transition-colors" onClick={() => copyToClipboard(card.fakeAddress.street)}>
                    {card.fakeAddress.street}
                    {copiedText === card.fakeAddress.street ? <Check size={14} className="text-acid" /> : <Copy size={14} className="opacity-0 group-hover/btn:opacity-100" />}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-600 mb-2 uppercase text-xs tracking-widest">Location</div>
                  <div className="text-foreground flex justify-between items-center group/btn cursor-pointer hover:text-acid transition-colors" onClick={() => copyToClipboard(`${card.fakeAddress.city}, ${card.fakeAddress.state} ${card.fakeAddress.zipCode}`)}>
                    <span className="truncate">{card.fakeAddress.city}, {card.fakeAddress.state}</span>
                    {copiedText === `${card.fakeAddress.city}, ${card.fakeAddress.state} ${card.fakeAddress.zipCode}` ? <Check size={14} className="text-acid" /> : <Copy size={14} className="opacity-0 group-hover/btn:opacity-100 min-w-4" />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Panel: Temp Mail */}
        <section className="bg-black p-8 lg:p-16 flex flex-col">
          <div className="mb-12 flex justify-between items-end stagger-enter">
            <div>
              <h2 className="text-4xl font-bold tracking-tighter text-white uppercase mb-4">Inbox Stream</h2>
              <p className="text-zinc-500 max-w-sm font-mono text-sm leading-relaxed">Receive OTP payloads instantly. Session destroys on reload.</p>
            </div>
            <button 
              onClick={handleGenEmail}
              disabled={loading}
              className="bg-acid text-black px-8 py-4 uppercase tracking-widest text-xs font-bold hover:bg-white transition-colors"
            >
              {loading ? "Allocating..." : "New Email"}
            </button>
          </div>

          <div className="border border-titanium flex-1 p-8 relative stagger-enter bg-black/50">
            {email ? (
              <>
                <div className="flex justify-between items-center mb-8 pb-8 border-b border-titanium/50">
                  <div className="flex flex-col">
                    <span className="text-xs text-acid uppercase tracking-[0.2em] mb-2 font-bold flex items-center"><div className="w-2 h-2 bg-acid mr-2 animate-pulse"></div> Session Active</span>
                    <span 
                      className="text-3xl font-mono text-white cursor-pointer hover:text-acid transition-colors flex items-center group"
                      onClick={() => copyToClipboard(email)}
                    >
                      {email}
                      {copiedText === email ? <Check size={20} className="text-acid ml-4" /> : <Copy size={20} className="opacity-0 group-hover:opacity-100 ml-4 text-silver" />}
                    </span>
                  </div>
                  <button onClick={checkMail} className="p-4 border border-titanium hover:border-acid hover:text-acid transition-colors">
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedMessage ? (
                    <div className="flex flex-col bg-black border border-titanium">
                      <div className="p-4 border-b border-titanium flex items-center mb-4">
                        <button 
                          onClick={() => setSelectedMessage(null)}
                          className="mr-4 p-2 hover:bg-titanium/50 transition-colors text-silver hover:text-white"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-white truncate">{selectedMessage.subject}</h3>
                          <p className="text-xs text-zinc-500 font-mono truncate">From: {selectedMessage.from}</p>
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">{new Date(selectedMessage.date).toLocaleTimeString()}</div>
                      </div>
                      <div className="p-6 text-silver text-sm overflow-x-auto">
                        {loadingMessage ? (
                          <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-titanium" /></div>
                        ) : selectedMessage.htmlBody ? (
                          <div 
                            className="bg-white text-black p-4 font-sans preview-html rounded-sm"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMessage.htmlBody) }} 
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-zinc-300">{selectedMessage.textBody || selectedMessage.body || "No content."}</pre>
                        )}
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-600 font-mono text-sm text-center">
                      <div className="w-16 h-16 border border-titanium mb-6 flex items-center justify-center text-titanium animate-pulse">
                        <Terminal size={24} />
                      </div>
                      Listening for incoming traffic.<br/>
                      Polling mail.tm API every 10s...
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div 
                        key={m.id} 
                        onClick={() => handleOpenMessage(m.id)}
                        className="p-6 border border-titanium hover:border-acid cursor-pointer transition-colors group bg-black"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-lg text-white group-hover:text-acid transition-colors">{m.subject}</span>
                          <span className="text-xs text-zinc-500 font-mono">{new Date(m.date).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm text-silver font-mono">From: {m.from}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-sm text-center">
                 <div className="w-16 h-16 border border-titanium mb-6 flex items-center justify-center">
                    <Terminal size={24} className="opacity-50" />
                 </div>
                No active session.<br/>Allocate a new email to begin listening.
              </div>
            )}
          </div>
        </section>
      </div>
      ) : (
        <div className="flex-1 p-8 lg:p-16 max-w-7xl mx-auto w-full">
          <BulkTools />
        </div>
      )}
      
      {/* Toast Notification for Clipboard */}
      <div className={`fixed bottom-8 right-8 bg-acid text-black font-mono text-sm font-bold uppercase tracking-widest px-6 py-4 shadow-2xl transition-transform duration-300 z-50 ${copiedText ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        Copied to clipboard
      </div>
    </main>
  );
}
