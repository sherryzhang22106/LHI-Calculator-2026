import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ReportScreen from './components/ReportScreen';
import AnalyzingScreen from './components/AnalyzingScreen';
import SharedResultScreen from './components/SharedResultScreen';
import AdminApp from './admin/AdminApp';
import { QuizState, AssessmentResult } from './types';
import { calculateAssessment } from './services/scoring';
import { apiClient } from './services/api/client';

const App: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    currentStep: 'welcome',
    answers: {},
    accessCode: ''
  });

  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [sharedAssessmentId, setSharedAssessmentId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    
    if (pathname === '/admin') {
      setIsAdminMode(true);
    } else if (pathname.startsWith('/share/')) {
      const id = pathname.split('/share/')[1];
      setSharedAssessmentId(id);
    }
  }, []);

  // Check for shared results in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        // Decode base64 -> uri component -> json
        const jsonString = decodeURIComponent(atob(shareData));
        const sharedResult = JSON.parse(jsonString) as AssessmentResult;
        
        if (sharedResult && sharedResult.totalScore !== undefined) {
          setResult(sharedResult);
          setQuizState(prev => ({
            ...prev,
            currentStep: 'report'
          }));
        }
      } catch (e) {
        console.error("Failed to parse shared result", e);
        // Optionally remove invalid query param
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleStart = (code: string) => {
    setQuizState(prev => ({
      ...prev,
      accessCode: code,
      currentStep: 'quiz'
    }));
  };

  const handleQuizComplete = async (answers: Record<number, number>) => {
    const assessmentResult = calculateAssessment(answers);
    
    // Show analyzing screen
    setIsAnalyzing(true);
    setQuizState(prev => ({ ...prev, answers }));
    
    // Save to backend and get AI analysis
    try {
      const response = await apiClient.submitAssessment({
        accessCode: quizState.accessCode,
        totalScore: assessmentResult.totalScore,
        category: assessmentResult.category,
        attachmentStyle: assessmentResult.attachmentStyle,
        dimensions: assessmentResult.dimensions,
        answers,
      });

      // Add AI analysis and assessment ID to result
      const finalResult = {
        ...assessmentResult,
        aiAnalysis: response.aiAnalysis,
        assessmentId: response.id,
      };

      console.log('=== Backend Response ===');
      console.log('AI Analysis from backend:', response.aiAnalysis);
      console.log('Final Result:', finalResult);

      setResult(finalResult);
      setIsAnalyzing(false);
      setQuizState(prev => ({
        ...prev,
        answers,
        currentStep: 'report'
      }));
    } catch (error) {
      console.error('Failed to save assessment:', error);
      // Still show result even if backend fails
      setResult(assessmentResult);
      setIsAnalyzing(false);
      setQuizState(prev => ({
        ...prev,
        answers,
        currentStep: 'report'
      }));
    }
  };

  if (isAdminMode) {
    return <AdminApp />;
  }

  if (sharedAssessmentId) {
    return <SharedResultScreen assessmentId={sharedAssessmentId} />;
  }

  // Show analyzing screen when processing
  if (isAnalyzing) {
    return <AnalyzingScreen />;
  }

  return (
    <div className="font-sans antialiased text-slate-900 bg-primary-50 min-h-screen">
      {quizState.currentStep === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}
      {quizState.currentStep === 'quiz' && (
        <QuizScreen onComplete={handleQuizComplete} />
      )}
      {quizState.currentStep === 'report' && result && (
        <ReportScreen result={result} />
      )}
    </div>
  );
};

export default App;