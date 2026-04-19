/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdventureStory, Mistake } from '../types';
import { speechService } from '../services/speechService';
import { evaluateSpeech, generateSpeech } from '../services/geminiService';
import { Mic, MicOff, Volume2, Star, MessageCircle, ChevronRight, Book, Gauge } from 'lucide-react';
import confetti from 'canvas-confetti';
import { buildPracticeRecord, didPassAttempt } from '../utils/practiceSession';

interface Props {
  story: AdventureStory;
  onExit: () => void;
  onAddMistake: (mistake: Mistake) => void;
  onCompleteStory: () => void;
}

export default function AdventureGame({ story, onExit, onAddMistake, onCompleteStory }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'idle'; message: string; simplifiedMessage?: string; score?: number }>({
    type: 'idle',
    message: '',
  });
  const [isDone, setIsDone] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isHoveringWord, setIsHoveringWord] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const ttsCache = React.useRef<Record<string, string>>({});
  const currentAudioSource = React.useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const activeSpeakerRef = React.useRef<string | null>(null);
  const isRequestingSpeechRef = React.useRef<boolean>(false);
  const prefetchQueue = React.useRef<Set<string>>(new Set());

  const challenge = story.challenges[currentIdx];
  const isE2EMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e');

  useEffect(() => {
    const prefetchNext = async () => {
      const currentWordText = challenge.word;
      const wordKey = `${currentWordText}_${playbackSpeed}`;
      if (!ttsCache.current[wordKey] && !prefetchQueue.current.has(wordKey)) {
        prefetchQueue.current.add(wordKey);
        generateSpeech(currentWordText, playbackSpeed).then((audio) => {
          if (audio) ttsCache.current[wordKey] = audio;
        });
      }

      const nextChallenge = story.challenges[currentIdx + 1];
      if (nextChallenge) {
        const nextText = nextChallenge.storySegment;
        const nextKey = `${nextText}_${playbackSpeed}`;

        if (!ttsCache.current[nextKey] && !prefetchQueue.current.has(nextKey)) {
          prefetchQueue.current.add(nextKey);
          generateSpeech(nextText, playbackSpeed).then((audio) => {
            if (audio) ttsCache.current[nextKey] = audio;
          });
        }
      }
    };

    prefetchNext();
  }, [currentIdx, playbackSpeed, story.challenges, challenge.word]);

  useEffect(() => {
    if (showIntro && story.prologue && !isE2EMode) {
      const timer = setTimeout(() => {
        speak(story.prologue);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isE2EMode, showIntro, story.prologue]);

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  const stopCurrentAudio = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
        currentAudioSource.current.disconnect();
      } catch {
        // ignore
      }
      currentAudioSource.current = null;
    }
  };

  const playReference = () => {
    speak(challenge.word, 'word');
  };

  const speak = async (text: string, type: 'story' | 'word' = 'story', pinyin?: string) => {
    if (!text) return;

    const currentSpeed = playbackSpeed;
    const ttsText = text;

    if (isPlaying === text) {
      stopCurrentAudio();
      setIsPlaying(null);
      return;
    }

    stopCurrentAudio();
    activeSpeakerRef.current = null;

    if (isTTSLoading && isPlaying === text) return;
    if (isRequestingSpeechRef.current) return;

    const dedupeKey = ttsText + currentSpeed;
    activeSpeakerRef.current = dedupeKey;

    setIsPlaying(text);
    setIsTTSLoading(true);
    isRequestingSpeechRef.current = true;

    const safeText = String(ttsText || '');
    const cacheKey = `${safeText}_${currentSpeed}`;

    try {
      let base64Audio = ttsCache.current[cacheKey];

      if (!base64Audio) {
        base64Audio = (await generateSpeech(safeText, currentSpeed, pinyin)) || '';
        if (base64Audio) {
          ttsCache.current[cacheKey] = base64Audio;
        }
      }

      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const binaryString = window.atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        let audioBuffer: AudioBuffer;

        try {
          audioBuffer = await audioContext.decodeAudioData(bytes.buffer.slice(0));
        } catch {
          audioBuffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
          const channelData = audioBuffer.getChannelData(0);
          const dataView = new DataView(bytes.buffer);
          for (let i = 0; i < bytes.length / 2; i++) {
            channelData[i] = dataView.getInt16(i * 2, true) / 32768;
          }
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.05);

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        currentAudioSource.current = source;

        source.onended = () => {
          if (currentAudioSource.current === source) {
            currentAudioSource.current = null;
            setIsPlaying(null);
            activeSpeakerRef.current = null;
          }
        };

        source.start();
        setIsTTSLoading(false);
        return;
      }
    } catch (error) {
      console.error('[TTS] Critical error in speak cycle:', error);
    } finally {
      setIsTTSLoading(false);
      isRequestingSpeechRef.current = false;
    }

    if (!currentAudioSource.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      const clearStates = () => {
        setIsTTSLoading(false);
        activeSpeakerRef.current = null;
      };
      utterance.onstart = () => setIsTTSLoading(false);
      utterance.onerror = clearStates;
      utterance.onend = clearStates;
      utterance.lang = 'zh-CN';
      utterance.rate = currentSpeed;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeechAction = async () => {
    if (isEvaluating) return;

    if (!isListening) {
      try {
        await speechService.startRecording();
        setIsListening(true);
        setFeedback({ type: 'idle', message: '星宝正在认真听，请把目标词清楚读出来。' });
      } catch {
        setFeedback({ type: 'error', message: '星宝暂时听不到你的声音，请检查麦克风权限。' });
      }
    } else {
      setIsListening(false);
      setIsEvaluating(true);
      setFeedback({ type: 'idle', message: '星宝正在分析你的发音……' });

      try {
        const { audioBase64, speechDetected, maxLevel } = await speechService.stopRecording();
        console.info('[Practice Attempt]', {
          targetWord: challenge.word,
          targetPinyin: challenge.pinyin,
          audioBase64Length: audioBase64.length,
          speechDetected,
          maxLevel,
        });

        if (!speechDetected) {
          console.info('[Practice Result]', {
            targetWord: challenge.word,
            targetPinyin: challenge.pinyin,
            audioBase64Length: audioBase64.length,
            speechDetected,
            maxLevel,
            result: {
              isCorrect: false,
              score: 0,
              feedback: '星宝没有听清楚，请再读一次。',
            },
          });
          setIsEvaluating(false);
          setFeedback({ type: 'error', message: '星宝这次没有听清楚，请靠近麦克风再读一次。' });
          return;
        }

        const result = await evaluateSpeech(audioBase64, challenge.word, challenge.pinyin);
        console.info('[Practice Result]', {
          targetWord: challenge.word,
          targetPinyin: challenge.pinyin,
          audioBase64Length: audioBase64.length,
          speechDetected,
          maxLevel,
          result,
        });

        setIsEvaluating(false);

        const passed = didPassAttempt(result);
        onAddMistake(
          buildPracticeRecord({
            challenge,
            feedback: result.feedback,
            score: result.score,
            passed,
          })
        );

        if (passed) {
          setFeedback({
            type: 'success',
            message: result.feedback,
            simplifiedMessage: result.simplifiedFeedback,
            score: result.score,
          });

          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#FF7E33', '#FFD23F', '#4FB5FF'],
          });

          speak(result.feedback);
        } else {
          setFeedback({
            message: result.feedback,
            simplifiedMessage: result.simplifiedFeedback,
            score: result.score,
            type: 'error',
          });
          speak(result.feedback);
        }
      } catch (error) {
        console.error(error);
        setIsEvaluating(false);
        setFeedback({ type: 'error', message: '这次没有听清楚，请再读一次。' });
      }
    }
  };

  const skipLevel = () => {
    if (currentIdx < story.challenges.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setFeedback({ type: 'idle', message: '' });
    } else {
      setIsDone(true);
      onCompleteStory();
    }
  };

  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-5 sm:p-12 bg-white rounded-[28px] sm:rounded-[48px] shadow-2xl border-4 sm:border-8 border-[#FDFCF0] text-center space-y-6 sm:space-y-10"
      >
        <div className="w-24 h-24 sm:w-40 sm:h-40 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <div className="text-5xl sm:text-8xl">🧚</div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div
            className="bg-app-bg p-5 sm:p-10 rounded-[28px] sm:rounded-[40px] text-left border-l-4 sm:border-l-8 border-primary font-medium text-base sm:text-xl leading-relaxed text-gray-700 cursor-pointer hover:bg-primary/5 transition-colors relative group shadow-inner"
            onClick={() => speak(story.prologue)}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <p className="font-serif italic text-lg sm:text-2xl mb-3 sm:mb-4 text-ink/40">探险故事序章</p>
            {story.prologue}
          </div>
        </div>

        <button
          data-testid="intro-continue"
          onClick={() => setShowIntro(false)}
          className="w-full bg-primary text-white py-4 sm:py-6 rounded-2xl text-lg sm:text-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-3"
        >
          <span>我知道了，开始探险！</span>
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </motion.div>
    );
  }

  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto text-center p-6 sm:p-16 bg-white rounded-[28px] sm:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] mt-4 sm:mt-10 border-4 sm:border-8 border-[#FDFCF0] relative overflow-hidden"
      >
        <motion.div className="relative mb-10">
          <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-yellow-300 via-orange-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(251,191,36,0.3)] border-4 sm:border-8 border-white group">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="text-6xl sm:text-9xl filter drop-shadow-xl"
            >
              {story.achievement?.icon || '🏅'}
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-ink text-white px-5 sm:px-8 py-2 sm:py-3 rounded-2xl font-black text-base sm:text-xl whitespace-nowrap shadow-2xl skew-x-[-5deg]"
          >
            {story.achievement?.title || '冒险家奖章'}
          </motion.div>
        </motion.div>

        <h2 className="text-3xl sm:text-5xl font-black mb-5 sm:mb-6 text-ink tracking-tight">探险大成功！</h2>

        <div className="bg-app-bg p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] mb-8 sm:mb-10 text-left relative border border-gray-100 italic">
          <div className="absolute -top-4 -left-4 bg-primary text-white p-2 rounded-xl shadow-lg">
            <MessageCircle className="w-6 h-6" />
          </div>
          <p className="text-base sm:text-xl leading-relaxed text-gray-600 font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => speak(story.ending)}>
            "{story.ending}"
          </p>
          <p className="mt-4 font-bold text-primary">来自星宝的祝贺</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={onExit}
            className="bg-primary text-white w-full py-4 sm:py-6 rounded-3xl text-lg sm:text-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            带着奖章返回故事大厅
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative py-4 sm:py-12 pb-36 sm:pb-12 atmosphere-forest">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm text-primary">
            <Book className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 data-testid="story-title" className="text-lg sm:text-xl font-black text-ink">{story.title}</h2>
            <p className="text-xs font-bold text-[#B2BEC3] uppercase tracking-widest">章节 {currentIdx + 1} / {story.challenges.length}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex bg-white rounded-full shadow-sm p-1 gap-1 self-start sm:self-auto">
            {[0.7, 1.0, 1.3].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                  playbackSpeed === speed ? 'bg-secondary text-white shadow-md' : 'text-[#B2BEC3] hover:bg-gray-50'
                }`}
              >
                <Gauge className="w-3 h-3" />
                <span>{speed === 1.0 ? '正常' : `${speed}x`}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 h-10 items-center bg-white px-4 rounded-full shadow-sm self-start sm:self-auto">
            {story.challenges.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= currentIdx ? 'bg-secondary' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-0 glass rounded-[28px] sm:rounded-[48px] overflow-hidden min-h-[680px]">
        <motion.div
          key={`segment-${currentIdx}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 p-5 sm:p-8 lg:p-16 bg-[#FDFCF0] relative lg:border-r border-[#F0EEDC] flex flex-col rounded-[28px] sm:rounded-[40px] lg:rounded-none"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10 space-y-5 sm:space-y-8 flex-grow">
            <div className="w-16 h-1 bg-primary rounded-full" />

            <div className="space-y-6">
              <div
                className="group cursor-pointer hover:bg-primary/5 p-3 sm:p-4 rounded-[24px] sm:rounded-3xl transition-all relative border border-transparent hover:border-primary/10"
                onClick={() => speak(challenge.storySegment)}
              >
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPlaying === challenge.storySegment && (
                    <div className="flex gap-0.5 items-end h-4 mr-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                          className="w-1 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                  )}
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Volume2 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl lg:text-4xl leading-[1.8] font-medium text-ink/80 font-serif first-letter:text-4xl sm:first-letter:text-5xl lg:first-letter:text-6xl first-letter:font-black first-letter:text-primary first-letter:mr-2 sm:first-letter:mr-3 first-letter:float-left">
                  {challenge.storySegment}
                </p>
              </div>
            </div>

            <div className="mt-6 sm:mt-12 p-4 sm:p-8 bg-white/50 rounded-[24px] sm:rounded-[32px] border-2 border-dashed border-primary/20 flex flex-wrap justify-center items-center gap-3 sm:gap-4 lg:gap-8 shadow-inner min-h-[112px] sm:min-h-[160px]">
              {Array.from(challenge.visualMotif || '')
                .filter((char) => {
                  const code = char.codePointAt(0) || 0;
                  return (
                    (code >= 0x1f300 && code <= 0x1f9ff) ||
                    (code >= 0x2600 && code <= 0x26ff) ||
                    (code >= 0x2700 && code <= 0x27bf) ||
                    (code >= 0x1f000 && code <= 0x1f0ff)
                  );
                })
                .map((char, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                    className="text-4xl sm:text-5xl lg:text-6xl hover:scale-110 transition-transform cursor-default select-none filter drop-shadow-sm"
                  >
                    {char}
                  </motion.div>
                ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          key={`action-${currentIdx}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 p-5 sm:p-8 lg:p-12 flex flex-col items-center justify-start lg:justify-center text-center relative bg-white rounded-[28px] sm:rounded-[40px] lg:rounded-none"
        >
          <div className="mb-6 sm:mb-10 relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-secondary/10 rounded-full flex items-center justify-center relative overflow-hidden group">
              <span className="text-4xl sm:text-5xl group-hover:scale-125 transition-transform duration-500">🧚</span>
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-ink text-white px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold animate-pulse whitespace-nowrap shadow-lg">
              试试看读出这个目标词！
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-12 w-full">
            <div className="text-[10px] sm:text-sm font-black text-[#B2BEC3] tracking-[0.2em] mb-2 sm:mb-4">目标词</div>

            <div className="relative flex justify-center">
              <AnimatePresence>
                {isHoveringWord && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full mb-4 w-56 sm:w-64 bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-2xl border-2 border-primary/10 pointer-events-none z-50 text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <Star className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-black text-primary uppercase tracking-widest">发音提示</span>
                    </div>
                    <div className="space-y-3">
                      <div className="text-lg sm:text-2xl font-serif text-secondary font-black border-b border-secondary/10 pb-2">{challenge.pinyin}</div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">{challenge.hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h3
                data-testid="challenge-word"
                className="text-5xl sm:text-6xl lg:text-8xl font-black text-primary cursor-pointer hover:scale-105 transition-transform active:scale-90 relative"
                onMouseEnter={() => setIsHoveringWord(true)}
                onMouseLeave={() => setIsHoveringWord(false)}
                onClick={playReference}
              >
                {challenge.word}
              </h3>
            </div>

            <div className="flex flex-col items-center gap-3 sm:gap-4">
              {challenge.pinyin && <div className="text-lg sm:text-2xl font-serif text-secondary/60 italic">{challenge.pinyin}</div>}

              <button
                onClick={playReference}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-secondary/10 text-secondary rounded-full font-bold hover:bg-secondary/20 active:scale-95 transition-all text-xs sm:text-sm"
              >
                <Volume2 className="w-4 h-4" />
                <span>听星宝怎么读</span>
              </button>
            </div>
          </div>

          <div className="w-full max-w-[320px] space-y-5 sm:space-y-8 lg:sticky lg:bottom-8">
            <div className="relative">
              {(isListening || isEvaluating) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: isEvaluating ? 1.2 : 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: isEvaluating ? 0.8 : 1.5 }}
                  className={`absolute inset-0 rounded-full ${isEvaluating ? 'bg-secondary/40' : 'bg-primary/20'}`}
                />
              )}
              <button
                onClick={handleSpeechAction}
                disabled={isEvaluating}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mx-auto transition-all shadow-2xl relative z-10 ${
                  isListening
                    ? 'bg-red-500 text-white scale-110 shadow-red-200'
                    : isEvaluating
                      ? 'bg-secondary text-white'
                      : 'bg-primary text-white hover:scale-110 active:scale-90 shadow-primary/30'
                }`}
              >
                {isListening ? <MicOff className="w-10 h-10 sm:w-12 sm:h-12" /> : isEvaluating ? <div className="w-9 h-9 sm:w-10 sm:h-10 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <Mic className="w-10 h-10 sm:w-12 sm:h-12" />}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {feedback.message && (
                <motion.div
                  key={feedback.message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] text-xs sm:text-sm font-bold leading-relaxed shadow-sm cursor-pointer group hover:scale-[1.02] transition-all relative ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : feedback.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-secondary/5 text-secondary'
                  }`}
                  onClick={() => speak(feedback.message, feedback.simplifiedMessage)}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {feedback.type === 'success' ? <Star className="w-4 h-4 fill-current" /> : <MessageCircle className="w-4 h-4" />}
                    <span>{feedback.type === 'success' ? '星宝：你读得真棒！' : '星宝：我们再试一次'}</span>
                  </div>
                  <p>{feedback.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {feedback.type === 'success' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={skipLevel}
                className="w-full bg-secondary text-white py-4 sm:py-6 rounded-3xl text-base sm:text-xl font-black shadow-xl shadow-secondary/20 hover:bg-secondary/90 active:scale-95 flex items-center justify-center gap-3"
              >
                <span>翻到下一页</span>
                <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
              </motion.button>
            )}

            {feedback.type !== 'success' && (
              <button
                onClick={skipLevel}
                disabled={isEvaluating}
                className="text-[#B2BEC3] hover:text-ink text-sm font-bold underline decoration-secondary underline-offset-8 transition-colors disabled:opacity-50"
              >
                跳过这关
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
