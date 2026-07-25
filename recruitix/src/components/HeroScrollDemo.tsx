import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Star } from "lucide-react";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden bg-white dark:bg-black">
      <ContainerScroll
        titleComponent={
          <div className="text-center max-w-6xl mx-auto px-4">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <Badge className="bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium rounded-full">
                <Star className="w-3 h-3 mr-2 fill-current" />
                Trusted by 500+ Companies
              </Badge>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
              <span className="text-black dark:text-white">
                The Future of
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-800 via-black to-gray-900 dark:from-gray-200 dark:via-white dark:to-gray-100 bg-clip-text text-transparent font-mono tracking-wider">
                AI Recruitment
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-black/60 dark:text-white/60 mb-8 font-medium max-w-4xl mx-auto leading-relaxed">
              Transform your hiring process with intelligent assessments, real-time proctoring, 
              and advanced candidate evaluation powered by cutting-edge AI technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="group bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all duration-200 flex items-center">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group bg-transparent border-2 border-black/10 dark:border-white/10 text-black dark:text-white px-8 py-4 rounded-full font-semibold text-lg hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">500+</div>
                <div className="text-sm text-black/60 dark:text-white/60 font-medium">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">50K+</div>
                <div className="text-sm text-black/60 dark:text-white/60 font-medium">Assessments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">98%</div>
                <div className="text-sm text-black/60 dark:text-white/60 font-medium">Accuracy</div>
              </div>
            </div>
          </div>
        }
      >
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl overflow-hidden">
          {/* Modern Dashboard Interface */}
          <div className="absolute inset-4">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Interview</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Senior Developer Position</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Recording</span>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-4 h-[calc(100%-120px)]">
              {/* Video Feed */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">👤</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Candidate Video</p>
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-900 rounded-xl h-full p-4 font-mono text-sm">
                  <div className="text-green-400 mb-2"># Binary Search Implementation</div>
                  <div className="text-blue-400">def binary_search(arr, target):</div>
                  <div className="text-white ml-4">left, right = 0, len(arr) - 1</div>
                  <div className="text-white ml-4">while left &lt;= right:</div>
                  <div className="text-white ml-8">mid = (left + right) // 2</div>
                  <div className="text-yellow-400 ml-8">if arr[mid] == target:</div>
                  <div className="text-white ml-12">return mid</div>
                  <div className="animate-pulse bg-gray-700 w-2 h-4 inline-block"></div>
                </div>
              </div>

              {/* Monitoring Panel */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">AI Monitoring</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Integrity Score</span>
                    <span className="font-bold text-green-600">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Focus Level</span>
                    <span className="font-bold text-blue-600">High</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Code Quality</span>
                    <span className="font-bold text-purple-600">Excellent</span>
                  </div>
                  <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">All systems normal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}