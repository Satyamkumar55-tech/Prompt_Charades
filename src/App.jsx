import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, Mic, MicOff, Trophy, X, SkipForward, Play,
  RotateCcw, Volume2, Settings, Info, CheckCircle2,
  Sparkles, Zap, BrainCircuit, Heart, User, Mail,
  Clock, Award, Brain, HelpCircle, Home, ChevronRight, Star
} from 'lucide-react';
import useSpeechToText from './hooks/useSpeechToText';
import useTextToSpeech from './hooks/useTextToSpeech';
import { CATEGORIES, CHARADES_WORDS } from './data/words';
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
  // onboarding → category_select → playing → results
  const [gameState, setGameState] = useState('onboarding');
  const [selectedCategory, setSelectedCategory] = useState(null); // id of selected category
  const [activeWordPool, setActiveWordPool] = useState([]);        // words for the selected category
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [usedWords, setUsedWords] = useState([]);
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
  const [aiHasGuessed, setAiHasGuessed] = useState(false); // true only when AI makes a real word guess
  const [userSaidWord, setUserSaidWord] = useState(false); // true when user accidentally says the word
  const thinkingTimeoutRef = useRef(null);

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
      cancelSpeech();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, isVoiceConnected, stopListening, cancelSpeech]);

  const connectVoice = () => {
    setIsVoiceConnected(true);
    startListening();
    speak(`ready to play give me your first hint`);
  };

  const nextWord = useCallback((type) => {
    if (type) setScore(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setTranscript('');
    setLastAiGuess('');
    setAiHasGuessed(false);
    setUserSaidWord(false);
    setIsThinking(false);
    cancelSpeech();
    if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    
    let newUsedWords = [...usedWords, currentWordIndex];
    if (newUsedWords.length >= activeWordPool.length) {
      newUsedWords = [];
    }
    
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * activeWordPool.length);
    } while (newUsedWords.includes(nextIndex) && newUsedWords.length < activeWordPool.length);
    
    setUsedWords(newUsedWords);
    setCurrentWordIndex(nextIndex);
  }, [usedWords, currentWordIndex, activeWordPool, cancelSpeech]);

  const processHint = (text, isFinal) => {
    if (text.toLowerCase().includes("ready to play")) return;
    if (text.toLowerCase().includes("give me")) return;

    const currentWordData = activeWordPool[currentWordIndex];
    if (!currentWordData) return;

    // Don't process if already thinking
    if (isThinking) return;

    const userText = text.toLowerCase();

    // ── Guard: user said the actual word ──────────────────────────────────────
    if (userText.includes(currentWordData.word.toLowerCase())) {
       if (!isSpeaking) {
          cancelSpeech();
          setIsThinking(true);
          setUserSaidWord(true);
          thinkingTimeoutRef.current = setTimeout(() => {
             const guess = `You just said ${currentWordData.word}!`;
             setLastAiGuess(guess);
             speak(`Hey, you aren't allowed to say ${currentWordData.word}! That's the word!`);
             setIsThinking(false);
          }, 500);
       }
       return;
    }

    // ── Tier 1: keyword matches the CURRENT word → correct guess ─────────────
    const correctMatch = currentWordData.keywords.find(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
      return regex.test(userText);
    });

    if (correctMatch) {
      cancelSpeech();
      setIsThinking(true);
      thinkingTimeoutRef.current = setTimeout(() => {
        const guess = `${currentWordData.word}?`;
        setLastAiGuess(guess);
        setAiHasGuessed(true);
        speak(`Is it ${currentWordData.word}?`);
        setIsThinking(false);
      }, 500);
      return;
    }

    // ── Tier 2: keyword matches a DIFFERENT word → plausible wrong guess ──────
    // Collect all OTHER words in the pool that share a keyword with the transcript
    const wrongGuessCandidate = activeWordPool.find((wordData, idx) => {
      if (idx === currentWordIndex) return false; // skip current word
      return wordData.keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
        return regex.test(userText);
      });
    });

    if (wrongGuessCandidate && !isSpeaking) {
      cancelSpeech();
      setIsThinking(true);
      thinkingTimeoutRef.current = setTimeout(() => {
        const guess = `${wrongGuessCandidate.word}?`;
        setLastAiGuess(guess);
        speak(`Is it ${wrongGuessCandidate.word}?`);
        setIsThinking(false);
      }, 500);
      return;
    }

    // ── Tier 3: no match at all → fallback prompt ─────────────────────────────
    if (isFinal && !isSpeaking) {
      setIsThinking(true);
      thinkingTimeoutRef.current = setTimeout(() => {
        const fallbacks = ["Hmm, tell me more.", "Give me another hint!", "I need more clues.", "Keep going!", "Describe it differently!"];
        const fallbackTalk = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setLastAiGuess(fallbackTalk);
        speak(fallbackTalk);
        setIsThinking(false);
      }, 800);
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
      setGameState('category_select'); // Go to category selection after sign up
    } else {
      if (!existingUsers[userEmail]) {
         setAuthError("Email not found. Please Sign Up.");
         return;
      }
      setUserName(existingUsers[userEmail].name);
      setIsAuthenticated(true);
      setGameState('category_select'); // Go to category selection after sign in
    }
  };

  const handleCategorySelect = (categoryId) => {
    const category = CATEGORIES[categoryId];
    setSelectedCategory(categoryId);
    setActiveWordPool(category.words);
    setShowHowToPlay(true); // Show rules after category selection
  };

  const startGame = () => {
    setShowHowToPlay(false);
    setGameState('playing');
    setUsedWords([]);
    setScore({ correct: 0, wrong: 0, skipped: 0 });
    setTimeLeft(90);
    setIsVoiceConnected(false);
    setTranscript('');
    setLastAiGuess('');
    
    const pool = selectedCategory ? CATEGORIES[selectedCategory].words : CHARADES_WORDS;
    const wp = pool;
    setActiveWordPool(wp);

    const startIndex = Math.floor(Math.random() * wp.length);
    setCurrentWordIndex(startIndex);
    setUsedWords([startIndex]);
  };

  const currentCategory = selectedCategory ? CATEGORIES[selectedCategory] : null;
  const currentWord = (activeWordPool[currentWordIndex] || {}).word || "Game Over";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="app-bg" />

      {/* Top Left Control - Help */}
      <div className="absolute top-8 left-8 z-50">
        <button
          onClick={() => setShowHowToPlay(true)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md"
          aria-label="How to Play"
        >
          <HelpCircle size={22} />
        </button>
      </div>

      {/* Top Right Control - Theme */}
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <AnimatePresence mode="wait">

        {/* ONBOARDING / LOGIN */}
        {gameState === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="card-main flex flex-col items-center w-full max-w-[90%] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]"
          >
            <h1 className="title-onboarding">Prompt Charades</h1>
            <p className="tagline-onboarding">Charades Meets AI: Guess Smarter, Play Faster!</p>

            {/* Auth Toggle Links */}
            <div className="auth-toggle">
               <span 
                 className={`auth-toggle-link ${authMode === 'sign_in' ? 'active' : ''}`}
                 onClick={() => { setAuthMode('sign_in'); setAuthError(''); }}
               >
                 SIGN IN
               </span>
               <span 
                 className={`auth-toggle-link ${authMode === 'sign_up' ? 'active' : ''}`}
                 onClick={() => { setAuthMode('sign_up'); setAuthError(''); }}
               >
                 SIGN UP
               </span>
            </div>

            <div className="w-full space-y-5 mb-8">
              {authMode === 'sign_up' && (
                <div className="text-left w-full">
                  <label className="input-label">Your Name</label>
                  <div className="input-container w-full">
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      className="input-field w-full"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="text-left w-full">
                <label className="input-label">Email Address</label>
                <div className="input-container w-full">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="input-field w-full"
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
              className="btn-primary shadow-2xl h-16"
            >
              <Sparkles size={24} className="animate-pulse" />
              {authMode === 'sign_in' ? 'Sign In & Pick Category' : 'Create Account'}
            </button>
          </motion.div>
        )}

        {/* CATEGORY SELECTION */}
        {gameState === 'category_select' && (
          <motion.div
            key="category_select"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="flex flex-col items-center w-full max-w-[90%] sm:max-w-[600px] md:max-w-[750px] lg:max-w-[860px]"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-10"
            >
              <h2 className="cat-heading">Choose a Category</h2>
              <p className="cat-subheading">
                Welcome back, <span className="cat-name-highlight">{userName || 'Player'}</span>! Pick your favourite topic to play.
              </p>
            </motion.div>

            {/* Category Cards */}
            <div className="category-grid">
              {Object.values(CATEGORIES).map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  id={`category-${cat.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.1 }}
                  whileHover={{ scale: 1.04, y: -6 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="category-card"
                  style={{ '--cat-color': cat.color, '--cat-gradient': cat.gradient }}
                >
                  {/* Glow blob */}
                  <div className="cat-glow" style={{ background: cat.color }} />

                  {/* Emoji */}
                  <div className="cat-emoji-wrap">
                    <span className="cat-emoji">{cat.emoji}</span>
                  </div>

                  {/* Label */}
                  <h3 className="cat-label">{cat.label}</h3>
                  <p className="cat-desc">{cat.description}</p>

                  {/* Word count badge */}
                  <div className="cat-badge">
                    <Star size={11} />
                    <span>{cat.words.length} words</span>
                  </div>

                  {/* Arrow */}
                  <div className="cat-arrow">
                    <ChevronRight size={20} />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Sign out link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => { setIsAuthenticated(false); setGameState('onboarding'); }}
              className="cat-back-btn"
            >
              ← Sign out
            </motion.button>
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
            {/* Category Badge in playing screen */}
            {currentCategory && (
              <div
                className="playing-cat-badge"
                style={{ color: currentCategory.color, borderColor: currentCategory.color + '44' }}
              >
                <span>{currentCategory.emoji}</span>
                <span>{currentCategory.label}</span>
              </div>
            )}

            {/* Header / Timer HUD */}
            <div className={`hud-timer shadow-2xl ${timeLeft <= 10 && isVoiceConnected ? 'timer-critical' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold">
                  <Clock size={20} style={{ color: timeLeft <= 10 && isVoiceConnected ? '#ef4444' : 'var(--secondary)' }} />
                  <span className="text-lg">
                    {isVoiceConnected ? "Time Left" : "Connect Voice to Start"}
                  </span>
                </div>
                <motion.div
                  className="font-black font-mono"
                  style={{
                    fontSize: '1.875rem',
                    color: timeLeft <= 10 && isVoiceConnected ? '#ef4444' : 'var(--text-primary)',
                  }}
                  animate={
                    timeLeft <= 10 && isVoiceConnected
                      ? { scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={
                    timeLeft <= 10 && isVoiceConnected
                      ? { repeat: Infinity, duration: 0.8, ease: 'easeInOut' }
                      : {}
                  }
                >
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </motion.div>
              </div>

              <div className="progress-bar-container">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: "100%" }}
                  animate={{
                    width: `${(timeLeft / 90) * 100}%`,
                    backgroundColor: timeLeft <= 10 && isVoiceConnected ? '#ef4444' : undefined,
                  }}
                />
              </div>

              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider text-center">
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
                style={{ color: 'var(--text-primary)' }}
              >
                {currentWord}
              </motion.h2>

              <p className="text-xs font-bold text-[var(--text-muted)] mt-4">Word {usedWords.length} of {activeWordPool.length}</p>

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
                  transcript && <p className="text-[var(--text-muted)] italic text-sm text-center">AI heard: "{transcript}"</p>
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
                      <span className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] italic tracking-tighter truncate">"{lastAiGuess}"</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Score HUD */}
            <div className="flex gap-10 items-center justify-center mb-[-1rem]">
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-black text-sm">
                <Trophy size={20} className="text-secondary" /> {score.correct}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-black text-sm">
                <X size={20} className="text-danger" /> {score.wrong}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-black text-sm">
                <SkipForward size={20} className="text-yellow-500" /> {score.skipped}
              </div>
            </div>

            {/* Action Grid */}
            <div className="action-grid">
              <button
                onClick={() => nextWord('correct')}
                className={`action-btn success ${!aiHasGuessed || userSaidWord ? 'disabled' : ''}`}
                disabled={!aiHasGuessed || userSaidWord}
                title={userSaidWord ? "You can't get points if you say the word!" : (!aiHasGuessed ? 'Wait for the AI to guess correctly!' : '')}
              >
                <CheckCircle2 size={24} />
                Correct
              </button>
              <button 
                onClick={() => nextWord('wrong')} 
                className={`action-btn danger ${userSaidWord ? 'animate-pulse ring-4 ring-danger/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}`}
              >
                <X size={24} />
                Wrong
              </button>
              <button 
                onClick={() => nextWord('skipped')} 
                className={`action-btn warning ${userSaidWord ? 'disabled' : ''}`}
                disabled={userSaidWord}
                title={userSaidWord ? "You must take the penalty for saying the word!" : ""}
              >
                <SkipForward size={24} />
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULTS SCREEN */}
        {gameState === 'results' && (
          <motion.div
            key="results"
            className="card-main w-full max-w-[90%] sm:max-w-[600px] md:max-w-[750px] flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-glass-border shadow-accent/20 shadow-xl shrink-0">
              <Trophy size={40} className="text-accent" />
            </div>

            <h2 className="title-onboarding" style={{ fontSize: '3.5rem' }}>Game Over</h2>
            <p className="tagline-onboarding" style={{ marginBottom: '2.5rem' }}>Mission Summary: Well played, {userName || 'Agent'}!</p>

            {currentCategory && (
              <div className="results-cat-badge" style={{ background: currentCategory.color + '22', borderColor: currentCategory.color + '55', color: currentCategory.color }}>
                {currentCategory.emoji} {currentCategory.label} Category
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 w-full">
              <div className="bg-[var(--surface-secondary)] p-6 rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.05]">
                <span className="text-4xl font-black text-success leading-none">{score.correct}</span>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-2">Correct</p>
              </div>
              <div className="bg-[var(--surface-secondary)] p-6 rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.05]">
                <span className="text-4xl font-black text-danger leading-none">{score.wrong}</span>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-2">Wrong</p>
              </div>
              <div className="bg-[var(--surface-secondary)] p-6 rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.05]">
                <span className="text-4xl font-black text-accent leading-none">{score.skipped}</span>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-2">Skipped</p>
              </div>
            </div>

            <div className="bg-black/10 py-8 px-6 rounded-3xl flex flex-col items-center justify-center border border-glass-border shadow-inner w-full mb-10">
               <span className="text-[10px] text-[var(--text-muted)] font-black tracking-[0.3em] uppercase mb-2">Total Points</span>
               <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent via-secondary to-primary drop-shadow-lg">
                 {((score.correct * 100) - (score.wrong * 50)).toLocaleString()}
               </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={() => {
                  setGameState('category_select');
                  setIsVoiceConnected(false);
                  setSelectedCategory(null);
                  setActiveWordPool([]);
                }}
                className="w-full sm:flex-[1] btn-secondary shadow-xl h-16"
              >
                <Home size={22} />
                Change Category
              </button>
              <button
                onClick={() => {
                  setGameState('playing');
                  setTimeLeft(90);
                  setScore({ correct: 0, wrong: 0, skipped: 0 });
                  setIsVoiceConnected(false);
                  startGame();
                }}
                className="w-full sm:flex-[2] btn-primary shadow-xl h-16"
              >
                <RotateCcw size={22} />
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
            onClick={() => { if (gameState !== 'category_select' || !selectedCategory) return; setShowHowToPlay(false); }}
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
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">How to Play</h3>
                  <p className="text-xs font-bold text-[var(--text-muted)]">Master the rules, win the game!</p>
                </div>
              </div>

              {/* Category info at top of rules */}
              {selectedCategory && CATEGORIES[selectedCategory] && (
                <div
                  className="rules-cat-banner"
                  style={{
                    background: CATEGORIES[selectedCategory].gradient,
                  }}
                >
                  <span className="rules-cat-emoji">{CATEGORIES[selectedCategory].emoji}</span>
                  <div>
                    <div className="rules-cat-name">{CATEGORIES[selectedCategory].label}</div>
                    <div className="rules-cat-count">{CATEGORIES[selectedCategory].words.length} words in this category</div>
                  </div>
                </div>
              )}

              <div className="how-to-step">
                <div className="step-icon" style={{ background: 'rgba(236,72,153,0.2)', color: '#ec4899' }}><Mic size={24} /></div>
                <div>
                  <h4>Connect Voice Agent</h4>
                  <p>First, connect the AI voice agent. The 90-second timer starts when you connect!</p>
                </div>
              </div>
              <div className="how-to-step">
                <div className="step-icon" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}><Clock size={24} /></div>
                <div>
                  <h4>90 Seconds</h4>
                  <p>Once connected, you have 90 seconds to get through as many words as possible.</p>
                </div>
              </div>
              <div className="how-to-step">
                <div className="step-icon" style={{ background: 'rgba(250,204,21,0.2)', color: '#facc15' }}><Play size={24} /></div>
                <div>
                  <h4>Give Hints</h4>
                  <p>Describe the word to the AI without saying it. The AI will try to guess!</p>
                </div>
              </div>
              <div className="how-to-step">
                <div className="step-icon" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}><CheckCircle2 size={24} /></div>
                <div>
                  <h4>Correct (+100 pts)</h4>
                  <p>Tap Correct when the AI guesses right. Each correct answer = 100 points!</p>
                </div>
              </div>
              <div className="how-to-step">
                <div className="step-icon" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}><X size={24} /></div>
                <div>
                  <h4>Wrong (-50 pts)</h4>
                  <p>If you accidentally say the word or the AI gives up, tap Wrong. Watch out, you lose 50 points!</p>
                </div>
              </div>

              <div className="pro-tip">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} style={{ color: '#facc15' }} />
                  <span className="font-black text-xs uppercase tracking-wider" style={{ color: '#facc15' }}>Pro Tip</span>
                </div>
                <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Skip the word if it's too difficult! Stick to <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>simple keywords</span> instead of sentences so the AI can guess faster.
                </p>
              </div>

              <div className="h-10" />

              {/* Start Game Button — shown when category is picked and we're in the rules modal */}
              {selectedCategory && (
                <button
                  onClick={startGame}
                  className="btn-primary w-full shadow-xl"
                >
                  <Sparkles size={20} />
                  Let's Play — {CATEGORIES[selectedCategory]?.emoji} {CATEGORIES[selectedCategory]?.label}!
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

import { Analytics } from "@vercel/analytics/react";

export default App;



