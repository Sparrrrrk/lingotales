
import { StoryNode, NodeType, VocabularyGraph } from '../types';
import { 
  CANDIDATES_SYSTEM_PROMPT, 
  getCandidatesUserPrompt, 
  REGENERATE_SYSTEM_PROMPT, 
  getRegenerateUserPrompt 
} from './prompt';

// TAL API 配置
// 使用 Vite 代理 /tal-api 转发到 https://ai-service.tal.com
const TAL_API_BASE = '/tal-api/openai-compatible/v1';
const TAL_APP_ID = process.env.TAL_APP_ID || '300000749';
const TAL_APP_KEY = process.env.TAL_APP_KEY || '72931e5b4e992307127325dc3cd6111b';
const TAL_API_KEY = `${TAL_APP_ID}:${TAL_APP_KEY}`;

let CUSTOM_WORD_LIST: string[] | null = null;
let CUSTOM_VOCABULARY: VocabularyGraph | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadVocabulary = (newGraph: VocabularyGraph) => {
  CUSTOM_VOCABULARY = newGraph;
  CUSTOM_WORD_LIST = null; 
};

export const setCustomWordList = (words: string[]) => {
  CUSTOM_WORD_LIST = words.filter(w => w.trim().length > 0);
  CUSTOM_VOCABULARY = null;
};

export const clearCustomWords = () => {
  CUSTOM_WORD_LIST = null;
  CUSTOM_VOCABULARY = null;
};

/**
 * Generate 2 candidate story paths using Gemini 3 Pro.
 */
export const generateCandidates = async (
  currentWord: string, 
  history: StoryNode[]
): Promise<StoryNode[]> => {
  const historyContext = history.map(h => `${h.word}: ${h.sentence}`).join("\n");
  const usedWords = history.map(h => h.word.toLowerCase());

  let constraintPrompt = "";
  if (CUSTOM_WORD_LIST && CUSTOM_WORD_LIST.length > 0) {
    const available = CUSTOM_WORD_LIST.filter(w => !usedWords.includes(w.toLowerCase()));
    constraintPrompt = `CRITICAL: You MUST choose words ONLY from this list: [${available.join(", ")}].`;
  } else if (CUSTOM_VOCABULARY) {
    const keys = Object.keys(CUSTOM_VOCABULARY).filter(k => !usedWords.includes(k.toLowerCase()));
    constraintPrompt = `Prefer using words related to these topics if possible: [${keys.join(", ")}].`;
  }

  try {
    // 使用抽取的中文 Prompt
    const systemPrompt = CANDIDATES_SYSTEM_PROMPT;
    const userPrompt = getCandidatesUserPrompt(currentWord, historyContext, usedWords, constraintPrompt);

    // 调用 TAL API (OpenAI 兼容格式)
    const response = await fetch(`${TAL_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'api-key': TAL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{"candidates":[]}';
    
    // 清理内容：剥离 Markdown 代码块包裹 (```json ... ```)
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    
    // 解析 JSON 响应
    let results;
    try {
      const parsed = JSON.parse(content);
      // 提取 candidates 数组
      if (Array.isArray(parsed)) {
        results = parsed;
      } else if (parsed.candidates && Array.isArray(parsed.candidates)) {
        results = parsed.candidates;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        results = parsed.data;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        results = parsed.items;
      } else {
        // 如果返回的是单个对象，包装成数组
        results = [parsed];
      }
      
      // 确保至少有 2 个结果
      if (results.length < 2) {
        console.warn('API returned fewer than 2 candidates, using fallback');
        throw new Error('Insufficient candidates');
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Content:', content);
      throw new Error('Failed to parse API response as JSON');
    }
    const lastIdNum = Date.now();

    return results.map((opt: any, index: number) => ({
      id: `node-${lastIdNum + index}`,
      word: opt.word,
      wordCN: opt.wordCN,
      partOfSpeech: opt.partOfSpeech,
      sentence: opt.sentence.includes("{word}") ? opt.sentence : opt.sentence.replace(opt.word, "{word}"),
      sentenceCN: opt.sentenceCN,
      type: NodeType.Candidate,
    }));
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback to a simple default if API fails
    return [
      {
        id: `err-1-${Date.now()}`,
        word: "Friend",
        wordCN: "朋友",
        partOfSpeech: "n.",
        sentence: "They met a new {word} on the way.",
        sentenceCN: "他们在路上遇到了一个新朋友。",
        type: NodeType.Candidate,
      },
      {
        id: `err-2-${Date.now()}`,
        word: "Magic",
        wordCN: "魔法",
        partOfSpeech: "adj.",
        sentence: "Suddenly, a {word} light appeared.",
        sentenceCN: "突然，一道魔法光芒出现了。",
        type: NodeType.Candidate,
      }
    ];
  }
};

/**
 * Regenerate context when a user manually edits a word.
 */
export const regenerateCandidateContext = async (
  prevWord: string,
  newWord: string,
  existingNode: StoryNode
): Promise<StoryNode> => {
  try {
    // 使用抽取的中文 Prompt
    const systemPrompt = REGENERATE_SYSTEM_PROMPT;
    const userPrompt = getRegenerateUserPrompt(prevWord, newWord);

    // 调用 TAL API (OpenAI 兼容格式)
    const response = await fetch(`${TAL_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'api-key': TAL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    
    // 清理内容：剥离 Markdown 代码块包裹
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    
    // 解析 JSON 响应
    const opt = JSON.parse(content);

    return {
      ...existingNode,
      word: newWord,
      wordCN: opt.wordCN,
      partOfSpeech: opt.partOfSpeech,
      sentence: opt.sentence.includes("{word}") ? opt.sentence : opt.sentence.replace(newWord, "{word}"),
      sentenceCN: opt.sentenceCN
    };
  } catch (error) {
    console.error("Gemini Regeneration Error:", error);
    return {
      ...existingNode,
      word: newWord,
      sentence: `Then they saw the {word}.`,
      sentenceCN: `然后他们看到了{word}。`
    };
  }
};
