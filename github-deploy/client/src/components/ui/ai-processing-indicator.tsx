import { Brain, Cpu, Activity, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface AIProcessingIndicatorProps {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'complete';
  progress?: number;
}

export default function AIProcessingIndicator({ stage, progress = 0 }: AIProcessingIndicatorProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIntensity(Math.sin(Date.now() / 500) * 0.5 + 0.5);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const stages = [
    { 
      id: 'uploading', 
      label: 'Upload & Extract', 
      icon: Zap, 
      color: 'cyan',
      description: 'Uploading audio data to neural networks'
    },
    { 
      id: 'extracting', 
      label: 'Data Processing', 
      icon: Cpu, 
      color: 'purple',
      description: 'Extracting acoustic features and patterns'
    },
    { 
      id: 'analyzing', 
      label: 'AI Analysis', 
      icon: Brain, 
      color: 'blue',
      description: 'Deep learning analysis in progress'
    },
    { 
      id: 'generating', 
      label: 'Generate Insights', 
      icon: Activity, 
      color: 'green',
      description: 'Creating personalized coaching recommendations'
    }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className="bg-gradient-to-br from-slate-900/95 to-blue-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Brain className="w-8 h-8 text-white" style={{ opacity: 0.7 + pulseIntensity * 0.3 }} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Neural Processing Active</h3>
        <p className="text-slate-300">Advanced AI coaching analysis in progress</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-300">Overall Progress</span>
          <span className="text-sm font-medium text-cyan-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Processing Stages */}
      <div className="space-y-4">
        {stages.map((stageItem, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          const IconComponent = stageItem.icon;
          
          return (
            <div 
              key={stageItem.id}
              className={`flex items-center p-4 rounded-xl border transition-all duration-500 ${
                isActive 
                  ? `bg-gradient-to-r from-${stageItem.color}-500/20 to-${stageItem.color}-600/20 border-${stageItem.color}-500/30 shadow-lg` 
                  : isComplete
                    ? 'bg-slate-800/50 border-slate-600/30'
                    : 'bg-slate-800/30 border-slate-700/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                isActive 
                  ? `bg-gradient-to-br from-${stageItem.color}-500 to-${stageItem.color}-600 shadow-lg` 
                  : isComplete
                    ? 'bg-green-600'
                    : 'bg-slate-700'
              }`}>
                <IconComponent 
                  className={`w-5 h-5 text-white ${isActive ? 'animate-pulse' : ''}`} 
                />
              </div>
              
              <div className="flex-1">
                <h4 className={`font-semibold ${
                  isActive ? 'text-white' : isComplete ? 'text-green-200' : 'text-slate-400'
                }`}>
                  {stageItem.label}
                </h4>
                <p className={`text-sm ${
                  isActive ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {stageItem.description}
                </p>
              </div>
              
              {isActive && (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
                </div>
              )}
              
              {isComplete && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 text-white">✓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Neural Activity Visualization */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <div className="flex items-center justify-center space-x-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xs text-slate-400">Neural Nodes</span>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-300"></div>
            </div>
            <span className="text-xs text-slate-400">Processing</span>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-700"></div>
            </div>
            <span className="text-xs text-slate-400">Output Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}