"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { GeneratedCard } from "@/lib/card-utils";

interface GSAPCardProps {
  card: GeneratedCard | null;
}

export default function GSAPCard({ card }: GSAPCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (card && cardRef.current) {
      // Cinematically flip the card when data changes using GSAP
      gsap.fromTo(
        cardRef.current,
        { rotationY: -90, scale: 0.9, opacity: 0 },
        { rotationY: 0, scale: 1, opacity: 1, duration: 1.2, ease: "power4.out" }
      );
    }
  }, [card]);

  if (!card) {
    return (
      <div className="w-[400px] h-[240px] border border-titanium bg-titanium/20 flex items-center justify-center text-silver uppercase tracking-widest text-sm">
        No Card Generated
      </div>
    );
  }

  // Determine logo/color based on network (but keep it monochrome/acid)
  
  return (
    <div 
      ref={cardRef}
      className="relative w-[400px] h-[240px] bg-titanium border border-silver/20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between p-8"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-acid rounded-full opacity-5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      {/* Top row */}
      <div className="flex justify-between items-start z-10 w-full">
        <div className="text-2xl font-bold tracking-tighter uppercase text-acid drop-shadow-md">
          {card.network}
        </div>
        {/* Chip visual - sharp lines */}
        <div className="w-14 h-10 border border-silver/40 bg-gradient-to-br from-zinc-500/50 to-zinc-700/50 flex flex-col items-center justify-center space-y-1 p-1">
          <div className="w-full h-[1px] bg-silver/20"></div>
          <div className="w-full h-[1px] bg-silver/20"></div>
          <div className="w-full h-[1px] bg-silver/20"></div>
        </div>
      </div>

      {/* Number sequence */}
      <div className="z-10 mt-auto mb-6">
        <div className="text-3xl tracking-[0.25em] font-mono text-white drop-shadow-sm">
          {card.number}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex justify-between items-end z-10 w-full font-mono text-sm tracking-widest text-silver">
        <div className="flex flex-col uppercase">
          <span className="text-[10px] text-zinc-500 mb-1">Cardholder</span>
          <span className="text-white drop-shadow-sm">{card.name}</span>
        </div>
        
        <div className="flex space-x-8">
          <div className="flex flex-col uppercase">
            <span className="text-[10px] text-zinc-500 mb-1">Valid Thru</span>
            <span className="text-white drop-shadow-sm">{card.expiry}</span>
          </div>
          <div className="flex flex-col uppercase">
            <span className="text-[10px] text-zinc-500 mb-1">CVC</span>
            <span className="text-white drop-shadow-sm">{card.cvc}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
