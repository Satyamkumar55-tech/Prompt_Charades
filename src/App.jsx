import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, Mic, MicOff, Trophy, X, SkipForward, Play,
  RotateCcw, Volume2, Settings, Info, CheckCircle2,
  Sparkles, Zap, BrainCircuit, Heart, User, Mail,
  Clock, Award, Brain, HelpCircle
} from 'lucide-react';
import useSpeechToText from './hooks/useSpeechToText';
import useTextToSpeech from './hooks/useTextToSpeech';
import { CHARADES_WORDS } from './data/words';
import ThemeToggle from './components/ThemeToggle';

const App = () => {
  // Theme State
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Game State
  const [gameState, setGameState] = useState('onboarding'); // onboarding, playing, results
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [timeLeft, setTimeLeft] = useState(90);
  
  // Auth State
  const [authMode, setAuthMode] = useState('sign_in'); // 'sign_in' or 'sign_up'
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Voice State
  const [transcript, setTranscript] = useState('');
  const [lastAiGuess, setLastAiGuess] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);

  // Hooks
  const { speak, isSpeaking, cancelSpeech } = useTextToSpeech();

  const handleTranscript = (text, isFinal) => {
    setTranscript(text);
    if (text.trim().length > 2 && isVoiceConnected) {
      processHint(text, isFinal);
    }
  };

  const { isListening, startListening, stopListening, error: speechError } = useSpeechToText(handleTranscript);

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && isVoiceConnected && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('results');
      stopListening();
      setIsVoiceConnected(false);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, isVoiceConnected, stopListening]);

  const connectVoice = () => {
    setIsVoiceConnected(true);
    startListening();
    speak(`ready to play give me your first hint`);
  };

  const nextWord = (type) => {
    setScore(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setTranscript('');
    setLastAiGuess('');
    setCurrentWordIndex(Math.floor(Math.random() * CHARADES_WORDS.length));
  };

  const processHint = (text, isFinal) => {
    // Prevent the mic from capturing the AI's own intro speech
    if (text.toLowerCase().includes("ready to play")) return;

    const currentWordData = CHARADES_WORDS[currentWordIndex];
    if (!currentWordData) return;

    const userText = text.toLowerCase();

    // Check if the word itself is said (against the rules, but AI should acknowledge)
    if (userText.includes(currentWordData.word.toLowerCase())) {
       if (!isThinking && !isSpeaking) {
          setIsThinking(true);
          setTimeout(() => {
             const guess = `You just said ${currentWordData.word}!`;
             setLastAiGuess(guess);
             speak(`Hey, you aren't allowed to say ${currentWordData.word}! That's the word!`);
             setIsThinking(false);
          }, 600);
       }
       return;
    }

    // Advanced match: Only match if the keyword appears as a distinct word, 
    // to prevent 'read' from matching inside 'ready'.
    const match = currentWordData.keywords.find(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
      return regex.test(userText);
    });

    if (match && !isThinking && !isSpeaking) {
      // AI "Thinking" state
      setIsThinking(true);
      setTimeout(() => {
        const guess = `${currentWordData.word}?`;
        setLastAiGuess(guess);
        speak(`Is it a ${currentWordData.word}?`);
        setIsThinking(false);
      }, 600);
    } else if (!match && !isThinking && !isSpeaking && isFinal) {
      // Fallback response ONLY when user finishes speaking (isFinal)
      setIsThinking(true);
      setTimeout(() => {
        const fallbackTalk = "Didn't get that.";
        setLastAiGuess(fallbackTalk);
        speak(fallbackTalk);
        setIsThinking(false);
      }, 600);
    }
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAuth = () => {
    setAuthError('');
    if (authMode === 'sign_up' && !userName.trim()) {
      setAuthError("Name is required to sign up.");
      return;
    }
    if (!userEmail.trim()) {
      setAuthError("Email is required.");
      return;
    }
    if (!isValidEmail(userEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('charadesUsers') || '{}');

    if (authMode === 'sign_up') {
      if (existingUsers[userEmail]) {
         setAuthError("Email already registered. Please Sign In.");
         return;
      }
      existingUsers[userEmail] = { name: userName };
      localStorage.setItem('charadesUsers', JSON.stringify(existingUsers));
      setIsAuthenticated(true);
      setShowHowToPlay(true);
    } else {
      if (!existingUsers[userEmail]) {
         setAuthError("Email not found. Please Sign Up.");
         return;
      }
      setUserName(existingUsers[userEmail].name);
      setIsAuthenticated(true);
      setShowHowToPlay(true);
    }
  };

  const startGame = () => {
    setShowHowToPlay(false);
    setGameState('playing');
    setCurrentWordIndex(Math.floor(Math.random() * CHARADES_WORDS.length));
  };


  const currentWord = CHARADES_WORDS[currentWordIndex]?.word || "Game Over";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="app-bg" />

      {/* Top Left Control - Help */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => setShowHowToPlay(true)}
          className="p-3 bg-[var(--surface-secondary)] rounded-full text-text-muted hover:text-[var(--text)] transition-colors border border-glass-border flex items-center justify-center shadow-lg"
          aria-label="How to Play"
        >
          <HelpCircle size={24} />
        </button>
      </div>

      {/* Top Right Control - Theme */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <AnimatePresence mode="wait">

        {/* ONBOARDING */}
        {gameState === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="card-main flex flex-col items-center w-full max-w-[500px]"
          >
            <div className="w-20 h-20 bg-[var(--surface-secondary)] rounded-[1.5rem] flex items-center justify-center mb-6 border border-glass-border">
              <Gamepad2 className="text-secondary" size={40} />
            </div>

            <h1 className="text-4xl sm:text-5xl mb-2 font-black tracking-tighter text-[var(--text)] text-center">Prompt Charades</h1>
            <p className="text-text-muted mb-8 text-sm sm:text-base font-medium opacity-80 text-center">Charades Meets AI: Guess Smarter, Play Faster!</p>

            {/* Auth Tabs */}
            <div className="flex gap-2 w-full mb-8 bg-black/20 p-1.5 rounded-xl border border-glass-border">
               <button 
                 className={`flex-1 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${authMode === 'sign_in' ? 'bg-[var(--surface-secondary)] shadow-sm text-[var(--text)]' : 'text-text-muted hover:text-[var(--text)]'}`}
                 onClick={() => { setAuthMode('sign_in'); setAuthError(''); }}
               >
                 SIGN IN
               </button>
               <button 
                 className={`flex-1 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${authMode === 'sign_up' ? 'bg-[var(--surface-secondary)] shadow-sm text-[var(--text)]' : 'text-text-muted hover:text-[var(--text)]'}`}
                 onClick={() => { setAuthMode('sign_up'); setAuthError(''); }}
               >
                 SIGN UP
               </button>
            </div>

            <div className="w-full space-y-6 mb-6">
              {authMode === 'sign_up' && (
                <div className="text-left w-full">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 ml-1 text-[var(--text)]">Your Name</label>
                  <div className="input-container w-full">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="input-field input-with-icon w-full"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="text-left w-full">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 ml-1 text-[var(--text)]">Email Address</label>
                <div className="input-container w-full">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="input-field input-with-icon w-full"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="h-6 mb-4 w-full text-center flex items-center justify-center">
              <AnimatePresence>
                {authError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }} 
                    className="text-danger text-sm font-bold"
                  >
                    {authError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleAuth}
              className="btn-primary w-full"
            >
              <Sparkles size={20} />
              {authMode === 'sign_in' ? 'Sign In' : 'Create Account'}
            </button>

          </motion.div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            className="w-full max-w-5xl flex flex-col items-center gap-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header / Timer HUD */}
            <div className="hud-timer shadow-2xl">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-[var(--text)] font-bold">
                  <Clock size={20} className="text-secondary" />
                  <span className="text-lg">
                    {isVoiceConnected ? "Time Left" : "Connect Voice to Start"}
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-[var(--text)]">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="progress-bar-container">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 90) * 100}%` }}
                />
              </div>

              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider text-center">
                Timer starts when you connect the voice agent
              </p>
            </div>

            {/* Word Card */}
            <div className="word-card relative">
              <p className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4">Give hints for this word</p>

              <motion.h2
                key={currentWordIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="word-display text-4xl sm:text-6xl"
              >
                {currentWord}
              </motion.h2>

              <p className="text-xs font-bold text-text-muted mt-4">Word {score.correct + score.wrong + score.skipped + 1} of 108</p>

              {/* Voice Status Overlay */}
              <div className="mt-8 h-10 flex items-center justify-center">
                {isThinking ? (
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 16, 8], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        className="w-1 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  transcript && <p className="text-text-muted italic text-sm text-center">AI heard: "{transcript}"</p>
                )}
              </div>
            </div>

            {/* Connect Button or AI Guess */}
            <div className="w-full max-w-[600px] h-32 flex items-center justify-center">
              {!isVoiceConnected ? (
                <button
                  onClick={connectVoice}
                  className="btn-pink group"
                >
                  <Mic size={24} className="group-hover:scale-110 transition-transform" />
                  Connect Voice Agent to Start
                </button>
              ) : (
                <AnimatePresence>
                  {lastAiGuess && (
                    <motion.div
                      key={lastAiGuess}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-black/10 border border-glass-border rounded-[2rem] px-6 sm:px-10 py-6 flex items-center gap-4 shadow-xl max-w-full"
                    >
                      <Volume2 className="text-primary shrink-0" size={32} />
                      <span className="text-2xl sm:text-4xl font-black text-[var(--text)] italic tracking-tighter truncate">"{lastAiGuess}"</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Score HUD */}
            <div className="flex gap-10 items-center justify-center mb-[-1rem]">
              <div className="flex items-center gap-2 text-text-muted font-black text-sm">
                <Trophy size={20} className="text-secondary" /> {score.correct}
              </div>
              <div className="flex items-center gap-2 text-text-muted font-black text-sm">
                <X size={20} className="text-danger" /> {score.wrong}
              </div>
              <div className="flex items-center gap-2 text-text-muted font-black text-sm">
                <SkipForward size={20} className="text-yellow-500" /> {score.skipped}
              </div>
            </div>

            {/* Action Grid */}
            <div className="action-grid">
              <button onClick={() => nextWord('correct')} className="action-btn success">
                <CheckCircle2 size={24} sm:size={32} />
                Correct
              </button>
              <button onClick={() => nextWord('wrong')} className="action-btn danger">
                <X size={24} sm:size={32} />
                Wrong
              </button>
              <button onClick={() => nextWord('skipped')} className="action-btn warning">
                <SkipForward size={24} sm:size={32} />
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULTS SCREEN */}
        {gameState === 'results' && (
          <motion.div
            key="results"
            className="card-main w-full max-w-[550px] flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-accent/20 shrink-0">
              <Trophy size={40} className="text-accent" />
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-[var(--text)] mb-2 text-center">GAME OVER</h2>
            <p className="text-text-muted uppercase font-black tracking-widest text-[10px] sm:text-xs mb-8 text-center bg-black/20 px-4 py-1.5 rounded-full border border-glass-border">Mission Summary</p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 w-full">
              <div className="bg-[var(--surface-secondary)] p-4 sm:p-6 rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-success leading-none">{score.correct}</span>
                <p className="text-[9px] sm:text-[10px] text-text-muted font-black uppercase mt-2 text-center">Correct</p>
              </div>
              <div className="bg-[var(--surface-secondary)] p-4 sm:p-6 rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-danger leading-none">{score.wrong}</span>
                <p className="text-[9px] sm:text-[10px] text-text-muted font-black uppercase mt-2 text-center">Wrong</p>
              </div>
              <div className="bg-[var(--surface-secondary)] p-4 sm:p-6 rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-accent leading-none">{score.skipped}</span>
                <p className="text-[9px] sm:text-[10px] text-text-muted font-black uppercase mt-2 text-center">Skipped</p>
              </div>
            </div>

            <div className="bg-[var(--surface-secondary)] px-6 py-5 rounded-2xl mb-8 flex justify-between items-center border border-glass-border w-full shadow-lg">
              <span className="text-text-muted font-black text-xs sm:text-sm tracking-widest">TOTAL POINTS</span>
              <span className="text-2xl sm:text-4xl font-black text-[var(--text)] leading-none text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                {(score.correct * 100).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => {
                  setGameState('onboarding');
                  setTimeLeft(90);
                  setScore({ correct: 0, wrong: 0, skipped: 0 });
                  setIsVoiceConnected(false);
                  setIsAuthenticated(false);
                }}
                className="flex-[1] py-4 px-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text)] font-bold hover:opacity-80 transition-all border border-glass-border shadow-md"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setGameState('playing');
                  setTimeLeft(90);
                  setScore({ correct: 0, wrong: 0, skipped: 0 });
                  setIsVoiceConnected(false);
                  setCurrentWordIndex(Math.floor(Math.random() * CHARADES_WORDS.length));
                }}
                className="flex-[2] btn-primary shadow-lg"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* HOW TO PLAY MODAL */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowHowToPlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowHowToPlay(false)}>
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--text)]">How to Play</h3>
                  <p className="text-xs font-bold text-text-muted">Master the rules, win the game!</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="how-to-step">
                  <div className="step-icon bg-primary/20 text-primary"><Mic size={24} /></div>
                  <div>
                    <h4 className="text-[var(--text)] font-bold mb-1">Connect Voice Agent</h4>
                    <p className="text-xs text-text-muted leading-relaxed">First, connect the AI voice agent. The 90-second timer starts when you connect!</p>
                  </div>
                </div>
                <div className="how-to-step">
                  <div className="step-icon bg-secondary/20 text-secondary"><Clock size={24} /></div>
                  <div>
                    <h4 className="text-[var(--text)] font-bold mb-1">90 Seconds</h4>
                    <p className="text-xs text-text-muted leading-relaxed">Once connected, you have 90 seconds to get through as many words as possible.</p>
                  </div>
                </div>
                <div className="how-to-step">
                  <div className="step-icon bg-accent/20 text-accent"><Play size={24} /></div>
                  <div>
                    <h4 className="text-[var(--text)] font-bold mb-1">Give Hints</h4>
                    <p className="text-xs text-text-muted leading-relaxed">Describe the word to the AI without saying it. The AI will try to guess!</p>
                  </div>
                </div>
                <div className="how-to-step">
                  <div className="step-icon bg-success/20 text-success"><CheckCircle2 size={24} /></div>
                  <div>
                    <h4 className="text-[var(--text)] font-bold mb-1">Correct (+100 pts)</h4>
                    <p className="text-xs text-text-muted leading-relaxed">Tap Correct when the AI guesses right. Each correct answer = 100 points!</p>
                  </div>
                </div>
                <div className="how-to-step">
                  <div className="step-icon bg-danger/20 text-danger"><X size={24} /></div>
                  <div>
                    <h4 className="text-[var(--text)] font-bold mb-1">Wrong (0 pts)</h4>
                    <p className="text-xs text-text-muted leading-relaxed">If you accidentally say the word or the AI gives up, tap Wrong.</p>
                  </div>
                </div>
              </div>

              {/* Start Game Button Moved here */}
              {gameState === 'onboarding' && isAuthenticated && (
                <button
                  onClick={startGame}
                  className="btn-primary w-full shadow-xl"
                >
                  <Sparkles size={20} />
                  Let's Play!
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR TOAST */}
      {speechError && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-10 bg-danger/20 backdrop-blur-xl border border-danger/30 text-white px-8 py-4 rounded-2xl text-xs font-bold flex items-center gap-4 shadow-2xl z-[200]"
        >
          <div className="w-2 h-2 bg-danger rounded-full animate-ping" />
          <span className="uppercase tracking-widest">Neural Link Error: {speechError}</span>
        </motion.div>
      )}
    </div>
  );
};

export default App;
