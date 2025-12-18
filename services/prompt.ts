
/**
 * 所有的 Prompt 模板
 */

export const SYSTEM_COMMON_INSTRUCTION = `你是一位富有创造力的少儿英语老师。你正在为一个少儿英语学习应用生成 JSON 对象。
请保持句子简单，词汇适合 5-10 岁的儿童。`;

/**
 * 生成后续单词候选项的系统 Prompt
 */
export const CANDIDATES_SYSTEM_PROMPT = `${SYSTEM_COMMON_INSTRUCTION}
务必返回一个包含 "candidates" 数组的有效 JSON 对象，数组中恰好包含 2 个对象。
每个对象必须包含：
- word: 英文单词
- wordCN: 中文意思
- partOfSpeech: 词性 (如 n., v., adj.)
- sentence: 包含 {word} 占位符的英文例句
- sentenceCN: 例句的中文翻译`;

/**
 * 生成后续单词候选项的用户 Prompt 模板
 */
export const getCandidatesUserPrompt = (currentWord: string, historyContext: string, usedWords: string[], constraintPrompt: string) => `
帮助孩子继续一个分支故事。

当前故事路径：
${historyContext}

当前单词：${currentWord}

任务：建议 2 个富有创意的后续单词，衔接故事中的 "${currentWord}"。
要求：
1. 每个单词都要配一个简单、简短的英语句子（最多 10 个单词）。
2. 提供单词和句子的中文翻译。
3. 识别词性。

${constraintPrompt}
不要重复故事中已经使用过的单词：[${usedWords.join(", ")}]。

请以 JSON 对象形式返回，包含一个名为 "candidates" 的数组，其中恰好有 2 个对象。`;

/**
 * 手动编辑单词后重新生成上下文的系统 Prompt
 */
export const REGENERATE_SYSTEM_PROMPT = `${SYSTEM_COMMON_INSTRUCTION}
务必返回一个有效的 JSON 对象，包含：wordCN, partOfSpeech, sentence (必须包含 {word} 占位符), sentenceCN。`;

/**
 * 手动编辑单词后重新生成上下文的用户 Prompt 模板
 */
export const getRegenerateUserPrompt = (prevWord: string, newWord: string) => `
用户手动输入了单词 "${newWord}" 来衔接 "${prevWord}"。
请使用 "${newWord}" 写一个简短、简单的儿童故事句子，使其在 "${prevWord}" 之后逻辑通顺。
并提供中文翻译、词性等信息。`;

