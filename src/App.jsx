import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Mic, MicOff, Trophy, X, SkipForward, Play, 
  RotateCcw, Volume2, Settings, Info, CheckCircle2,
  Sparkles, Zap, BrainCircuit, Heart, User, Mail,
  Clock, Award, Brain
} from 'lucide-react';
import useSpeechToText from './hooks/useSpeechToText';
import useTextToSpeech from './hooks/useTextToSpeech';
import { CHARADES_WORDS } from './data/words';
import ThemeToggle from './components/ThemeToggle';

const App = () => {
  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  // Game State
  const [gameState, setGameState] = useState('onboarding'); // onboarding, ready, playing, results
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [timeLeft, setTimeLeft] = useState(90);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [transcript, setTranscript] = useState('');
  const [lastAiGuess, setLastAiGuess] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Theme effect
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
    speak(`Ready ${userName || 'Player'}? Describe your first word now!`);
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
      }, 800);
    }
  };

  const currentWord = CHARADES_WORDS[currentWordIndex].word;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className="app-bg" />
      
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <div className="confetti-container flex items-center justify-center">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  y: [0, -400, 800], 
                  x: [0, (Math.random() - 0.5) * 1000],
                  rotate: [0, 720],
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ backgroundColor: ['#8b5cf6', '#f97316', '#22c55e', '#ef4444'][i % 4] }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* ONBOARDING */}
        {gameState === 'onboarding' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass glass-card flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-surface-secondary rounded-3xl flex items-center justify-center mb-8 border border-glass-border shadow-inner">
               <Gamepad2 className="text-secondary" size={40} />
            </div>
            
            <h1 className="text-5xl mb-3 font-black tracking-tight text-white">Prompt Charades</h1>
            <p className="text-text-muted mb-10 text-lg font-medium">Charades Meets AI: Guess Smarter, Play Faster!</p>
            
            <div className="w-full space-y-6 mb-10">
              <div className="text-left">
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-3 ml-1">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    className="input-premium pl-12"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-3 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="input-premium pl-12"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setGameState('ready')}
              disabled={!userName || !userEmail}
              className="btn-premium w-full flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={20} />
              Let's Play!
            </button>

            <p className="mt-8 text-xs font-bold text-text-muted opacity-60">90 seconds • 100 points per correct answer</p>
          </motion.div>
        )}

        {/* READY / MISSION BRIEFING */}
        {gameState === 'ready' && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass glass-card max-w-2xl px-12"
          >
            <div className="flex justify-center gap-6 mb-10">
               <div className="score-badge text-secondary"><Zap size={20} /> AI Ready</div>
               <div className="score-badge text-primary"><Brain size={20} /> Neural Linked</div>
            </div>
            
            <h2 className="text-4xl mb-8 font-black uppercase tracking-tight text-white flex items-center justify-center gap-4">
              <Trophy className="text-accent" /> Mission Briefing
            </h2>
            
            <div className="space-y-4 mb-12">
              <div className="flex gap-5 items-center bg-surface-secondary p-5 rounded-2xl border border-glass-border text-left">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0"><Mic size={24} /></div>
                <div>
                  <p className="font-bold text-white uppercase text-xs tracking-widest mb-1">Step 01</p>
                  <p className="text-text-muted text-sm">Speak hints for the word. <span className="text-primary font-bold">Don't say the word itself!</span></p>
                </div>
              </div>
              <div className="flex gap-5 items-center bg-surface-secondary p-5 rounded-2xl border border-glass-border text-left">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0"><BrainCircuit size={24} /></div>
                <div>
                  <p className="font-bold text-white uppercase text-xs tracking-widest mb-1">Step 02</p>
                  <p className="text-text-muted text-sm">Our AI Agent listens and shouts guesses in real-time.</p>
                </div>
              </div>
              <div className="flex gap-5 items-center bg-surface-secondary p-5 rounded-2xl border border-glass-border text-left">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0"><CheckCircle2 size={24} /></div>
                <div>
                  <p className="font-bold text-white uppercase text-xs tracking-widest mb-1">Step 03</p>
                  <p className="text-text-muted text-sm">Score 100 points for every correct guess!</p>
                </div>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="btn-premium w-full py-6 text-2xl"
            >
              Initiate Link
            </button>
          </motion.div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            className="w-full max-w-5xl flex flex-col gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* HUD / HEADER */}
            <div className="glass px-10 py-5 flex justify-between items-center bg-surface/80">
              <div className="flex gap-10">
                <div className="flex items-center gap-4 bg-surface-secondary/50 px-6 py-2 rounded-2xl border border-glass-border">
                  <Clock className={timeLeft < 20 ? 'text-danger animate-pulse' : 'text-secondary'} size={24} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Time Left</span>
                    <span className={`text-2xl font-black font-mono transition-colors ${timeLeft < 20 ? 'text-danger' : 'text-white'}`}>
                      {Math.floor(timeLeft / 60)}:{ (timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-surface-secondary/50 px-6 py-2 rounded-2xl border border-glass-border">
                  <Award className="text-accent" size={24} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Points</span>
                    <span className="text-2xl font-black font-mono text-white">{(score.correct * 100).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="flex gap-6 text-xs font-black text-text-muted uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Trophy size={14} className="text-white" /> {score.correct}</span>
                    <span className="flex items-center gap-2"><X size={14} className="text-danger" /> {score.wrong}</span>
                    <span className="flex items-center gap-2"><SkipForward size={14} className="text-accent" /> {score.skipped}</span>
                 </div>
              </div>
            </div>

            {/* Word Card */}
            <div className="glass p-12 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                <motion.div 
                   className="h-full bg-primary shadow-[0_0_15px_var(--primary)]"
                   animate={{ width: isListening ? "100%" : "0%" }}
                   transition={{ duration: 1 }}
                />
              </div>

              <p className="text-text-muted font-black uppercase tracking-[0.4em] text-xs mb-4">Give hints for this word</p>
              
              <motion.h2 
                key={currentWordIndex}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="word-title text-white animate-float"
              >
                {currentWord}
              </motion.h2>

              <p className="text-sm font-bold text-text-muted mb-12 opacity-50">Word {score.correct + score.wrong + score.skipped + 1} of 100+</p>

              {/* AI Interaction Zone */}
              <div className="max-w-xl mx-auto space-y-8">
                <div className="flex flex-col items-center gap-3">
                  {isThinking ? (
                    <div className="flex gap-2 h-6 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ height: [8, 24, 8], opacity: [0.5, 1, 0.5] }} 
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} 
                          className="w-1.5 bg-secondary rounded-full" 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-full ${isListening ? 'bg-primary/20 text-primary' : 'bg-surface-secondary text-text-muted'}`}>
                       <Mic size={24} className={isListening ? "animate-pulse" : ""} />
                    </div>
                  )}
                  <p className="text-lg font-medium text-text-muted italic h-8 transition-all">
                     {transcript ? `"${transcript}"` : "AI is listening for hints..."}
                  </p>
                </div>

                <AnimatePresence>
                  {lastAiGuess && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="p-8 bg-primary/10 border-2 border-primary/30 rounded-[2.5rem] relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-xl pointer-events-none" />
                      <div className="relative flex items-center justify-center gap-4">
                        <Volume2 className="text-primary" size={32} />
                        <span className="font-black text-4xl text-white uppercase italic tracking-tight">"{lastAiGuess}"</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-3 gap-6 h-44">
              <button 
                onClick={() => nextWord('correct')}
                className="glass group hover:bg-success/20 border-b-[12px] border-success transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="p-4 rounded-2xl bg-success/10 group-hover:bg-success group-hover:text-white transition-all">
                  <CheckCircle2 size={32} className="text-success group-hover:text-white" />
                </div>
                <span className="font-black text-xs tracking-widest uppercase text-success">Correct</span>
              </button>
              
              <button 
                onClick={() => nextWord('wrong')}
                className="glass group hover:bg-danger/20 border-b-[12px] border-danger transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="p-4 rounded-2xl bg-danger/10 group-hover:bg-danger group-hover:text-white transition-all">
                  <X size={32} className="text-danger group-hover:text-white" />
                </div>
                <span className="font-black text-xs tracking-widest uppercase text-danger">Wrong</span>
              </button>

              <button 
                onClick={() => nextWord('skipped')}
                className="glass group hover:bg-accent/20 border-b-[12px] border-accent transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="p-4 rounded-2xl bg-accent/10 group-hover:bg-accent group-hover:text-white transition-all">
                  <SkipForward size={32} className="text-accent group-hover:text-white" />
                </div>
                <span className="font-black text-xs tracking-widest uppercase text-accent">Skip</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULTS SCREEN */}
        {gameState === 'results' && (
          <motion.div 
            key="results"
            className="glass glass-card min-w-[600px] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-primary-gradient" />
            
            <div className="mt-4 mb-10">
               <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-accent/20">
                  <Trophy size={48} className="text-accent" />
               </div>
               <h2 className="text-5xl font-black text-white tracking-tighter mb-2">GAME OVER</h2>
               <p className="text-text-muted uppercase font-black tracking-[0.3em] text-xs">Mission Summary</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-12">
              <div className="bg-surface-secondary p-8 rounded-[2rem] border border-glass-border">
                <span className="text-4xl font-black text-primary">{score.correct}</span>
                <p className="text-[10px] text-text-muted font-black uppercase mt-3 tracking-widest">Mastered</p>
              </div>
              <div className="bg-surface-secondary p-8 rounded-[2rem] border border-glass-border">
                <span className="text-4xl font-black text-danger">{score.wrong}</span>
                <p className="text-[10px] text-text-muted font-black uppercase mt-3 tracking-widest">Failed</p>
              </div>
              <div className="bg-surface-secondary p-8 rounded-[2rem] border border-glass-border">
                <span className="text-4xl font-black text-accent">{score.skipped}</span>
                <p className="text-[10px] text-text-muted font-black uppercase mt-3 tracking-widest">Skipped</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
               <div className="bg-primary/10 p-6 rounded-2xl flex justify-between items-center border border-primary/20">
                  <span className="text-text-muted font-bold uppercase text-xs tracking-widest">Final Agent Score</span>
                  <span className="text-3xl font-black text-white font-mono">{(score.correct * 100).toLocaleString()}</span>
               </div>

               <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setGameState('onboarding')}
                    className="flex-1 p-5 rounded-2xl glass hover:bg-surface-secondary text-white font-bold flex items-center justify-center gap-3 transition-all"
                  >
                    <RotateCcw size={20} /> Exit Arena
                  </button>
                  <button 
                    onClick={startGame}
                    className="btn-premium flex-[2] rounded-2xl text-xl"
                  >
                    Re-Deploy Agent
                  </button>
               </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {speechError && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-10 bg-danger/20 backdrop-blur-xl border border-danger/30 text-white px-10 py-5 rounded-3xl text-sm font-bold flex items-center gap-4 shadow-2xl z-50"
        >
          <div className="w-3 h-3 bg-danger rounded-full animate-ping" />
          <span className="uppercase tracking-widest">Neural Link Disturbed: {speechError}</span>
        </motion.div>
      )}
    </div>
  );
};

export default App;
