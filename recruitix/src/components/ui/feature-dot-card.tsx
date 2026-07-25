import React from 'react';
import { LucideIcon } from 'lucide-react';
import DotCard from './moving-dot-card';

interface FeatureDotCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  target: number;
  label: string;
  className?: string;
}

export function FeatureDotCard({
  title,
  description,
  icon: Icon,
  target,
  label,
  className = ""
}: FeatureDotCardProps) {
  return (
    <div className={`group hover:scale-105 transition-all duration-300 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-gray-700">
          <Icon className="w-7 h-7 text-gray-700 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-black dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{description}</p>
      </div>
      
      <div className="flex justify-center">
        <DotCard 
          target={target}
          duration={2500}
          label={label}
          className="mx-auto"
        />
      </div>
      
      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Live Analytics</span>
        </div>
      </div>
    </div>
  );
}