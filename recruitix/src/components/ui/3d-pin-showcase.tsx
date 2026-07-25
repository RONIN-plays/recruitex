import React from "react";
import { PinContainer } from "@/components/ui/3d-pin";
import { Brain, Shield, Code, Users } from "lucide-react";

export function ThreeDPinShowcase() {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
            Interactive 3D Cards
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Hover over the cards to see the 3D pin effect in action
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* AI Analysis Card */}
          <div className="h-[25rem] w-full flex items-center justify-center">
            <PinContainer title="AI Analysis" href="#">
              <div className="flex flex-col p-6 tracking-tight text-gray-100/90 w-[18rem] h-[18rem] bg-gradient-to-b from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="size-3 rounded-full bg-blue-500 animate-pulse" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-gray-100">AI-Powered Analysis</h3>
                  <p className="text-sm text-gray-400">Advanced semantic analysis and behavioral assessment</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Accuracy</div>
                      <div className="text-sm font-semibold text-gray-300">98.5%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Speed</div>
                      <div className="text-sm font-semibold text-gray-300">Real-time</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="text-xs text-gray-500">Active</div>
                  <div className="text-gray-400 text-sm font-medium">Learn →</div>
                </div>
              </div>
            </PinContainer>
          </div>

          {/* Security Card */}
          <div className="h-[25rem] w-full flex items-center justify-center">
            <PinContainer title="Security Features" href="#">
              <div className="flex flex-col p-6 tracking-tight text-gray-100/90 w-[18rem] h-[18rem] bg-gradient-to-b from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-gray-100">Enterprise Security</h3>
                  <p className="text-sm text-gray-400">Advanced proctoring and integrity monitoring</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Uptime</div>
                      <div className="text-sm font-semibold text-gray-300">99.9%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Compliance</div>
                      <div className="text-sm font-semibold text-gray-300">SOC 2</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="text-xs text-gray-500">Protected</div>
                  <div className="text-gray-400 text-sm font-medium">Secure →</div>
                </div>
              </div>
            </PinContainer>
          </div>

          {/* Candidates Card */}
          <div className="h-[25rem] w-full flex items-center justify-center">
            <PinContainer title="Candidate Management" href="#">
              <div className="flex flex-col p-6 tracking-tight text-gray-100/90 w-[18rem] h-[18rem] bg-gradient-to-b from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="size-3 rounded-full bg-yellow-500 animate-pulse" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-gray-100">Smart Recruitment</h3>
                  <p className="text-sm text-gray-400">Streamlined candidate evaluation and management</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Processed</div>
                      <div className="text-sm font-semibold text-gray-300">1,247</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Success</div>
                      <div className="text-sm font-semibold text-gray-300">87%</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="text-xs text-gray-500">Live</div>
                  <div className="text-gray-400 text-sm font-medium">Manage →</div>
                </div>
              </div>
            </PinContainer>
          </div>
        </div>
      </div>
    </div>
  );
}