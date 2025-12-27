import fetch from 'node-fetch';
import prisma from '../config/database';

interface DeepSeekAnalysis {
  resultInterpretation: string;
  personalizedAdvice: string;
  strengths: string;
  areasToWatch: string;
  professionalAdvice: string;
}

interface GenerateASAReportRequest {
  scores: {
    secure: number;
    anxious: number;
    avoidant: number;
    fearful: number;
  };
  primaryType: string;
  answerSummary: string;
  accessCodeId?: string;
  ipAddress?: string;
}

// Rate limiting storage (简单的内存存储，生产环境建议使用 Redis)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ipAddress: string, maxRequests: number = 3, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ipAddress) || [];

  // 过滤掉超出时间窗口的请求
  const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(ipAddress, recentTimestamps);
  return true;
}

export class DeepSeekService {
  private static readonly API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-448ce19cde5643e7894695332072dd58';
  private static readonly API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  private static readonly MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

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

  // ASA 深度报告生成方法
  static async generateASAReport(data: GenerateASAReportRequest): Promise<{ success: boolean; report?: string; error?: string }> {
    try {
      // 检查速率限制
      if (data.ipAddress && !checkRateLimit(data.ipAddress, 3, 3600000)) {
        return {
          success: false,
          error: '您请求报告的次数过多，请 1 小时后再试'
        };
      }

      // 检查 API Key
      if (!this.API_KEY) {
        console.error('DEEPSEEK_API_KEY is not configured');
        return {
          success: false,
          error: 'AI 服务配置错误，请联系技术支持'
        };
      }

      const MAX_PER_TYPE = 160;
      const rates = {
        secure: ((data.scores.secure / MAX_PER_TYPE) * 100).toFixed(1),
        anxious: ((data.scores.anxious / MAX_PER_TYPE) * 100).toFixed(1),
        avoidant: ((data.scores.avoidant / MAX_PER_TYPE) * 100).toFixed(1),
        fearful: ((data.scores.fearful / MAX_PER_TYPE) * 100).toFixed(1),
      };

      const prompt = `你是一位精通依恋理论（Attachment Theory）的资深心理咨询师，拥有20年以上的临床经验。请基于用户的测评结果，生成一份完整、专业的心理分析报告。

**用户依恋类型测评结果：**
- 主导类型：${data.primaryType}
- 安全型得分：${data.scores.secure}/160（${rates.secure}%）
- 焦虑型得分：${data.scores.anxious}/160（${rates.anxious}%）
- 回避型得分：${data.scores.avoidant}/160（${rates.avoidant}%）
- 恐惧型得分：${data.scores.fearful}/160（${rates.fearful}%）

**关键题目答案摘要：**
${data.answerSummary}

**核心要求：**
1. **必须完整生成所有6个章节** - 绝不能在中途停止
2. 每个章节都要完整表达，有明确的开头和结尾
3. 最后一个章节必须有完整的结束语
2. **详细结构**（使用 Markdown 格式）：
   
   **一、关系底色：核心模式深度解析**（1000-1200字）
   - 主导依恋类型的形成原因（童年经历、原生家庭影响）
   - 该类型的核心情感需求和恐惧
   - 在亲密关系中的典型表现模式
   - 与其他依恋类型得分的交互影响分析
   - 该类型在不同关系阶段的演变特征
   
   **二、潜意识回响：防御机制深度解构**（1000-1200字）
   - 结合用户的具体答案，分析潜意识防御机制
   - 识别重复出现的关系模式和行为闭环
   - 分析情绪触发点和应对策略
   - 深入探讨回避、投射、合理化等防御机制
   - 这些模式如何在日常互动中表现出来
   - 用具体场景举例（如沟通冲突、亲密时刻、分离焦虑等）
   
   **三、内在锚点：优势识别与资源盘点**（600-800字）
   - 从测评中识别出的关系优势和健康模式
   - 已经具备的安全感来源
   - 成功的关系体验和积极互动模式
   - 个人成长中的突破点
   - 可以依靠的内在力量和外部支持系统
   
   **四、安全感重塑：系统化成长路径**（1000-1200字）
   - **第1-2个月：觉察期**
     - 每日情绪日记练习（具体方法）
     - 识别触发点和自动化反应
     - 具体的觉察练习步骤
   - **第3-4个月：理解期**
     - 深入理解依恋模式的来源
     - 与伴侣的沟通练习（提供对话模板）
     - 边界设定的具体方法
   - **第5-6个月：重建期**
     - 建立新的互动模式
     - 安全感练习（具体步骤）
     - 冲突处理的新策略
   - 每个阶段都要提供3-5个具体可操作的练习
   
   **五、关系动力学：与不同类型的相处智慧**（500-700字）
   - 你的依恋类型与安全型伴侣的相处建议
   - 你的依恋类型与焦虑型伴侣的相处建议
   - 你的依恋类型与回避型伴侣的相处建议
   - 你的依恋类型与恐惧型伴侣的相处建议
   - 每种组合提供具体的沟通策略和注意事项
   
   **六、结语：书写新的依恋故事**（500-1000字）
   - 总结核心洞察
   - 鼓励性的结束语
   - 长期成长的愿景

3. **语言风格要求**：
   - 温暖、共情、专业，像在进行一对一深度咨询
   - 使用第二人称"你"，营造亲切对话感
   - 每个大段落用富有诗意的比喻或意象开场
   - 大量使用具体场景举例（至少15-20个真实场景）
   - 提供可操作的具体建议，而非空泛的鼓励
   - 深入分析，不要浅尝辄止

4. **内容深度要求**：
   - 必须详细展开每个观点，不要简单列举
   - 每个防御机制都要用具体例子说明
   - 每个练习都要提供详细步骤
   - 分析要有深度，触及潜意识层面
   - 结合心理学理论（如客体关系理论、依恋理论研究）

5. **禁忌**：
   - 不要简略概括，必须详细展开
   - 不使用"建议你…""你应该…"等说教语气
   - 避免过度正向或负面标签化
   - 不提及"测评工具局限性"或"需专业咨询"等免责内容
   - 不要生硬地分点列举，要有流畅的叙述

**生成指南：**
- 你可以根据tokens限制自行调节每个章节的详细程度
- 但无论如何，所有6个章节都必须完整出现
- 最后一章必须有完整的结束语，不能突然中断
- 如果tokens不够，可以适当精简前面章节，但必须保证6个章节都完整

请直接开始生成报告正文，确保所有章节完整，不要在中途停止。`;

      // 调用 DeepSeek API
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 120 秒超时，给足够时间生成8000-10000字详细报告

      try {
        const apiResponse = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          },
          body: JSON.stringify({
            model: this.MODEL,
            messages: [
              {
                role: 'system',
                content: '你是一位专业的依恋理论心理咨询师，擅长生成深入、温暖且具有洞察力的心理分析报告。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.75,
            max_tokens: 7500,  // 调整为7500，确保6000-8000字报告完整生成
            top_p: 0.95
          }) as any,
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error('DeepSeek API error:', apiResponse.status, errorText);
          return {
            success: false,
            error: 'AI 服务暂时不可用，请稍后重试'
          };
        }

        const result: any = await apiResponse.json();
        const reportText = result.choices?.[0]?.message?.content;

        if (!reportText) {
          console.error('DeepSeek API returned no content:', result);
          return {
            success: false,
            error: '生成报告失败，请重试'
          };
        }

        // 保存到数据库（如果提供了 accessCodeId）
        if (data.accessCodeId) {
          try {
            // 计算总分（四种依恋类型分数之和）
            const totalScore = (data.scores.secure || 0) + (data.scores.anxious || 0) +
                              (data.scores.avoidant || 0) + (data.scores.fearful || 0);

            await prisma.assessment.create({
              data: {
                accessCodeId: data.accessCodeId,
                productType: 'ASA',
                totalScore: totalScore,
                category: data.primaryType, // 使用依恋类型作为category
                attachmentStyle: data.primaryType,
                dimensions: JSON.stringify({
                  scores: data.scores
                }),
                answers: JSON.stringify({}), // 根据需要存储
                aiAnalysis: reportText,
                ipAddress: data.ipAddress,
                userAgent: 'ASA Web Client'
              }
            });
          } catch (dbError) {
            console.error('Failed to save assessment to database:', dbError);
            // 不影响报告返回，只记录错误
          }
        }

        console.log('[ASA Report Generated]', {
          type: data.primaryType,
          length: reportText.length,
          accessCodeId: data.accessCodeId,
          ip: data.ipAddress
        });

        return {
          success: true,
          report: reportText
        };
      } catch (fetchError: any) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            error: '生成报告超时，请重试'
          };
        }
        throw fetchError;
      }

    } catch (error: any) {
      console.error('DeepSeek Service error:', error);
      return {
        success: false,
        error: error.name === 'TimeoutError'
          ? '生成报告超时，请重试'
          : '服务器繁忙，请稍后重试'
      };
    }
  }
}
