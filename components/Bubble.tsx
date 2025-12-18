import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, Loader2, Play, MousePointerClick } from 'lucide-react';
import { StoryNode } from '../types';
import SpeakerButton from './SpeakerButton';

interface Props {
  node: StoryNode;
  isActive: boolean;
  isLocked: boolean;
  isCandidate: boolean;
  showChinese: boolean;
  onSelect?: (node: StoryNode) => void;
  onEditSubmit?: (originalNode: StoryNode, newWord: string) => void;
  onExpand?: () => void;
  isGenerating?: boolean;
}

const Bubble: React.FC<Props> = ({ 
  node, 
  isActive, 
  isLocked, 
  isCandidate, 
  showChinese,
  onSelect,
  onEditSubmit,
  onExpand,
  isGenerating = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.word);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const submitEdit = async () => {
    if (!editValue || editValue.length < 2) return;
    if (editValue === node.word) {
      setIsEditing(false);
      return;
    }
    
    setIsRegenerating(true);
    if (onEditSubmit) {
      await onEditSubmit(node, editValue);
    }
    setIsRegenerating(false);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitEdit();
    if (e.key === 'Escape') {
      setEditValue(node.word);
      setIsEditing(false);
    }
  };

  const handleClick = () => {
    if (isCandidate && onSelect && !isEditing) {
      onSelect(node);
    } else if (isActive && onExpand && !isEditing) {
      onExpand();
    }
  };

  const renderSentenceWithHighlight = (sentence: string, word: string) => {
    if (!sentence) return null;
    if (sentence.includes('{word}')) {
      const parts = sentence.split('{word}');
      return (
        <>
          {parts[0]}
          <span className="font-black text-brand-purple px-1 bg-purple-50 rounded mx-0.5 border-b-2 border-brand-purple/20">
            {word}
          </span>
          {parts[1]}
        </>
      );
    } 
    return (
      <>
        {sentence}{" "}
        <span className="font-black text-brand-purple px-1 bg-purple-50 rounded mx-0.5 border-b-2 border-brand-purple/20">
          {word}
        </span>
      </>
    );
  };
  
  const renderSentenceCN = (sentence?: string, wordCN?: string, word?: string) => {
    if (!sentence) return null;
    const displayWord = wordCN || word || "";
    if (sentence.includes('{word}')) {
      const parts = sentence.split('{word}');
      return (
        <>
          {parts[0]}
          <span className="font-bold text-brand-purple">{displayWord}</span>
          {parts[1]}
        </>
      );
    }
    return <>{sentence}{displayWord}</>;
  };

  const pillClasses = "min-w-[180px] px-6 py-4 rounded-3xl bg-white/80 backdrop-blur-md border-2 border-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-gray-700 hover:shadow-[0_8px_25px_rgba(79,195,247,0.2)] transition-all";
  const startClasses = "w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#BA68C8] text-white shadow-[0_8px_32px_rgba(79,195,247,0.4)] border-4 border-white/40 ring-4 ring-white/20";
  const candidateClasses = "min-w-[180px] px-6 py-4 rounded-3xl bg-[#F0FDF4]/90 backdrop-blur-md border-2 border-[#81C784] shadow-lg cursor-pointer hover:scale-105 hover:bg-white transition-all ring-4 ring-[#81C784]/10";

  let containerClass = pillClasses;
  if (node.type === 'start') containerClass = startClasses;
  else if (isCandidate) containerClass = candidateClasses;
  else if (isActive) containerClass = `${pillClasses} ring-4 ring-[#4FC3F7]/50 border-[#4FC3F7] animate-pulse-fast cursor-pointer`; 

  return (
    <div className="flex flex-col items-center z-10 group relative">
      {!isEditing && node.sentence && (
        <div className="mb-4 flex flex-col items-center">
           <div className={`
             max-w-[320px] text-center font-bold text-base md:text-lg leading-snug
             ${isLocked ? 'text-gray-400/80' : 'text-gray-600 drop-shadow-sm'}
           `}>
             <div className="flex items-center justify-center gap-2 flex-wrap">
                <span>{renderSentenceWithHighlight(node.sentence, node.word)}</span>
             </div>
             {showChinese && node.sentenceCN && (
               <div className="text-sm font-medium text-brand-purple/70 mt-1">
                 {renderSentenceCN(node.sentenceCN, node.wordCN, node.word)}
               </div>
             )}
             {!isLocked && (
                <div className="mt-1">
                   <SpeakerButton 
                     word={node.word} 
                     sentence={node.sentence}
                     size={16} 
                     className="bg-white/50 hover:bg-white text-brand-blue shadow-sm" 
                   />
                </div>
             )}
           </div>
        </div>
      )}

      <div 
        onClick={handleClick}
        className={`relative flex flex-col items-center justify-center select-none ${containerClass}`}
      >
        {isActive && !isGenerating && (
           <div className="absolute -top-3 -right-3 bg-white text-brand-blue rounded-full p-1 shadow-md animate-bounce">
              <MousePointerClick size={20} />
           </div>
        )}

        {isRegenerating ? (
          <Loader2 className="animate-spin text-brand-green" size={32} />
        ) : isEditing ? (
          <div className="flex items-center w-full justify-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-24 bg-transparent border-b-2 border-brand-green text-center font-bold text-gray-800 focus:outline-none text-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={(e) => { e.stopPropagation(); submitEdit(); }}
              className="p-1 bg-brand-green text-white rounded-full hover:bg-green-600"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <>
            {node.partOfSpeech && node.type !== 'start' && (
              <div className="absolute -top-3 -right-2 bg-[#FFF9C4] text-[#FBC02D] text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-sm border border-[#FFF176] tracking-wider transform rotate-3">
                {node.partOfSpeech}
              </div>
            )}

            <div className="flex items-center gap-3">
               <div className="flex flex-col items-center">
                 <span className={`font-black tracking-tight ${node.type === 'start' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl text-gray-800'}`}>
                   {node.word}
                 </span>
                 {showChinese && node.wordCN && (
                   <span className={`text-xs font-bold font-sans mt-0.5 ${node.type === 'start' ? 'text-white/90' : 'text-gray-400'}`}>
                     {node.wordCN}
                   </span>
                 )}
               </div>

               {node.type !== 'start' && (
                 <div className="flex gap-1 ml-2 pl-2 border-l border-gray-200">
                    <SpeakerButton 
                      word={node.word} 
                      sentence={node.sentence}
                      size={18} 
                      className="text-brand-blue hover:bg-blue-50" 
                    />
                    {isCandidate && (
                       <button 
                         onClick={handleEditClick}
                         className="p-1.5 rounded-full hover:bg-yellow-50 text-brand-orange transition-colors"
                       >
                         <Edit2 size={16} />
                       </button>
                    )}
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Bubble;