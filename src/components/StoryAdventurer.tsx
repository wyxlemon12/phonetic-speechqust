import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Wand2, History, User, Box } from 'lucide-react';
import { PracticeCategory, IntelligenceAnalysis } from '../types';

interface Props {
  onStart: (story: string, category: PracticeCategory, heroName: string, assessmentReport?: string) => void;
  onStartTest: () => void;
  isLoading: boolean;
  analysis: IntelligenceAnalysis | null;
}

const CATEGORIES: { id: PracticeCategory; label: string; icon: string }[] = [
  { id: 'RETROFLEX', label: '平翘舌音辨析', icon: '👄' },
  { id: 'NASAL', label: '前后鼻音练习', icon: '👃' },
  { id: 'NL', label: '鼻音与边音', icon: '👅' },
  { id: 'TONES', label: '声调稳定性', icon: '🎵' },
  { id: 'CUSTOM', label: '自定义词库', icon: '📝' },
];

const PRESET_STORIES = [
  '小精灵星宝在星光森林里丢失了自己的魔法竹笛……',
  '在遥远的深海城市里，一只小海豚正在寻找闪亮的宝石……',
  '勇敢的小火车第一次穿过黑夜森林，准备寻找新的朋友……',
];

export default function StoryAdventurer({ onStart, onStartTest, isLoading, analysis }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<PracticeCategory>('RETROFLEX');
  const [customStory, setCustomStory] = useState('');
  const [customWords, setCustomWords] = useState('');
  const [heroName, setHeroName] = useState('');
  const [assessmentReport, setAssessmentReport] = useState('');
  const [childLikes, setChildLikes] = useState('');
  const [childDislikes, setChildDislikes] = useState('');

  const isRequestingStartRef = React.useRef(false);

  const handleStart = () => {
    if (isLoading || isRequestingStartRef.current) return;

    let finalInput =
      selectedCategory === 'CUSTOM'
        ? `自定义练习词：${customWords}\n${customStory}`
        : customStory;

    if (childLikes) {
      finalInput += `\n孩子喜欢的事物：${childLikes}`;
    }
    if (childDislikes) {
      finalInput += `\n孩子不喜欢的事物：${childDislikes}`;
    }

    isRequestingStartRef.current = true;
    onStart(finalInput, selectedCategory, heroName || '小勇士', assessmentReport);
  };

  React.useEffect(() => {
    if (!isLoading) {
      isRequestingStartRef.current = false;
    }
  }, [isLoading]);

  return (
    <div data-testid="story-adventurer" className="max-w-4xl mx-auto px-4 sm:px-10 pb-36 lg:pb-0">
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-12 bg-white rounded-[28px] sm:rounded-[40px] p-5 sm:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.08)]">
        <div className="bg-[#F8F9FF] rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-10 border border-white relative overflow-hidden order-1 lg:order-2">
          <div className="absolute top-0 right-0 p-5 sm:p-8 text-5xl sm:text-6xl opacity-10 rotate-12 pointer-events-none">🪄</div>
          <div className="absolute bottom-0 left-0 p-5 sm:p-8 text-5xl sm:text-6xl opacity-10 -rotate-12 pointer-events-none">🧚</div>

          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-4 sm:mb-6 mx-auto">
              <Wand2 className="w-10 h-10 sm:w-12 sm:h-12 text-secondary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-ink mb-4 sm:mb-6 leading-tight">
              准备好开启你的
              <br />
              传奇故事了吗？
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs sm:text-sm">
                <span className="text-lg">✨</span>
                <span>AI 生成专属故事</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs sm:text-sm">
                <span className="text-lg">👄</span>
                <span>实时纠正发音难点</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs sm:text-sm">
                <span className="text-lg">🎙️</span>
                <span>高清语音魔法助读</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-full space-y-3">
            <button
              onClick={handleStart}
              disabled={isLoading}
              className={`group w-full py-6 rounded-3xl text-xl font-black text-white transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden ${
                isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 active:scale-95 shadow-primary/20'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  <span>星宝正在准备故事...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>开启冒险之旅</span>
                </>
              )}
            </button>

            {!isLoading && (
              <button
                data-testid="quick-start-test-desktop"
                onClick={onStartTest}
                className="w-full py-3 rounded-2xl text-xs font-bold text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-all border border-dashed border-gray-200"
              >
                🧪 使用测试脚本（快速验证）
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6 sm:space-y-10 order-2 lg:order-1">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#B2BEC3] flex items-center gap-2">
              <User className="w-4 h-4" /> 1. 主角姓名
            </h3>
            <input
              type="text"
              placeholder="输入主角名字（例如：小明）"
              maxLength={10}
              className="w-full bg-app-bg border-none rounded-2xl sm:rounded-3xl p-4 sm:p-5 font-extrabold text-sm sm:text-base text-ink placeholder:text-gray-300 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-secondary flex items-center gap-2">
              <History className="w-4 h-4" /> 2. 儿童成长与发音观察（推荐）
            </h3>
            <div className="bg-secondary/5 rounded-3xl p-1 border border-secondary/10">
              <textarea
                placeholder="写下孩子最近的发音表现、容易混淆的音、说话习惯等，星宝会据此生成更贴合的练习。"
                className="w-full h-40 sm:h-56 bg-white border-2 border-transparent rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 text-sm font-medium focus:border-secondary/20 focus:ring-0 outline-none resize-none placeholder:text-gray-300 transition-all"
                value={assessmentReport}
                onChange={(e) => setAssessmentReport(e.target.value)}
              />
            </div>
            <div className="px-2">
              <p className="text-[10px] text-gray-400 leading-relaxed italic">
                填得越具体，AI 生成的练习越能贴近孩子当下的需要。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#B2BEC3] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> 孩子喜欢的
              </h3>
              <input
                type="text"
                placeholder="例如：恐龙、草莓、火车"
                className="w-full bg-app-bg border-none rounded-2xl p-4 text-sm font-bold text-ink placeholder:text-gray-300 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                value={childLikes}
                onChange={(e) => setChildLikes(e.target.value)}
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#B2BEC3] flex items-center gap-2">
                <Box className="w-4 h-4 text-gray-400" /> 孩子不喜欢的
              </h3>
              <input
                type="text"
                placeholder="例如：打雷、黑暗、蜘蛛"
                className="w-full bg-app-bg border-none rounded-2xl p-4 text-sm font-bold text-ink placeholder:text-gray-300 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                value={childDislikes}
                onChange={(e) => setChildDislikes(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-100 space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#B2BEC3] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 3. 额外指定练习方向
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition-all border-2 text-xs sm:text-sm font-bold ${
                      selectedCategory === cat.id
                        ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5'
                        : 'border-transparent bg-app-bg text-[#636E72] hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {selectedCategory === 'CUSTOM' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-1"
                  >
                    <input
                      type="text"
                      placeholder="输入你想重点练的词或主题"
                      className="w-full bg-white border-2 border-primary/20 rounded-2xl p-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={customWords}
                      onChange={(e) => setCustomWords(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#B2BEC3] flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> 4. 探险故事背景（可留空）
              </h3>
              <textarea
                placeholder="例如：森林探险、海底世界、太空站、恐龙乐园……"
                className="w-full h-24 bg-app-bg border-none rounded-3xl p-4 sm:p-5 text-sm font-medium text-ink placeholder:text-gray-300 focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                value={customStory}
                onChange={(e) => setCustomStory(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_STORIES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomStory(s)}
                    className="bg-app-bg text-[#B2BEC3] px-3 py-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-[10px] font-bold"
                  >
                    #{s.slice(0, 10)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {analysis && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-secondary/5 rounded-3xl p-5 sm:p-6 border border-secondary/10 space-y-4"
            >
              <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
                <Wand2 className="w-4 h-4" />
                <span>星宝为你推荐的故事方向</span>
              </div>
              <div className="grid gap-2">
                {analysis.recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomStory(rec)}
                    className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all text-left group"
                  >
                    <div className="w-6 h-6 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary text-[10px] font-black group-hover:bg-secondary group-hover:text-white transition-colors">
                      {i + 1}
                    </div>
                    <span className="text-sm font-bold text-ink/80 group-hover:text-ink transition-colors">{rec}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="lg:hidden fixed left-4 right-4 bottom-[84px] z-30 bg-white/95 backdrop-blur-md rounded-[24px] border border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.12)] p-3 space-y-2">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className={`group w-full py-4 rounded-2xl text-base font-black text-white transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden ${
            isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-primary/20'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span>星宝正在准备故事...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>开启冒险之旅</span>
            </>
          )}
        </button>

        {!isLoading && (
          <button
            data-testid="quick-start-test"
            onClick={onStartTest}
            className="w-full py-3 rounded-2xl text-sm font-bold text-secondary hover:bg-secondary/5 transition-all border border-dashed border-secondary/30 bg-white"
          >
            🧪 使用测试脚本（快速验证）
          </button>
        )}
      </div>
    </div>
  );
}
