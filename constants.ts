import { Dimension, Question } from './types';

export const DIMENSIONS: Dimension[] = [
  { id: 'd1', name: 'Attachment Anxiety', nameCn: '依恋焦虑', description: 'Worry about partner availability and love.' },
  { id: 'd2', name: 'Attachment Avoidance', nameCn: '依恋回避', description: 'Discomfort with intimacy and dependency.' },
  { id: 'd3', name: 'Control', nameCn: '控制欲', description: 'Attempts to monitor or restrict partner.' },
  { id: 'd4', name: 'Jealousy', nameCn: '嫉妒强度', description: 'Negative emotional reaction to perceived threats.' },
  { id: 'd5', name: 'Emotional Dependency', nameCn: '情感依赖', description: 'Over-reliance on partner for self-worth.' },
  { id: 'd6', name: 'Relationship Insecurity', nameCn: '关系不安全感', description: 'General lack of confidence in the relationship future.' },
];

export const QUESTIONS: Question[] = [
  // D1: Anxiety (7 questions)
  { id: 1, text: "我担心对方没有我爱TA那么爱我", dimensionId: 'd1', isReverse: false },
  { id: 2, text: "伴侣没有及时回消息时，我会感到焦虑不安", dimensionId: 'd1', isReverse: false },
  { id: 3, text: "我需要经常得到伴侣的肯定，才能确认我们的关系还好好的", dimensionId: 'd1', isReverse: false },
  { id: 4, text: "我害怕自己会被取代，或者被对方遗忘", dimensionId: 'd1', isReverse: false },
  { id: 5, text: "我总是担心这段关系会突然结束", dimensionId: 'd1', isReverse: false },
  { id: 6, text: "看到伴侣跟别人聊得开心，我就会很不安", dimensionId: 'd1', isReverse: false },
  { id: 7, text: "因为过去的感情经历，我在恋爱中特别容易焦虑", dimensionId: 'd1', isReverse: false },

  // D2: Avoidance (7 questions)
  { id: 8, text: "我不太愿意在感情中分享太多个人的内心想法", dimensionId: 'd2', isReverse: false },
  { id: 9, text: "比起完全依赖伴侣，我更习惯保持独立", dimensionId: 'd2', isReverse: false },
  { id: 10, text: "太过亲密的关系会让我觉得不自在，有压力", dimensionId: 'd2', isReverse: false },
  { id: 11, text: "我倾向于避开讨论结婚、未来规划这类话题", dimensionId: 'd2', isReverse: false },
  { id: 12, text: "向对方完全敞开心扉会让我觉得很没有安全感", dimensionId: 'd2', isReverse: false },
  { id: 13, text: "当两个人的关系越来越亲密时，我反而想要保持点距离", dimensionId: 'd2', isReverse: false },
  { id: 14, text: "我不太喜欢伴侣过分依赖我", dimensionId: 'd2', isReverse: false },

  // D3: Control (6 questions)
  { id: 15, text: "我会翻看伴侣的手机或查看TA的社交媒体", dimensionId: 'd3', isReverse: false },
  { id: 16, text: "我不能接受伴侣跟异性朋友单独见面", dimensionId: 'd3', isReverse: false },
  { id: 17, text: "我要求伴侣随时告诉我TA在哪里、在做什么", dimensionId: 'd3', isReverse: false },
  { id: 18, text: "如果伴侣夸奖别人（特别是异性），我会觉得需要管一管", dimensionId: 'd3', isReverse: false },
  { id: 19, text: "我会限制伴侣的社交活动，以确保TA不会变心", dimensionId: 'd3', isReverse: false },
  { id: 20, text: "我觉得伴侣做重要决定之前应该先征得我的同意", dimensionId: 'd3', isReverse: false },

  // D4: Jealousy (7 questions)
  { id: 21, text: "看到伴侣跟别人互动亲密，我会非常嫉妒", dimensionId: 'd4', isReverse: false },
  { id: 22, text: "我会怀疑伴侣对我是否真的忠诚", dimensionId: 'd4', isReverse: false },
  { id: 23, text: "伴侣只要提起前任，我就会感到不舒服", dimensionId: 'd4', isReverse: false },
  { id: 24, text: "我会忍不住想象伴侣可能出轨的画面", dimensionId: 'd4', isReverse: false },
  { id: 25, text: "我会突然打电话或发消息，确认伴侣在哪里", dimensionId: 'd4', isReverse: false },
  { id: 26, text: "伴侣收到异性的消息时，我会很想看看聊的是什么", dimensionId: 'd4', isReverse: false },
  { id: 27, text: "嫉妒常常让我的情绪起伏很大", dimensionId: 'd4', isReverse: false },

  // D5: Dependency (6 questions)
  { id: 28, text: "没有伴侣，我会觉得生活很空虚", dimensionId: 'd5', isReverse: false },
  { id: 29, text: "我很难自己做决定，总是需要问问伴侣的意见", dimensionId: 'd5', isReverse: false },
  { id: 30, text: "我害怕一个人，所以会死死抓住这段关系不放", dimensionId: 'd5', isReverse: false },
  { id: 31, text: "我开不开心，完全取决于伴侣的心情", dimensionId: 'd5', isReverse: false },
  { id: 32, text: "为了让伴侣高兴，我会委屈自己、牺牲自己的需要", dimensionId: 'd5', isReverse: false },
  { id: 33, text: "只要跟伴侣分开一段时间，我就会特别想念，甚至影响正常生活", dimensionId: 'd5', isReverse: false },

  // D6: Insecurity (7 questions)
  { id: 34, text: "我对这段关系能走多远没什么信心", dimensionId: 'd6', isReverse: false },
  { id: 35, text: "我很容易紧张，总担心一些小事会破坏我们的关系", dimensionId: 'd6', isReverse: false },
  { id: 36, text: "因为过去受过伤，我在恋爱中很难真正信任对方", dimensionId: 'd6', isReverse: false },
  { id: 37, text: "我的情绪经常不稳定，这也影响到了伴侣", dimensionId: 'd6', isReverse: false },
  { id: 38, text: "我觉得自己不够好，配不上被爱", dimensionId: 'd6', isReverse: false },
  { id: 39, text: "一旦关系出现问题，我就会特别慌张、不知所措", dimensionId: 'd6', isReverse: false },
  { id: 40, text: "我不相信伴侣能对我长久保持忠诚", dimensionId: 'd6', isReverse: false },
];

// Valid Codes List
// 您可以将您的30万个兑换码粘贴到数组中。注意：大量数据可能影响加载速度。
// 建议：如果不需要严格的前端验证，只需保留 'LHI12345' 即可。
export const VALID_CODES = [
  'LHI12345', // 万能测试码
  
  // 在此处粘贴您的其他兑换码，例如：
  // 'CODE0001', 
  // 'CODE0002',
];