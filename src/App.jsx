import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Trophy, X, SkipForward, Play, 
  RotateCcw, Volume2, Settings, Info, CheckCircle2,
  Sparkles, Zap, BrainCircuit, Heart
} from 'lucide-react';
import useSpeechToText from './hooks/useSpeechToText';
import useTextToSpeech from './hooks/useTextToSpeech';
import { CHARADES_WORDS } from './data/words';

const App = () => {
  // Game State
  const [gameState, setGameState] = useState('onboarding'); // onboarding, ready, playing, results
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [timeLeft, setTimeLeft] = useState(90);
  const [userName, setUserName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [lastAiGuess, setLastAiGuess] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Hooks
  const { speak, isSpeaking, cancelSpeech } = useTextToSpeech();
  
  const handleTranscript = useCallback((text) => {
    setTranscript(text);
    if (text.length > 3 && !isSpeaking) {
       processHint(text);
    }
  }, [isSpeaking, currentWordIndex]);

  const { isListening, startListening, stopListening, error: speechError } = useSpeechToText(handleTranscript);

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setGameState('results');
      stopListening();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setCurrentWordIndex(Math.floor(Math.random() * CHARADES_WORDS.length));
    setScore({ correct: 0, wrong: 0, skipped: 0 });
    setTimeLeft(90);
    setGameState('playing');
    startListening();
    speak(`Ready ${userName}? Describe your first word now!`);
  };

  const nextWord = (type) => {
    if (type === 'correct') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setScore(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setTranscript('');
    setLastAiGuess('');
    setCurrentWordIndex(Math.floor(Math.random() * CHARADES_WORDS.length));
  };

  const processHint = (text) => {
    const currentWordData = CHARADES_WORDS[currentWordIndex];
    const userText = text.toLowerCase();
    
    // Check if user says any keyword associated with the word
    const match = currentWordData.keywords.find(keyword => 
      userText.includes(keyword.toLowerCase())
    );

    if (match && !isThinking) {
      setIsThinking(true);
      setTimeout(() => {
        const guess = `Is it a ${currentWordData.word}?`;
        setLastAiGuess(guess);
        speak(guess);
        setIsThinking(false);
      }, 800); // Simulate thinking
    }
  };

  const currentWord = CHARADES_WORDS[currentWordIndex].word;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="confetti-container flex items-center justify-center"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  y: [0, -200, 400], 
                  x: [0, (Math.random() - 0.5) * 600],
                  rotate: [0, 360],
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute w-4 h-4 rounded-sm"
                style={{ backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#f43f5e'][i % 4] }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* ONBOARDING */}
        {gameState === 'onboarding' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="glass p-10 w-full max-w-lg text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-glow">
              <BrainCircuit className="text-primary" size={40} />
            </div>
            <h1 className="text-5xl mb-2 gradient-text">Infinite Charades</h1>
            <p className="text-text-muted mb-8 tracking-wide font-mono uppercase text-sm">Powered by Offline Brain</p>
            
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  className="w-full bg-surface p-5 rounded-2xl border border-glass-border text-text text-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setGameState('ready')}
                disabled={!userName}
                className="btn-primary w-full text-xl py-5 shadow-2xl disabled:opacity-30 disabled:translate-y-0"
              >
                Enter Arena
              </button>
            </div>
          </motion.div>
        )}

        {/* READY */}
        {gameState === 'ready' && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass p-12 w-full max-w-3xl text-center"
          >
            <div className="flex justify-center gap-4 mb-8">
               <span className="p-3 bg-secondary/20 rounded-2xl text-secondary"><Zap size={30} /></span>
               <span className="p-3 bg-primary/20 rounded-2xl text-primary"><Sparkles size={30} /></span>
               <span className="p-3 bg-accent/20 rounded-2xl text-accent"><Heart size={30} /></span>
            </div>
            <h2 className="text-4xl mb-6 font-black uppercase tracking-tighter">Mission Briefing</h2>
            <div className="text-left space-y-6 mb-10 text-lg">
              <div className="flex gap-4 items-center bg-surface p-4 rounded-2xl border border-glass-border">
                <div className="bg-primary p-3 rounded-xl text-white font-bold">01</div>
                <p className="text-text-muted">Speak hints for the visible word. <span className="text-primary font-bold">Don't say it!</span></p>
              </div>
              <div className="flex gap-4 items-center bg-surface p-4 rounded-2xl border border-glass-border">
                <div className="bg-secondary p-3 rounded-xl text-white font-bold">02</div>
                <p className="text-text-muted">The AI Agent will listen and shout guesses.</p>
              </div>
              <div className="flex gap-4 items-center bg-surface p-4 rounded-2xl border border-glass-border">
                <div className="bg-accent p-3 rounded-xl text-white font-bold">03</div>
                <p className="text-text-muted">Click <span className="text-primary font-bold">CORRECT</span> to score 100 points.</p>
              </div>
            </div>
            <button 
              onClick={startGame}
              className="px-12 py-5 bg-white text-background rounded-3xl font-black text-2xl hover:bg-primary hover:text-white transition-all transform hover:-rotate-2 active:scale-95 shadow-2xl"
            >
              Start Game
            </button>
          </motion.div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            className="w-full max-w-5xl flex flex-col gap-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* HUD */}
            <div className="flex justify-between items-center glass px-10 py-6 border-b-4 border-primary/20">
              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-[0.2em]">Game Clock</span>
                  <span className={`text-4xl font-black font-mono ${timeLeft < 20 ? 'text-danger animate-pulse' : 'text-text'}`}>
                    0:{timeLeft.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="w-[2px] h-12 bg-glass-border" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-[0.2em]">Total Score</span>
                  <span className="text-4xl font-black font-mono text-primary">{score.correct * 100}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="px-5 py-2 glass rounded-full bg-surface-hover border-primary/30 flex items-center gap-2">
                   <div className="w-2 h-2 bg-primary rounded-full pulse-primary" />
                   <span className="text-xs font-mono font-bold">LIVE FEED</span>
                </div>
              </div>
            </div>

            {/* Word Stage */}
            <div className="relative">
              <motion.div 
                layoutId="word-card"
                className="glass p-16 text-center shadow-2xl relative overflow-hidden group"
              >
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <p className="text-text-muted mb-4 font-mono uppercase tracking-[0.5em] text-xs">Active Word</p>
                <motion.h2 
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-8xl font-black mb-12 select-none tracking-tight float"
                >
                  {currentWord}
                </motion.h2>
                
                {/* AI & Transcript */}
                <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
                  <div className="w-full h-[2px] bg-glass-border relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-primary"
                      animate={{ width: isListening ? "100%" : "0%" }}
                      transition={{ duration: 1 }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {isThinking ? (
                      <div className="flex gap-1">
                        <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-secondary rounded-full" />
                        <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 bg-secondary rounded-full" />
                        <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 bg-secondary rounded-full" />
                      </div>
                    ) : (
                      <Mic className={isListening ? "text-primary" : "text-text-muted"} />
                    )}
                    <p className="text-lg font-medium text-text-muted italic h-8">
                       {transcript ? `"${transcript}"` : "Waiting for hints..."}
                    </p>
                  </div>

                  <AnimatePresence>
                    {lastAiGuess && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="p-6 bg-secondary border border-secondary shadow-2xl shadow-secondary-glow rounded-3xl text-white flex items-center gap-4"
                      >
                        <Volume2 size={24} />
                        <span className="font-black text-2xl uppercase italic">"{lastAiGuess}"</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Battle Buttons */}
            <div className="grid grid-cols-3 gap-8 h-40">
              <button 
                onClick={() => nextWord('wrong')}
                className="glass group hover:bg-danger/20 transition-all flex flex-col items-center justify-center gap-3 border-b-8 border-danger"
              >
                <X size={40} className="text-danger group-hover:scale-125 transition-all" />
                <span className="font-black font-mono text-sm tracking-widest">FAIL</span>
              </button>
              <button 
                onClick={() => nextWord('correct')}
                className="glass group hover:bg-primary/20 transition-all flex flex-col items-center justify-center gap-3 border-b-8 border-primary pulse-primary"
              >
                <CheckCircle2 size={40} className="text-primary group-hover:scale-125 transition-all" />
                <span className="font-black font-mono text-sm tracking-widest">SUCCESS</span>
              </button>
              <button 
                onClick={() => nextWord('skipped')}
                className="glass group hover:bg-accent/20 transition-all flex flex-col items-center justify-center gap-3 border-b-8 border-accent"
              >
                <SkipForward size={40} className="text-accent group-hover:scale-125 transition-all" />
                <span className="font-black font-mono text-sm tracking-widest">NEXT</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {gameState === 'results' && (
          <motion.div 
            key="results"
            className="glass p-16 w-full max-w-3xl text-center relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" 
            />
            
            <Trophy size={80} className="text-primary mx-auto mb-8 drop-shadow-lg" />
            <h2 className="text-6xl font-black mb-4 gradient-text">VICTORY UNLOCKED</h2>
            <p className="text-text-muted mb-12 text-2xl font-mono uppercase tracking-widest">Legendary Score: {score.correct * 100}</p>
            
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-surface p-6 rounded-3xl border border-primary/20">
                <p className="text-primary text-4xl font-black">{score.correct}</p>
                <p className="text-[10px] text-text-muted font-mono uppercase mt-2">Correct Hits</p>
              </div>
              <div className="bg-surface p-6 rounded-3xl border border-danger/20">
                <p className="text-danger text-4xl font-black">{score.wrong}</p>
                <p className="text-[10px] text-text-muted font-mono uppercase mt-2">Misses</p>
              </div>
              <div className="bg-surface p-6 rounded-3xl border border-accent/20">
                <p className="text-accent text-4xl font-black">{score.skipped}</p>
                <p className="text-[10px] text-text-muted font-mono uppercase mt-2">Tactical Skips</p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <button 
                onClick={() => setGameState('onboarding')}
                className="flex-1 p-5 rounded-3xl glass hover:bg-surface-hover font-bold flex items-center justify-center gap-3"
              >
                <RotateCcw size={24} /> Main Portal
              </button>
              <button 
                onClick={startGame}
                className="flex-[2] p-5 bg-primary hover:bg-emerald-600 rounded-3xl font-black text-xl transition-all shadow-2xl"
              >
                REDEPLOY AGENT
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {speechError && (
        <div className="fixed bottom-8 bg-danger/20 backdrop-blur-md border border-danger/50 text-white px-8 py-4 rounded-3xl text-sm font-bold flex items-center gap-3">
          <div className="w-2 h-2 bg-danger rounded-full animate-ping" />
          SYSTEM ERROR: {speechError}
        </div>
      )}
    </div>
  );
};

export default App;
