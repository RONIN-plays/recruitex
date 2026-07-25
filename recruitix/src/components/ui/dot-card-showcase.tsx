import React from "react";
import DotCard from "./moving-dot-card";
import { FeatureDotCard } from "./feature-dot-card";
import { Code, Users, Shield, TrendingUp, Clock, CheckCircle } from "lucide-react";

export function DotCardShowcase() {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
            Interactive Dot Cards
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Animated counters with moving dot effects
          </p>
        </div>

        {/* Basic Dot Cards */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
            Basic Dot Cards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 justify-items-center">
            <DotCard target={25} duration={2000} label="Questions" />
            <DotCard target={90} duration={2500} label="Minutes" />
            <DotCard target={500} duration={3000} label="Companies" />
            <DotCard target={1200} duration={3500} label="Candidates" />
          </div>
        </div>

        {/* Feature Dot Cards */}
        <div>
          <h3 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
            Feature Cards with Dot Animation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <FeatureDotCard
              title="AI Analysis"
              description="Advanced semantic analysis and behavioral assessment with real-time insights"
              icon={Code}
              target={98}
              label="Accuracy %"
            />
            
            <FeatureDotCard
              title="User Management"
              description="Comprehensive candidate tracking and recruiter dashboard management"
              icon={Users}
              target={1500}
              label="Users"
            />
            
            <FeatureDotCard
              title="Security"
              description="Enterprise-grade security with advanced proctoring and integrity monitoring"
              icon={Shield}
              target={99}
              label="Uptime %"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">10k+</div>
              <div className="text-gray-600 dark:text-gray-400">Assessments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">95%</div>
              <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}