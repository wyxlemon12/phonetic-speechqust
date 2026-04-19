/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StoryAdventurer from './components/StoryAdventurer';
import AdventureGame from './components/AdventureGame';
import MistakesLibrary from './components/MistakesLibrary';
import MedalsGallery from './components/MedalsGallery';
import { Book, ScrollText, Medal as MedalIcon } from 'lucide-react';
import { generateAdventure } from './services/geminiService';
import { AdventureStory, PracticeCategory, Mistake, Medal, IntelligenceAnalysis } from './types';
import { TEST_STORY } from './constants/testScript';

type Screen = 'lobby' | 'game' | 'library' | 'medals';

export default function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [story, setStory] = useState<AdventureStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isGeneratingRef = React.useRef(false);

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [analysis, setAnalysis] = useState<IntelligenceAnalysis | null>(null);

  useEffect(() => {
    const savedMistakes = localStorage.getItem('xingbao_mistakes');
    const savedMedals = localStorage.getItem('xingbao_medals');
    const savedAnalysis = localStorage.getItem('xingbao_analysis');

    if (savedMistakes) setMistakes(JSON.parse(savedMistakes));
    if (savedMedals) setMedals(JSON.parse(savedMedals));
    if (savedAnalysis) setAnalysis(JSON.parse(savedAnalysis));
  }, []);

  useEffect(() => {
    localStorage.setItem('xingbao_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem('xingbao_medals', JSON.stringify(medals));
  }, [medals]);

  useEffect(() => {
    if (analysis) {
      localStorage.setItem('xingbao_analysis', JSON.stringify(analysis));
    }
  }, [analysis]);

  const startJourney = async (input: string, category: PracticeCategory, heroName: string, assessmentReport?: string | AdventureStory) => {
    if (isGeneratingRef.current) return;
    setIsLoading(true);
    isGeneratingRef.current = true;
    try {
      if (typeof assessmentReport === 'object' && assessmentReport !== null && 'challenges' in assessmentReport) {
        setStory(assessmentReport as AdventureStory);
        setScreen('game');
        return;
      }
      const generated = await generateAdventure(input, category, heroName, assessmentReport as string);
      setStory(generated);
      setScreen('game');
    } catch (error) {
      console.error('Game start failed:', error);
      alert('生成探险故事失败，请稍后重试。');
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const addMistake = (mistake: Mistake) => {
    setMistakes((prev) => [mistake, ...prev].slice(0, 100));
  };

  const addMedal = (storyTitle: string, category: PracticeCategory) => {
    const newMedal: Medal = {
      id: Math.random().toString(36).substr(2, 9),
      storyTitle,
      category,
      date: new Date().toLocaleDateString()
    };
    setMedals((prev) => [newMedal, ...prev]);
  };

  const resetGame = () => {
    setScreen('lobby');
    setStory(null);
  };

  return (
    <div data-testid="app-root" className="min-h-screen bg-app-bg text-ink font-sans selection:bg-secondary/30">
      <header className="h-[64px] sm:h-[72px] bg-white border-b border-black/5 flex items-center justify-between px-4 sm:px-10 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetGame}>
          <div className="text-xl sm:text-2xl">✨</div>
          <span className="font-extrabold text-base sm:text-2xl text-primary tracking-tight">星宝语音冒险</span>
        </div>
        <div className="hidden sm:flex items-center gap-6" />
      </header>

      <main className={`min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-72px)] transition-colors duration-500 ${screen === 'game' ? 'bg-[#FDFCF0]' : ''}`}>
        <div className="py-6 sm:py-12 pb-40 sm:pb-24">
          <AnimatePresence mode="wait">
            {screen === 'lobby' && (
              <motion.div
                data-testid="lobby-screen"
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8 sm:mb-16 px-4">
                  <h1 className="text-4xl sm:text-6xl font-black mb-3 sm:mb-4 tracking-tighter text-ink leading-none">
                    语音探险：星宝传奇
                  </h1>
                  <p className="text-gray-500 font-serif italic text-sm sm:text-xl">
                    跟随小精灵星宝，在故事里练习更清楚、更稳定的普通话发音。
                  </p>
                </div>
                <StoryAdventurer
                  onStart={startJourney}
                  onStartTest={() => startJourney('', 'RETROFLEX', '小勇士', TEST_STORY)}
                  isLoading={isLoading}
                  analysis={analysis}
                />
              </motion.div>
            )}

            {screen === 'game' && story && (
              <motion.div
                data-testid="game-screen"
                key="game"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                <AdventureGame
                  story={story}
                  onExit={resetGame}
                  onAddMistake={addMistake}
                  onCompleteStory={() => addMedal(story.title, story.category)}
                />
              </motion.div>
            )}

            {screen === 'library' && (
              <div data-testid="library-screen">
                <MistakesLibrary
                  mistakes={mistakes}
                  onClear={() => {
                    setMistakes([]);
                    setAnalysis(null);
                    localStorage.removeItem('xingbao_analysis');
                  }}
                  onBack={resetGame}
                  onAnalysisUpdate={setAnalysis}
                  initialAnalysis={analysis}
                />
              </div>
            )}

            {screen === 'medals' && (
              <div data-testid="medals-screen">
                <MedalsGallery medals={medals} onBack={resetGame} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-3 sm:py-6 bg-white border-t border-black/5 text-center flex justify-center gap-8 sm:gap-16 font-bold text-[10px] text-[#B2BEC3] uppercase tracking-[0.15em] fixed bottom-0 w-full left-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/90">
        <button
          data-testid="nav-story"
          onClick={resetGame}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${screen === 'lobby' || screen === 'game' ? 'text-primary scale-105' : 'hover:text-gray-600'}`}
        >
          <Book className={`w-5 h-5 sm:w-6 sm:h-6 ${screen === 'lobby' || screen === 'game' ? 'text-primary' : 'text-[#B2BEC3]'}`} />
          <span>探险故事</span>
        </button>
        <button
          data-testid="nav-library"
          onClick={() => setScreen('library')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${screen === 'library' ? 'text-secondary scale-105' : 'hover:text-gray-600'}`}
        >
          <ScrollText className={`w-5 h-5 sm:w-6 sm:h-6 ${screen === 'library' ? 'text-secondary' : 'text-[#B2BEC3]'}`} />
          <span>精灵秘籍</span>
        </button>
        <button
          data-testid="nav-medals"
          onClick={() => setScreen('medals')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${screen === 'medals' ? 'text-accent scale-105' : 'hover:text-gray-600'}`}
        >
          <MedalIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${screen === 'medals' ? 'text-accent' : 'text-[#B2BEC3]'}`} />
          <span>成就奖章</span>
        </button>
      </footer>
    </div>
  );
}
