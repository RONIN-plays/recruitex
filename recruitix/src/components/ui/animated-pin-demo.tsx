import React from "react";
import { PinContainer } from "@/components/ui/3d-pin";
import { Users, Shield, Code, Brain } from "lucide-react";

export function AnimatedPinDemo() {
  return (
    <div className="h-[40rem] w-full flex items-center justify-center bg-white dark:bg-black">
      <PinContainer title="Explore Recruitix" href="/candidate">
        <div className="flex flex-col p-4 tracking-tight text-gray-100/50 w-[20rem] h-[20rem] bg-gradient-to-b from-gray-800/50 to-gray-800/0 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-green-500 animate-pulse" />
            <div className="text-xs text-gray-400">Live Assessment</div>
          </div>

          {/* Content */}
          <div className="flex-1 mt-4 space-y-4">
            <div className="text-2xl font-bold text-gray-100">AI Recruitment Hub</div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gray-400">147</div>
                <div className="text-xs text-gray-400">Candidates</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gray-300">95%</div>
                <div className="text-xs text-gray-400">Success Rate</div>
              </div>
            </div>

            {/* Feature Icons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">AI Analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Secure</span>
              </div>
            </div>

            {/* Animated Waves */}
            <div className="relative h-20 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute w-full h-20"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, rgba(107, 114, 128, 0.1) 50%, transparent 100%)`,
                    animation: `wave ${2 + i * 0.5}s ease-in-out infinite`,
                    opacity: 0.3 / i,
                    transform: `translateY(${i * 10}px)`,
                  }}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div className="text-xs text-gray-400">Last update: now</div>
              <div className="text-gray-400 text-sm font-medium">Start →</div>
            </div>
          </div>
        </div>
      </PinContainer>

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}