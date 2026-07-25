import React from "react";
import { PinContainer } from "@/components/ui/3d-pin";
import { LucideIcon } from "lucide-react";

interface RecruiterStatsPinProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function RecruiterStatsPin({
  title,
  value,
  description,
  icon: Icon,
  color,
  trend,
}: RecruiterStatsPinProps) {
  return (
    <div className="h-[22rem] w-full flex items-center justify-center">
      <PinContainer title={`View ${title} Details`} href="#">
        <div className="flex flex-col p-6 tracking-tight text-gray-100/90 w-[16rem] h-[16rem] bg-gradient-to-b from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="size-3 rounded-full bg-green-500 animate-pulse" />
          </div>

          {/* Main Value */}
          <div className="flex-1 space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-100 mb-2">{value}</div>
              <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-400">Trend:</span>
                  <span className={`text-sm font-semibold ${
                    trend.isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                </div>
              </div>
            )}

            {/* Animated Progress Bar */}
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className={`absolute h-full ${color.replace('bg-', 'bg-')} transition-all duration-1000`}
                style={{
                  width: '75%',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-4">
            <div className="text-xs text-gray-500">Live data</div>
            <div className="text-gray-400 text-sm font-medium">View →</div>
          </div>
        </div>
      </PinContainer>
    </div>
  );
}