import React from 'react';
import { Volume2 } from 'lucide-react';

interface Props {
  word: string;
  sentence?: string;
  className?: string;
  size?: number;
}

const SpeakerButton: React.FC<Props> = ({ word, sentence, className = "", size = 20 }) => {
  const handleSpeak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    speakWordAndSentence(word, sentence);
  };

  return (
    <button 
      onClick={handleSpeak}
      className={`p-2 rounded-full hover:bg-black/10 transition-colors text-gray-600 ${className}`}
      aria-label="Read text"
    >
      <Volume2 size={size} />
    </button>
  );
};

/**
 * 核心逻辑：先读单词，再读句子（仅英文）
 */
export const speakWordAndSentence = (word: string, sentence?: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // 取消当前正在播放的所有语音
  window.speechSynthesis.cancel();
  
  // 1. 创建单词语音
  const wordUtterance = new SpeechSynthesisUtterance(word);
  wordUtterance.rate = 0.8; // 单词读得稍慢一点，更清楚
  wordUtterance.pitch = 1.1;
  wordUtterance.lang = 'en-US';
  
  // 2. 如果有句子，则在单词结束后播放句子
  if (sentence) {
    wordUtterance.onend = () => {
      // 稍微停顿一下再读句子，听感更自然
      setTimeout(() => {
        const sentenceUtterance = new SpeechSynthesisUtterance(sentence.replace('{word}', word));
        sentenceUtterance.rate = 0.85;
        sentenceUtterance.pitch = 1.0;
        sentenceUtterance.lang = 'en-US';
        window.speechSynthesis.speak(sentenceUtterance);
      }, 300);
    };
  }
  
  window.speechSynthesis.speak(wordUtterance);
};

export default SpeakerButton;