import React, { useEffect, useState } from 'react';

const AnalyzingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: '🧠', text: '分析您的依恋模式...', duration: 3000 },
    { icon: '💝', text: '评估关系健康度...', duration: 3000 },
    { icon: '✨', text: '识别您的优势特质...', duration: 3000 },
    { icon: '🎯', text: '生成专业建议...', duration: 3000 },
    { icon: '📊', text: '准备完整报告...', duration: 2000 },
  ];

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 3;
      });
    }, 200);

    // Step animation
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
          {/* Animated Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <span className="text-5xl animate-bounce">
                {steps[currentStep].icon}
              </span>
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-2 border-pink-200 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full -ml-1"></div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-purple-200 rounded-full animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full -ml-1"></div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            AI 正在分析中
          </h2>

          {/* Current Step */}
          <p className="text-pink-600 font-medium mb-6 h-6 transition-all duration-300">
            {steps[currentStep].text}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>分析中</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100">
            <p className="text-xs text-slate-600 leading-relaxed">
              💡 <span className="font-medium">小提示：</span>我们正在使用先进的 AI 技术为您生成个性化的恋爱健康分析报告，这需要一些时间来确保分析的准确性和专业性。
            </p>
          </div>

          {/* Animated Steps */}
          <div className="mt-6 flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-gradient-to-r from-pink-400 to-purple-400' 
                    : index < currentStep
                    ? 'w-2 bg-green-400'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-slate-400 text-xs mt-6">
          请不要关闭或刷新页面，分析完成后会自动跳转
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default AnalyzingScreen;
