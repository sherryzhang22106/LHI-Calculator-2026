import React, { useState, useEffect } from 'react';
import { QUESTIONS, DIMENSIONS } from '../constants';

interface QuizScreenProps {
  onComplete: (answers: Record<number, number>) => void;
}

const SCALE_OPTIONS = [
  { value: 1, label: '完全不同意', color: 'bg-slate-100 text-slate-500' },
  { value: 2, label: '比较不同意', color: 'bg-primary-50 text-primary-400' },
  { value: 3, label: '中立', color: 'bg-primary-100 text-primary-500' },
  { value: 4, label: '比较同意', color: 'bg-primary-200 text-primary-600' },
  { value: 5, label: '强烈同意', color: 'bg-primary-500 text-white' },
];

const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete }) => {
  // Group questions by dimension for pagination/flow
  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDimension = DIMENSIONS[currentDimIndex];
  const currentQuestions = QUESTIONS.filter(q => q.dimensionId === currentDimension.id);

  const progress = Object.keys(answers).length / QUESTIONS.length * 100;

  // Automatically scroll to top whenever the dimension page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentDimIndex]);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isCurrentDimComplete = currentQuestions.every(q => answers[q.id] !== undefined);

  const handleNext = async () => {
    if (currentDimIndex < DIMENSIONS.length - 1) {
      setCurrentDimIndex(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onComplete(answers);
      } catch (error) {
        setIsSubmitting(false);
        console.error('Submission failed:', error);
      }
    }
  };

  const handleBack = () => {
    if (currentDimIndex > 0) {
      setCurrentDimIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Progress Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-primary-100 shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary-600 tracking-wider uppercase flex items-center gap-2">
             <span className="text-lg">❤️</span> {currentDimension.nameCn} ({currentDimIndex + 1}/{DIMENSIONS.length})
          </span>
          <span className="text-xs text-primary-400 font-medium">
            {Math.round(progress)}% 完成
          </span>
        </div>
        <div className="max-w-2xl mx-auto w-full bg-primary-50 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-300 to-primary-500 h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fade-in">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center sm:justify-start gap-3">
            {currentDimension.nameCn}
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed bg-white/50 p-3 rounded-lg inline-block border border-primary-50">
            {currentDimension.description}
          </p>
        </div>

        <div className="space-y-10">
          {currentQuestions.map((q) => (
            <div key={q.id} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-primary-50/50 transition-all hover:shadow-md hover:border-primary-100">
              <p className="text-lg sm:text-xl text-slate-700 font-medium mb-6 leading-relaxed">
                {q.text}
              </p>
              
              {/* Option Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {SCALE_OPTIONS.map((option) => {
                  const isSelected = answers[q.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(q.id, option.value)}
                      className={`
                        group relative flex sm:flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-primary-500 bg-primary-50 shadow-inner' 
                          : 'border-transparent bg-slate-50 hover:bg-white hover:border-primary-200 hover:shadow-sm'
                        }
                      `}
                    >
                      {/* Checkmark for selected state */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-primary-500 text-xs sm:hidden">
                          ✓
                        </div>
                      )}

                      <div 
                        className={`
                          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold mb-0 sm:mb-2 mr-3 sm:mr-0 transition-colors
                          ${isSelected ? 'bg-primary-500 text-white' : 'bg-white text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-600'}
                        `}
                      >
                        {option.value}
                      </div>
                      <span 
                        className={`
                          text-xs sm:text-[11px] font-medium text-center
                          ${isSelected ? 'text-primary-700' : 'text-slate-500 group-hover:text-primary-600'}
                        `}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between gap-4 sticky bottom-6 z-10">
          <button
            onClick={handleBack}
            disabled={currentDimIndex === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-colors shadow-sm backdrop-blur-sm
              ${currentDimIndex === 0 
                ? 'opacity-0 cursor-default' 
                : 'text-slate-600 bg-white/90 border border-slate-200 hover:bg-white'
              }
            `}
          >
            上一页
          </button>

          <button
            onClick={handleNext}
            disabled={!isCurrentDimComplete || isSubmitting}
            className={`flex-1 max-w-md px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform
              ${!isCurrentDimComplete || isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-primary-300/50 hover:-translate-y-1 active:scale-95'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在分析中...
              </span>
            ) : (
              currentDimIndex === DIMENSIONS.length - 1 ? '💖 提交评估' : '下一页 →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;