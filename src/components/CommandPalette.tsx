"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Terminal, CreditCard, Mail } from "lucide-react";
import gsap from "gsap";

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      gsap.fromTo(
        ".cmd-content",
        { opacity: 0, scale: 0.95, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power4.out" }
      );
    }
  }, [open]);

  const dispatchAction = (action: string, detail?: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent("dev-utility-action", { detail: { action, ...detail } }));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/80 backdrop-blur-sm">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setOpen(false)}></div>
      
      <div className="cmd-content relative w-full max-w-2xl bg-black border border-titanium shadow-2xl overflow-hidden">
        <Command label="Command Menu" className="flex flex-col w-full text-silver">
          <div className="flex items-center border-b border-titanium px-4">
            <Terminal size={18} className="text-acid mr-3" />
            <Command.Input 
              placeholder="Type a command or search..." 
              className="w-full bg-transparent outline-none border-none py-5 text-lg text-white placeholder:text-zinc-600 font-mono focus:ring-0"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="py-6 text-center text-sm font-mono text-zinc-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Credit Cards" className="px-2 py-3 text-xs tracking-widest uppercase text-zinc-500 font-bold [&_[cmdk-group-items]]:mt-2">
              <Command.Item 
                onSelect={() => dispatchAction("GEN_CARD", { network: "visa" })}
                className="flex items-center px-4 py-3 text-sm font-mono text-white cursor-pointer aria-selected:bg-titanium aria-selected:text-acid transition-colors"
                value="generate visa credit card"
              >
                <CreditCard size={14} className="mr-3" />
                Generate Visa
              </Command.Item>
              <Command.Item 
                onSelect={() => dispatchAction("GEN_CARD", { network: "mastercard" })}
                className="flex items-center px-4 py-3 text-sm font-mono text-white cursor-pointer aria-selected:bg-titanium aria-selected:text-acid transition-colors"
                value="generate mastercard credit card"
              >
                <CreditCard size={14} className="mr-3" />
                Generate Mastercard
              </Command.Item>
              <Command.Item 
                onSelect={() => dispatchAction("GEN_CARD", { network: "amex" })}
                className="flex items-center px-4 py-3 text-sm font-mono text-white cursor-pointer aria-selected:bg-titanium aria-selected:text-acid transition-colors"
                value="generate amex american express credit card"
              >
                <CreditCard size={14} className="mr-3" />
                Generate Amex
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Email Inbox" className="px-2 py-3 text-xs tracking-widest uppercase text-zinc-500 font-bold border-t border-titanium/30 [&_[cmdk-group-items]]:mt-2">
              <Command.Item 
                onSelect={() => dispatchAction("NEW_EMAIL")}
                className="flex items-center px-4 py-3 text-sm font-mono text-white cursor-pointer aria-selected:bg-titanium aria-selected:text-acid transition-colors"
                value="generate new temp email inbox"
              >
                <Mail size={14} className="mr-3" />
                Allocate New Temp Email
              </Command.Item>
              <Command.Item 
                onSelect={() => dispatchAction("CHECK_EMAIL")}
                className="flex items-center px-4 py-3 text-sm font-mono text-white cursor-pointer aria-selected:bg-titanium aria-selected:text-acid transition-colors"
                value="refresh check inbox messages"
              >
                <Terminal size={14} className="mr-3" />
                Force Refresh Inbox
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
