import { QUESTIONS, DIMENSIONS } from '../constants';
import { AssessmentResult, DimensionResult } from '../types';

// Approximation of the normal cumulative distribution function (CDF)
// Mean 0, SD 1
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) return 1 - prob;
  return prob;
}

export function calculateAssessment(answers: Record<number, number>): AssessmentResult {
  const dimensionResults: DimensionResult[] = [];
  let totalZ = 0;

  // 1. Calculate Raw Scores and Dimension Averages
  DIMENSIONS.forEach(dim => {
    const dimQuestions = QUESTIONS.filter(q => q.dimensionId === dim.id);
    let rawSum = 0;

    dimQuestions.forEach(q => {
      let score = answers[q.id] || 3; // Default to neutral if missing
      // Handle Reverse Scoring (Note: Current questions set isReverse: false for all)
      if (q.isReverse) {
        score = 6 - score;
      }
      rawSum += score;
    });

    const avg = rawSum / dimQuestions.length;
    
    // 2. Z-Score Standardization (New Logic)
    // Formula: Z_dim = (3 - Avg_dim) / 1
    // Logic: 
    // High Avg (5) -> High Pathology -> Z = 3-5 = -2 (Low Health Z)
    // Low Avg (1) -> Low Pathology -> Z = 3-1 = +2 (High Health Z)
    // Positive Z indicates HEALTH.
    const zScore = (3 - avg) / 1; 

    // Calculate T-Score (Mean 50, SD 10)
    // T = 50 + 10 * Z
    // Z = +2 -> T = 70 (Healthy)
    // Z = -2 -> T = 30 (Unhealthy)
    const tScore = 50 + (10 * zScore);
    
    // Determine level based on Z (High Z = Healthy/Low Pathology)
    // Interpret 'level' as Health Level for the report
    let level: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (zScore < -0.5) level = 'Low'; // Low Health (High Pathology)
    if (zScore > 0.5) level = 'High'; // High Health (Low Pathology)

    dimensionResults.push({
      id: dim.id,
      name: dim.nameCn, // Use Chinese name for report
      rawScore: Number(avg.toFixed(2)),
      zScore: Number(zScore.toFixed(2)),
      tScore: Math.round(tScore),
      level
    });

    totalZ += zScore;
  });

  const avgZ = totalZ / 6;

  // 3. LHI Calculation
  // LHI = norm.cdf(Total_Z) * 100
  // Since Z is now a Health metric (Higher is better), we use it directly.
  const lhiScore = Math.round(normalCDF(avgZ) * 100);

  // 4. Thresholds & Interpretation
  let category: AssessmentResult['category'] = 'Average';
  if (lhiScore <= 30) category = 'Fragile';
  else if (lhiScore <= 50) category = 'Below Average';
  else if (lhiScore <= 70) category = 'Average';
  else category = 'Healthy';

  // 5. Attachment Style Classification
  // Logic: Cross Anxiety (d1) and Avoidance (d2) Z-Scores
  // Z-Scores: High (>0) = Low Pathology (Healthy). Low (<0) = High Pathology.
  
  const anxietyZ = dimensionResults.find(d => d.id === 'd1')?.zScore || 0;
  const avoidanceZ = dimensionResults.find(d => d.id === 'd2')?.zScore || 0;

  // Quadrants:
  // High Z (Healthy) / High Z (Healthy) = Low Anx / Low Avd = Secure
  // High Z (Healthy) / Low Z (Unhealthy) = Low Anx / High Avd = Dismissive-Avoidant
  // Low Z (Unhealthy) / High Z (Healthy) = High Anx / Low Avd = Anxious-Preoccupied
  // Low Z (Unhealthy) / Low Z (Unhealthy) = High Anx / High Avd = Fearful-Avoidant

  let attachmentStyle = 'Secure (安全型)';
  
  if (anxietyZ > 0 && avoidanceZ > 0) {
    attachmentStyle = 'Secure (安全型)'; // High Health on both
  } else if (anxietyZ > 0 && avoidanceZ <= 0) {
    attachmentStyle = 'Dismissive-Avoidant (疏离-回避型)'; // Low Anxiety, High Avoidance
  } else if (anxietyZ <= 0 && avoidanceZ > 0) {
    attachmentStyle = 'Anxious-Preoccupied (焦虑-迷恋型)'; // High Anxiety, Low Avoidance
  } else {
    attachmentStyle = 'Fearful-Avoidant (恐惧-回避型)'; // High Anxiety, High Avoidance
  }

  return {
    totalScore: lhiScore,
    category,
    dimensions: dimensionResults,
    attachmentStyle,
    timestamp: new Date().toLocaleDateString()
  };
}