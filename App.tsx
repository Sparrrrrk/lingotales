
import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, 
  RefreshCw, 
  Sparkles, 
  Home, 
  Languages, 
  Upload, 
  Bot, 
  FileText, 
  CloudUpload, 
  Play, 
  Library, 
  X, 
  ArrowRight 
} from 'lucide-react';
import Bubble from './components/Bubble';
import StorybookModal from './components/StorybookModal';
import { StoryNode, NodeType, SavedStory } from './types';
import { 
  generateCandidates, 
  regenerateCandidateContext, 
  uploadVocabulary, 
  setCustomWordList, 
  clearCustomWords 
} from './services/mockAi';
import { speakWordAndSentence } from './components/SpeakerButton';

const getInitialStory = (startWord?: string): StoryNode[] => [
  { 
    id: `node-${Date.now()}`, 
    word: startWord || 'Robot',
    wordCN: startWord ? "" : '机器人',
    partOfSpeech: 'n.',
    sentence: startWord ? 'Our story begins with a {word}.' : 'Once upon a time, a friendly {word} lived in a lab.',
    sentenceCN: startWord ? '我们的故事从一个{word}开始。' : '从前，一个友好的{word}住在实验室里。',
    type: NodeType.Start 
  }
];

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'start' | 'playing'>('start');
  const [story, setStory] = useState<StoryNode[]>(getInitialStory());
  const [candidates, setCandidates] = useState<StoryNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStorybook, setShowStorybook] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showChinese, setShowChinese] = useState(true);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  
  const [savedStories, setSavedStories] = useState<SavedStory[]>(() => {
    try {
      const saved = localStorage.getItem('lingotales_library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  useEffect(() => {
    localStorage.setItem('lingotales_library', JSON.stringify(savedStories));
  }, [savedStories]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 自动播报逻辑 ---
  useEffect(() => {
    if (appMode === 'playing' && story.length > 0) {
      const lastNode = story[story.length - 1];
      speakWordAndSentence(lastNode.word, lastNode.sentence);
    }
  }, [story.length, appMode]);

  useEffect(() => {
    if (appMode === 'playing') {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [story.length, candidates.length, isGenerating, appMode]);

  const handleExpandNode = async () => {
    if (isGenerating || candidates.length > 0) return;
    setIsGenerating(true);
    const lastNode = story[story.length - 1];
    try {
      const newCandidates = await generateCandidates(lastNode.word, story);
      setCandidates(newCandidates);
    } catch (error) {
      console.error("Failed to generate", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCandidate = (selected: StoryNode) => {
    const newNode = { ...selected, type: NodeType.Selected } as StoryNode;
    setStory(prev => [...prev, newNode]);
    setCandidates([]);
  };

  const handleEditCandidate = async (originalNode: StoryNode, newWord: string) => {
    const prevWord = story[story.length - 1].word;
    const updatedNode = await regenerateCandidateContext(prevWord, newWord, originalNode);
    setCandidates(prev => prev.map(c => c.id === originalNode.id ? updatedNode : c));
  };

  // 核心返回首页逻辑
  const handleGoHome = () => {
    // 如果在游玩中且有进度，提示保存
    const hasProgress = story.length > 1 || candidates.length > 0;
    if (appMode === 'playing' && hasProgress) {
      if(!window.confirm("确定要返回主页吗？当前的故事进度将会丢失。\nReturn to Home? Current story progress will be lost.")) return;
    }
    
    // 重置所有状态回到起点
    clearCustomWords();
    setStory(getInitialStory());
    setCandidates([]);
    setIsGenerating(false);
    setShowStorybook(false);
    setShowLibrary(false);
    setAppMode('start');
    setCurrentStoryId(null);
  };
  
  const handleSaveStory = (coverImage: string, unlocked: boolean) => {
    const storyId = currentStoryId || `story-${Date.now()}`;
    const newSavedStory: SavedStory = {
      id: storyId,
      title: `${story[0].word} & ${story[story.length-1].word}'s Adventure`,
      date: new Date().toLocaleDateString(),
      nodes: [...story],
      coverImage: unlocked ? coverImage : "", 
      unlocked: unlocked
    };

    setSavedStories(prev => {
      const existingIndex = prev.findIndex(s => s.id === storyId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newSavedStory;
        return updated;
      }
      return [newSavedStory, ...prev];
    });
    
    if (!currentStoryId) setCurrentStoryId(storyId);
  };
  
  const handleReadStory = (saved: SavedStory) => {
    setStory(saved.nodes);
    setCandidates([]);
    setCurrentStoryId(saved.id);
    setAppMode('playing');
    setShowStorybook(true);
    setShowLibrary(false);
  };

  const startGame = (startWord?: string) => {
    setStory(getInitialStory(startWord));
    setCandidates([]);
    setAppMode('playing');
    setCurrentStoryId(null);
  };

  const currentSavedStatus = currentStoryId ? savedStories.find(s => s.id === currentStoryId) : null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(content);
          uploadVocabulary(json);
          startGame();
        } catch (err) {
          alert("Invalid JSON format.");
        }
      } else if (file.name.endsWith('.txt')) {
        const words = content.split('\n').map(w => w.trim()).filter(w => w.length > 0);
        if (words.length > 0) {
          setCustomWordList(words);
          startGame(words[0]); 
        } else {
          alert("The TXT file is empty.");
        }
      }
    };
    reader.readAsText(file);
  };

  // 通用 Header
  const CommonHeader = () => (
    <header className="bg-white/70 backdrop-blur-md border-b border-white/50 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={handleGoHome}>
         <div className="bg-gradient-to-tr from-[#4FC3F7] to-[#BA68C8] p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform shadow-sm">
           <Bot size={20} />
         </div>
         <h1 className="text-xl md:text-2xl font-black text-gray-700 tracking-tight group-hover:text-brand-purple transition-colors">LingoTales</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {/* 图书馆按钮在所有模式下都显示 */}
        <button 
          onClick={() => setShowLibrary(true)} 
          className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-500 hover:text-brand-purple hover:bg-purple-50 rounded-full transition border border-gray-100 shadow-sm font-bold text-sm"
        >
          <Library size={18} />
          <span className="hidden sm:inline">Library</span>
        </button>

        {appMode === 'playing' && (
          <>
            <button 
              onClick={() => setShowChinese(!showChinese)} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition font-bold text-sm shadow-sm ${showChinese ? 'bg-white text-brand-purple border-brand-purple/30' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
            >
              <Languages size={16} /><span className="hidden md:inline">{showChinese ? "中/En" : "En"}</span>
            </button>
            <button 
              onClick={handleGoHome} 
              className="p-2 bg-white text-gray-400 hover:text-brand-purple hover:bg-purple-50 rounded-full transition border border-gray-100 shadow-sm"
              title="Return Home"
            >
              <Home size={20} />
            </button>
          </>
        )}
      </div>
    </header>
  );

  const LibraryOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
       <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-brand-purple text-white rounded-xl shadow-sm">
                 <Library size={24} />
               </div>
               <h3 className="text-2xl font-black text-gray-800">My Story Library</h3>
             </div>
             <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <X />
             </button>
          </div>
          <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-6">
             {savedStories.length === 0 ? (
               <div className="col-span-full text-center py-20">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                   <Book size={40} />
                 </div>
                 <p className="text-gray-400 font-bold">No stories saved yet. Go write one!</p>
                 <button onClick={() => {setShowLibrary(false); startGame();}} className="mt-4 text-brand-blue font-bold hover:underline">Start an adventure now</button>
               </div>
             ) : (
               savedStories.map((saved) => (
                 <div 
                   key={saved.id} 
                   onClick={() => handleReadStory(saved)}
                   className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                 >
                    <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-2 relative flex items-center justify-center">
                      {saved.coverImage ? (
                        <img src={saved.coverImage} alt={saved.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300">
                          <Book size={32} />
                          <span className="text-[10px] font-bold uppercase mt-1">Quiz Required</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                         <Play size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-800 text-xs truncate px-1">{saved.title}</h4>
                    <p className="text-[10px] text-gray-400 px-1">{saved.date}</p>
                 </div>
               ))
             )}
          </div>
       </div>
    </div>
  );

  // 主页内容
  if (appMode === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF3E0] via-[#E1F5FE] to-[#F3E5F5] font-sans flex flex-col">
        <CommonHeader />
        
        <div className="flex-1 flex flex-col items-center p-4 md:p-8">
          <div className="mt-8 mb-4 flex flex-col items-center animate-in fade-in slide-in-from-top-8 duration-700">
             <div className="bg-white p-6 rounded-[2rem] shadow-xl mb-6 transform -rotate-6">
               <Bot size={64} className="text-brand-blue" />
             </div>
             <h1 className="text-5xl md:text-7xl font-black text-gray-800 tracking-tight text-center mb-2">
               <span className="text-[#4FC3F7]">Lingo</span>
               <span className="text-[#BA68C8]">Tales</span>
             </h1>
             <p className="text-gray-400 font-bold text-lg mb-8">Connect words, grow your story!</p>
          </div>

          <div className="w-full max-w-4xl bg-gradient-to-r from-[#FFCDD2] via-[#E1BEE7] to-[#B3E5FC] rounded-[3rem] p-8 md:p-14 mb-12 shadow-2xl text-center relative overflow-hidden transform hover:scale-[1.01] transition-all duration-500">
             <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[1px]"></div>
             <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg mb-4">
                 Ready for Adventure?
               </h2>
               <p className="text-white/90 text-lg md:text-xl font-bold max-w-lg mx-auto leading-relaxed">
                 Create infinite magical stories and learn English while having fun!
               </p>
             </div>
             <Sparkles className="absolute top-10 right-10 text-yellow-200 w-12 h-12 animate-pulse" />
             <Sparkles className="absolute bottom-10 left-10 text-pink-200 w-16 h-16 animate-bounce-slow" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl animate-in slide-in-from-bottom-10 duration-700 delay-150 mb-16">
             <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center text-center border-4 border-white hover:border-[#B3E5FC] transition-all group cursor-pointer" onClick={() => startGame()}>
                <div className="bg-blue-50 text-brand-blue px-6 py-2 rounded-full text-sm font-black tracking-widest mb-8 uppercase">Free Play</div>
                <div className="flex gap-6 mb-10">
                  <div className="flex flex-col items-center gap-3">
                     <div className="w-20 h-20 bg-[#FFF3E0] rounded-3xl flex items-center justify-center text-4xl shadow-sm transform group-hover:-translate-y-2 transition-transform">🐻</div>
                     <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Animals</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                     <div className="w-20 h-20 bg-[#FCE4EC] rounded-3xl flex items-center justify-center text-4xl shadow-sm transform -translate-y-4 group-hover:-translate-y-6 transition-transform">🍎</div>
                     <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Foods</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                     <div className="w-20 h-20 bg-[#E8F5E9] rounded-3xl flex items-center justify-center text-4xl shadow-sm transform group-hover:-translate-y-2 transition-transform">🚀</div>
                     <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Space</span>
                  </div>
                </div>
                <div className="mt-auto w-full">
                  <button className="w-full bg-[#4FC3F7] hover:bg-[#29B6F6] text-white text-xl font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                    <Play size={24} fill="currentColor" /> Let's Go!
                  </button>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center text-center border-4 border-white hover:border-[#F48FB1] transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <div className="bg-pink-50 text-pink-400 px-6 py-2 rounded-full text-sm font-black tracking-widest mb-8 uppercase flex items-center gap-2">
                   <Upload size={16} /> Custom World
                </div>
                <div className="w-full flex-1 border-4 border-dashed border-gray-100 rounded-3xl bg-gray-50 flex flex-col items-center justify-center p-8 mb-8 group-hover:bg-pink-50/30 group-hover:border-pink-200 transition-all">
                   <div className="flex gap-4 mb-4">
                      <div className="bg-white p-4 rounded-2xl shadow-sm text-gray-300 group-hover:text-pink-400 transition-colors">
                        <FileText size={40} />
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm text-gray-300 group-hover:text-pink-400 transition-colors">
                        <CloudUpload size={40} />
                      </div>
                   </div>
                   <p className="text-gray-400 text-sm font-black uppercase tracking-tight">Upload JSON or TXT List</p>
                </div>
                <div className="mt-auto w-full">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json,.txt" className="hidden" />
                   <button className="w-full bg-[#F48FB1] hover:bg-[#F06292] text-white text-xl font-black py-4 rounded-2xl shadow-xl shadow-pink-100 transition-all hover:scale-105">
                     Load & Start
                   </button>
                </div>
             </div>
          </div>

          {savedStories.length > 0 && (
             <div className="w-full max-w-4xl animate-in slide-in-from-bottom-12 duration-700 pb-20">
               <div className="flex items-center justify-between mb-8 px-6">
                  <div className="flex items-center gap-3">
                     <div className="bg-brand-purple/10 p-2 rounded-xl text-brand-purple">
                       <Library size={24} />
                     </div>
                     <h3 className="text-3xl font-black text-gray-700">My Library</h3>
                  </div>
                  <button onClick={() => setShowLibrary(true)} className="text-brand-blue font-black text-sm hover:underline flex items-center gap-1">
                    View All Stories <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
                 {savedStories.slice(0, 4).map((saved) => (
                   <div key={saved.id} onClick={() => handleReadStory(saved)} className="bg-white rounded-3xl p-3 shadow-sm hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group border border-gray-100">
                      <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden mb-3 relative flex items-center justify-center">
                        {saved.coverImage ? (
                          <img src={saved.coverImage} alt={saved.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-gray-300">
                            <Book size={40} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                      </div>
                      <h4 className="font-black text-gray-800 text-sm truncate px-1">{saved.title}</h4>
                      <p className="text-[10px] font-bold text-gray-400 px-1 mt-1">{saved.date}</p>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>
        {showLibrary && <LibraryOverlay />}
      </div>
    );
  }

  // 画布模式 (appMode === 'playing')
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E1F5FE] via-[#FFF3E0] to-[#F3E5F5] flex flex-col font-sans">
      <CommonHeader />

      <main className="flex-1 overflow-y-auto relative p-4 pb-40">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-0">
          <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-gradient-to-b from-[#4FC3F7]/20 via-[#BA68C8]/20 to-[#4FC3F7]/20 -translate-x-1/2 z-0 rounded-full" />

          {story.map((node, index) => {
            const isLast = index === story.length - 1;
            return (
              <div key={node.id} className="relative w-full flex justify-center mb-8 animate-in slide-in-from-bottom-8 duration-500">
                 <Bubble 
                   node={node}
                   isActive={isLast}
                   isLocked={!isLast}
                   isCandidate={false}
                   showChinese={showChinese}
                   onExpand={handleExpandNode}
                   isGenerating={isGenerating}
                 />
              </div>
            );
          })}

          <div className="relative w-full flex flex-col items-center min-h-[220px] mt-2">
             {isGenerating && (
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-bounce border border-white z-20">
                  <RefreshCw className="animate-spin text-brand-blue" />
                  <span className="text-gray-500 font-bold tracking-wide">Dreaming up next words...</span>
                </div>
             )}

             {candidates.length > 0 && (
                <div className="flex justify-center gap-12 md:gap-20 w-full relative pt-12">
                  <svg className="absolute -top-6 left-0 w-full h-24 pointer-events-none z-0 overflow-visible">
                      <path d="M 50% 0 L 25% 100" fill="none" stroke="#BA68C8" strokeWidth="3" strokeDasharray="6 4" className="opacity-40" />
                      <path d="M 50% 0 L 75% 100" fill="none" stroke="#4FC3F7" strokeWidth="3" strokeDasharray="6 4" className="opacity-40" />
                  </svg>

                  {candidates.map((cand) => (
                    <div key={cand.id} className="animate-in zoom-in slide-in-from-top-4 duration-500 z-10 w-1/3 flex justify-center">
                      <Bubble 
                        node={cand}
                        isActive={false}
                        isLocked={false}
                        isCandidate={true}
                        showChinese={showChinese}
                        onSelect={handleSelectCandidate}
                        onEditSubmit={handleEditCandidate}
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      {/* 底部进度条和生成按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-white/50 p-4 pb-6 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-[#4FC3F7] to-[#BA68C8] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(186,104,200,0.5)]" style={{ width: `${Math.min(100, story.length * 10)}%` }} />
          </div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider">{story.length} Words</div>
          <button 
            onClick={() => setShowStorybook(true)} 
            disabled={story.length < 3} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all ${story.length < 3 ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-[#BA68C8] to-[#AB47BC] hover:scale-105 active:scale-95 shadow-purple-200'}`}
          >
            <Book size={20} /><span>Generate Storybook</span>
          </button>
        </div>
      </div>

      {showStorybook && (
        <StorybookModal 
          story={story} 
          showChinese={showChinese} 
          initialUnlocked={currentSavedStatus?.unlocked || false}
          onClose={() => setShowStorybook(false)} 
          onSave={handleSaveStory} 
          onHome={handleGoHome} 
        />
      )}
      {showLibrary && <LibraryOverlay />}
    </div>
  );
};

export default App;
