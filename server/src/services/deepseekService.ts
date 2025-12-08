import fetch from 'node-fetch';

interface DeepSeekAnalysis {
  resultInterpretation: string;
  personalizedAdvice: string;
  strengths: string;
  areasToWatch: string;
  professionalAdvice: string;
}

export class DeepSeekService {
  private static readonly API_KEY = 'sk-448ce19cde5643e7894695332072dd58';
  private static readonly API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private static readonly MODEL = 'deepseek-chat';

  static async analyzeAssessment(
    totalScore: number,
    category: string,
    attachmentStyle: string,
    dimensions: Array<{ id: string; name: string; rawScore: number; tScore: number; level: string }>
  ): Promise<DeepSeekAnalysis> {
    const prompt = this.buildPrompt(totalScore, category, attachmentStyle, dimensions);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: '你是专业心理咨询师。必须严格按照用户要求的格式输出，每个###标题后都要有独立的内容段落。不要把所有内容写在一起。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      console.log('=== DeepSeek Raw Response ===');
      console.log(content);
      console.log('=== End Response ===');

      const parsed = this.parseResponse(content);
      
      console.log('=== Parsed Sections ===');
      console.log('resultInterpretation:', parsed.resultInterpretation.substring(0, 50) + '...');
      console.log('strengths:', parsed.strengths.substring(0, 50) + '...');
      console.log('areasToWatch:', parsed.areasToWatch.substring(0, 50) + '...');
      console.log('personalizedAdvice:', parsed.personalizedAdvice.substring(0, 50) + '...');
      console.log('professionalAdvice:', parsed.professionalAdvice.substring(0, 50) + '...');

      return parsed;
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      return this.getFallbackAnalysis(totalScore, category, attachmentStyle);
    }
  }

  private static buildPrompt(
    totalScore: number,
    category: string,
    attachmentStyle: string,
    dimensions: Array<{ id: string; name: string; rawScore: number; tScore: number; level: string }>
  ): string {
    const dimensionDetails = dimensions.map(d => 
      `${d.name}: T分${d.tScore} (${d.level === 'High' ? '健康' : d.level === 'Low' ? '需关注' : '中等'})`
    ).join(', ');

    return `【恋爱健康指数评估结果】
总分：${totalScore}/100 (${category})
依恋风格：${attachmentStyle}
各维度：${dimensionDetails}

【评分模型说明】
- 问卷40题，每题1-5分（1=完全不同意，5=强烈同意）
- 6个维度测量负面模式：焦虑、回避、控制、嫉妒、依赖、不安全感
- T分数计算：Z = (3 - 平均分) / 1，T = 50 + 10Z
- T分数越高=负面特质越低=关系越健康
- LHI总分 0-100：越高越健康
- 0-30=脆弱(高风险)，31-50=偏低，51-70=平均，71-100=健康

【当前结果解读】
- 总分${totalScore}：${totalScore >= 71 ? '健康的爱' : totalScore >= 51 ? '平均水平' : totalScore >= 31 ? '有改善空间' : '需要关注'}
- T分高的维度（接近或超过50）=该方面健康
- T分低的维度（低于50）=该方面需改善

严格按以下格式输出5个独立部分（各150字）：

### 结果解释
解释LHI ${totalScore}分在0-100量表的含义，说明${attachmentStyle}的核心特征。

### 你的优势  
指出T分数≥50的健康维度，肯定积极特质。

### 需要注意的方面
指出T分数<50的需改善维度，说明潜在风险。

### 个性化建议
针对得分低的具体维度给出实际可行的改善方法。

### 专业建议
提供系统的成长方向和练习建议。

重要：每个###后必须有独立内容，不要合并！`;
  }

  private static parseResponse(content: string): DeepSeekAnalysis {
    const sections = {
      resultInterpretation: '',
      personalizedAdvice: '',
      strengths: '',
      areasToWatch: '',
      professionalAdvice: '',
    };

    // Split by ### markers
    const parts = content.split(/###\s*/);
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      
      // Extract section content after the header
      if (trimmedPart.startsWith('结果解释')) {
        sections.resultInterpretation = trimmedPart.replace(/^结果解释[：:\s]*/, '').trim();
      } else if (trimmedPart.startsWith('你的优势') || trimmedPart.startsWith('优势')) {
        sections.strengths = trimmedPart.replace(/^(你的)?优势[：:\s]*/, '').trim();
      } else if (trimmedPart.startsWith('需要注意')) {
        sections.areasToWatch = trimmedPart.replace(/^需要注意(的方面)?[：:\s]*/, '').trim();
      } else if (trimmedPart.startsWith('个性化建议')) {
        sections.personalizedAdvice = trimmedPart.replace(/^个性化建议[：:\s]*/, '').trim();
      } else if (trimmedPart.startsWith('专业建议')) {
        sections.professionalAdvice = trimmedPart.replace(/^专业建议[：:\s]*/, '').trim();
      }
    }

    // If parsing failed, try simple approach
    if (!sections.resultInterpretation && !sections.strengths) {
      // Fall back to splitting by common patterns
      const lines = content.split('\n\n');
      if (lines.length >= 5) {
        sections.resultInterpretation = lines[0] || '';
        sections.strengths = lines[1] || '';
        sections.areasToWatch = lines[2] || '';
        sections.personalizedAdvice = lines[3] || '';
        sections.professionalAdvice = lines[4] || '';
      } else {
        // If still failing, distribute content evenly
        const fullText = content.replace(/###/g, '').trim();
        sections.resultInterpretation = fullText;
      }
    }

    return sections;
  }

  private static getFallbackAnalysis(
    totalScore: number,
    category: string,
    attachmentStyle: string
  ): DeepSeekAnalysis {
    return {
      resultInterpretation: `您的恋爱健康指数为 ${totalScore} 分，处于${category}水平。这个分数反映了您当前恋爱关系的整体健康状况。您的依恋风格是${attachmentStyle}，这会影响您在亲密关系中的互动模式。`,
      personalizedAdvice: '建议您关注自己在关系中的情绪模式，学会识别和表达自己的需求。保持开放的沟通，建立健康的边界，同时也要给予伴侣足够的信任和空间。',
      strengths: '您已经迈出了重要的一步，愿意了解和改善自己的恋爱关系。这种自我觉察能力是建立健康关系的基础。',
      areasToWatch: '请关注可能影响关系质量的因素，包括情绪管理、沟通方式和依恋模式。适时寻求专业帮助可以更有效地改善这些方面。',
      professionalAdvice: '建议定期进行自我反思，必要时可以考虑寻求专业心理咨询。通过系统的学习和实践，您可以培养更健康的恋爱模式。',
    };
  }
}
