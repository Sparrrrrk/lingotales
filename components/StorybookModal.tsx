
import React, { useState, useMemo, useEffect } from 'react';
import { StoryNode } from '../types';
import { X, BookOpen, ArrowRight, CheckCircle, AlertCircle, HelpCircle, Lightbulb, Save, Home, Lock, Sparkles, PartyPopper } from 'lucide-react';
import SpeakerButton from './SpeakerButton';

interface Props {
  story: StoryNode[];
  showChinese: boolean;
  initialUnlocked: boolean;
  onClose: () => void;
  onSave: (coverImage: string, unlocked: boolean) => void; 
  onHome?: () => void;
}

const StorybookModal: React.FC<Props> = ({ story, showChinese, initialUnlocked, onClose, onSave, onHome }) => {
  const [page, setPage] = useState<'story' | 'quiz'>('story');
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Generate text for reading
  const fullText = story.map(s => s.sentence.replace('{word}', s.word)).join(' ');
  
  // Dynamic Image Generation
  const coverImage = useMemo(() => {
    const keywords = story.map(n => n.word).join(" ");
    const prompt = `cute children book illustration cartoon disney style ${keywords}`;
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${story.length}`;
  }, [story]);

  const isCorrect = (id: string, targetWord: string) => {
    return (answers[id] || "").trim().toLowerCase() === targetWord.toLowerCase();
  };

  const score = story.filter(node => isCorrect(node.id, node.word)).length;
  const isPerfect = score === story.length;

  const handleQuizSubmit = () => {
    setShowResults(true);
    if (isPerfect && !isUnlocked) {
      setIsUnlocked(true);
      setJustUnlocked(true);
      // Auto-update parent state if this was an existing saved story
      onSave(coverImage, true);
    }
  };
  
  const handleSave = () => {
    // Only pass the actual image if it's currently unlocked
    onSave(coverImage, isUnlocked);
    setIsSaved(true);
  };

  const renderStorySentence = (node: StoryNode) => {
    const parts = node.sentence.split('{word}');
    const prefix = parts[0] || "";
    const suffix = parts[1] || "";

    return (
      <span key={node.id} className="inline leading-relaxed text-xl md:text-2xl">
         <span>{prefix}</span>
         <span className="inline-block px-2 mx-1 bg-brand-yellow/20 text-brand-purple font-black rounded-lg border-b-2 border-brand-purple/20 cursor-default group relative">
           {node.word}
           {showChinese && node.wordCN && (
             <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
               {node.wordCN}
             </span>
           )}
         </span>
         <span>{suffix}</span>
         {" "}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-purple/30 backdrop-blur-md animate-in fade-in duration-300 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] border-4 border-white/50">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4FC3F7] to-[#BA68C8] p-4 md:p-6 flex justify-between items-center text-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
              {page === 'story' ? <BookOpen size={24} /> : <HelpCircle size={24} />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-sm">
                {page === 'story' ? "Your LingoTale" : "Word Challenge"}
              </h2>
              <p className="text-white/90 text-xs md:text-sm font-semibold">
                {page === 'story' ? "Read your masterpiece" : "Fill in the missing words to unlock art"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onHome && (
              <button onClick={onHome} title="Home" className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition text-white">
                <Home size={24} />
              </button>
            )}
            <button onClick={handleSave} title="Save Story" className={`p-2 rounded-full transition text-white ${isSaved ? 'bg-green-500/40' : 'bg-white/20 hover:bg-white/30'}`}>
              <Save size={24} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-[#F3E5F5]/30 relative">
          
          {/* PAGE 1: STORY VIEW */}
          {page === 'story' && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Image Side */}
              <div className="md:w-1/2 p-6 md:p-8 flex items-center justify-center">
                <div className="relative group perspective-1000 w-full max-w-sm aspect-square">
                   {isUnlocked ? (
                     <div className="relative animate-in zoom-in duration-700">
                        <div className="absolute inset-0 bg-[#BA68C8] rounded-3xl rotate-3 opacity-20 scale-105"></div>
                        <img 
                          src={coverImage}
                          alt="Story illustration" 
                          className="relative rounded-3xl shadow-xl border-4 border-white object-cover w-full h-full bg-gray-100"
                        />
                        <div className="absolute bottom-4 right-4 bg-white/80 text-brand-purple text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm flex items-center gap-1">
                          <Sparkles size={12} /> AI Generated Art
                        </div>
                        {justUnlocked && (
                          <div className="absolute -top-4 -left-4 bg-brand-yellow text-brand-purple p-3 rounded-full shadow-lg animate-bounce z-10 border-2 border-white">
                            <PartyPopper size={24} />
                          </div>
                        )}
                     </div>
                   ) : (
                     <div 
                       onClick={() => setPage('quiz')}
                       className="w-full h-full bg-gray-100 rounded-3xl border-4 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-4 cursor-pointer hover:bg-gray-200 transition-colors group"
                     >
                        <div className="bg-white p-6 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                          <Lock size={48} className="text-gray-300" />
                        </div>
                        <div className="text-center px-6">
                           <p className="font-black text-gray-500 mb-1">Illustration Locked</p>
                           <p className="text-xs font-bold leading-tight">Complete the Quiz to unlock the magic art!</p>
                        </div>
                        <button className="mt-2 bg-brand-blue text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                           Start Quiz <ArrowRight size={14} />
                        </button>
                     </div>
                   )}
                </div>
              </div>

              {/* Text Side */}
              <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
                <div className="prose prose-lg text-gray-600 leading-loose font-medium">
                  {story.map((node) => renderStorySentence(node))}
                </div>
                
                <div className="mt-8 flex flex-col gap-4">
                  <SpeakerButton 
                    word="" 
                    sentence={fullText} 
                    className="bg-brand-orange text-white hover:bg-[#FFA726] shadow-lg shadow-orange-200 px-6 py-3 w-full flex justify-center gap-2 rounded-xl transition-transform active:scale-95" 
                    size={24}
                  />
                  
                  {isSaved && (
                    <div className="flex items-center justify-center gap-2 text-brand-green font-bold bg-green-50 p-2 rounded-xl border border-green-100 animate-in zoom-in">
                      <CheckCircle size={18} /> {isUnlocked ? "Full Story Saved!" : "Draft Saved!"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2: QUIZ VIEW */}
          {page === 'quiz' && (
            <div className="p-6 md:p-12 max-w-3xl mx-auto">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#E1BEE7]/30 space-y-8">
                <div className="text-center">
                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-brand-blue font-bold text-sm mb-4">
                      <Lightbulb size={16} />
                      <span>{isUnlocked ? "You solved it!" : "Fill in the blanks!"}</span>
                   </div>
                   <h3 className="text-2xl font-bold text-gray-800">Complete the Story</h3>
                </div>
                
                <div className="text-xl md:text-2xl leading-[3.5] text-gray-600 font-medium">
                  {story.map((node, i) => {
                    const correct = isCorrect(node.id, node.word);
                    const wrong = showResults && !correct;
                    const parts = node.sentence.split('{word}');
                    
                    return (
                      <span key={node.id} className="inline-block mr-2">
                        <span>{parts[0]}</span>
                        <div className="relative inline-flex flex-col mx-2 align-middle -mt-2">
                          {node.wordCN && !correct && !showResults && !isUnlocked && (
                             <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-full text-center">
                               <span className="text-[10px] font-bold text-brand-purple/90 bg-purple-50 border border-purple-100 rounded-md px-1.5 py-0.5 whitespace-nowrap shadow-sm">
                                 {node.wordCN}
                               </span>
                             </div>
                          )}
                          
                          <div className="relative">
                            <input
                              type="text"
                              disabled={isUnlocked}
                              placeholder="..."
                              className={`
                                w-32 text-center font-bold border-b-2 outline-none rounded-lg px-2 py-1 transition-all
                                ${isUnlocked || (showResults && correct) ? 'border-brand-green text-brand-green bg-green-50' : ''}
                                ${wrong ? 'border-red-400 text-red-500 bg-red-50' : ''}
                                ${!showResults && !isUnlocked ? 'border-brand-blue/30 bg-blue-50/50 text-brand-purple focus:border-brand-purple focus:bg-white focus:ring-4 focus:ring-purple-100 placeholder-gray-300' : ''}
                              `}
                              value={isUnlocked ? node.word : (answers[node.id] || '')}
                              onChange={(e) => {
                                if (showResults) setShowResults(false);
                                setAnswers(prev => ({...prev, [node.id]: e.target.value}))
                              }}
                            />
                          </div>
                        </div>
                        <span>{parts[1]}</span>
                      </span>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center gap-4 border-t pt-8">
                  {!isUnlocked && (
                    <button 
                      onClick={handleQuizSubmit}
                      className="group flex items-center gap-3 bg-[#81C784] hover:bg-[#66BB6A] text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle size={24} />
                      <span>Check My Spelling</span>
                    </button>
                  )}

                  {isUnlocked && !showResults && (
                    <div className="p-4 bg-green-100 text-green-800 rounded-xl flex items-center justify-center gap-3 animate-in zoom-in w-full">
                      <PartyPopper size={24} />
                      <span className="font-bold text-lg">Amazing! Illustration Unlocked!</span>
                    </div>
                  )}

                  {showResults && !isUnlocked && (
                    <div className={`p-4 rounded-xl flex items-center justify-center gap-3 animate-bounce-short w-full ${isPerfect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {isPerfect ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                      <span className="font-bold">
                        {isPerfect ? "Perfect Score! Illustration Unlocked!" : `You got ${score} out of ${story.length}. Check the red ones!`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-5 bg-white border-t border-gray-100 flex justify-between items-center z-20">
          <div className="flex gap-2">
            <button 
              onClick={() => setPage('story')}
              className={`h-2.5 w-8 rounded-full transition-colors ${page === 'story' ? 'bg-[#BA68C8]' : 'bg-gray-200'}`} 
            />
            <button 
              onClick={() => setPage('quiz')}
              className={`h-2.5 w-8 rounded-full transition-colors ${page === 'quiz' ? 'bg-[#BA68C8]' : 'bg-gray-200'}`} 
            />
          </div>

          <div className="flex gap-3">
             {page === 'story' ? (
                <>
                  <button 
                    onClick={() => setPage('quiz')}
                    className="group flex items-center gap-2 bg-[#4FC3F7] hover:bg-[#29B6F6] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105"
                  >
                    <span>{isUnlocked ? "Practice Quiz" : "Unlock with Quiz"}</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                </>
             ) : (
                <>
                  <button 
                    onClick={() => setPage('story')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold transition-all"
                  >
                    Back to Story
                  </button>
                  {isUnlocked && (
                    <button 
                      onClick={() => { setPage('story'); setJustUnlocked(false); }}
                      className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95"
                    >
                      See Illustration <Sparkles size={18} />
                    </button>
                  )}
                </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorybookModal;
