import React from "react";
import { PinContainer } from "@/components/ui/3d-pin";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface InterviewPinCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  isCompleted: boolean;
  score?: { score: number; percentage: number };
  onStart: () => void;
}

export function InterviewPinCard({
  id,
  title,
  description,
  duration,
  icon: Icon,
  isCompleted,
  score,
  onStart,
}: InterviewPinCardProps) {
  return (
    <div className="h-[25rem] w-full flex items-center justify-center">
      <PinContainer title={`Start ${title}`} href="#">
        <div 
          className="flex flex-col p-6 tracking-tight text-gray-100/90 w-[18rem] h-[18rem] bg-gradient-to-b from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl cursor-pointer"
          onClick={onStart}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-300" />
              </div>
              {isCompleted && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Completed
                </Badge>
              )}
            </div>
            <div className={`size-3 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Duration</div>
                <div className="text-sm font-semibold text-gray-300">{duration}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Status</div>
                <div className="text-sm font-semibold text-gray-300">
                  {isCompleted ? 'Done' : 'Pending'}
                </div>
              </div>
            </div>

            {/* Score Display */}
            {isCompleted && score && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Your Score</span>
                  <span className="text-lg font-bold text-gray-200">
                    {score.score}/{score.score + (25 - score.score)} ({score.percentage}%)
                  </span>
                </div>
              </div>
            )}

            {/* Animated Progress Bar */}
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="absolute h-full bg-gradient-to-r from-gray-600 to-gray-400 transition-all duration-1000"
                style={{
                  width: isCompleted ? '100%' : '0%',
                  animation: isCompleted ? 'none' : 'pulse 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-4">
            <div className="text-xs text-gray-500">
              {isCompleted ? 'Completed' : 'Click to start'}
            </div>
            <div className="text-gray-400 text-sm font-medium">
              {isCompleted ? 'Review →' : 'Start →'}
            </div>
          </div>
        </div>
      </PinContainer>
    </div>
  );
}