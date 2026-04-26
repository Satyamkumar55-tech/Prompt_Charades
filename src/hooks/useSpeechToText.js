 import { useState, useCallback, useRef, useEffect } from 'react';

const useSpeechToText = (onTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [error, setError] = useState(null);
  const shouldBeListening = useRef(false);
  
  // Restart tracking for robustness
  const restartAttemptsRef = useRef(0);
  const restartTimeoutRef = useRef(null);
  const MAX_RESTART_ATTEMPTS = 3;
  
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      restartAttemptsRef.current = 0; // Reset restart counter on successful start
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if it should be listening
      if (shouldBeListening.current) {
        // Clear any pending restart timers
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);

        // Exponential backoff: 200ms, 400ms, 800ms
        const delays = [200, 400, 800];
        const delay = delays[Math.min(restartAttemptsRef.current, delays.length - 1)];

        const restart = () => {
          if (!shouldBeListening.current) return;
          
          try {
            recognition.start();
            restartAttemptsRef.current += 1;
          } catch (err) {
            console.error('Failed to auto-restart recognition:', err);
            
            // On max attempts, reinitialize entire recognition object
            if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) {
              console.warn('Max restart attempts reached, reinitializing recognition');
              restartAttemptsRef.current = 0;
              initRecognition();
            } else {
              restartTimeoutRef.current = setTimeout(restart, delay * 2);
            }
          }
        };
        
        restartTimeoutRef.current = setTimeout(restart, delay);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return; // Ignore no-speech error
      
      // Trigger reinitialization on network or service errors
      if (event.error === 'network-error' || event.error === 'service-unavailable') {
        console.warn('Network/service error detected, will attempt restart on next onend');
        restartAttemptsRef.current = 0; // Reset to allow fresh restart attempts
      }
      
      setError(event.error);
      if (event.error === 'not-allowed') {
        shouldBeListening.current = false;
      }
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Pass both for faster response
      if (onTranscriptRef.current) {
        onTranscriptRef.current(finalTranscript || interimTranscript, !!finalTranscript);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    initRecognition();
    return () => {
      shouldBeListening.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [initRecognition]);

  const startListening = useCallback(() => {
    shouldBeListening.current = true;
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be started or in a weird state, re-init
        initRecognition();
        setTimeout(() => recognitionRef.current?.start(), 100);
      }
    }
  }, [isListening, initRecognition]);

  const stopListening = useCallback(() => {
    shouldBeListening.current = false;
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Force restart the recognition from outside (used by heartbeat monitor)
  const forceRestart = useCallback(() => {
    if (!shouldBeListening.current) return; // Only restart if we're supposed to be listening
    
    console.log('Force restarting speech recognition');
    shouldBeListening.current = true;
    restartAttemptsRef.current = 0;
    
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Wait a moment for clean stop, then restart
      setTimeout(() => {
        if (shouldBeListening.current && recognitionRef.current) {
          recognitionRef.current.start();
        }
      }, 100);
    } catch (err) {
      console.error('Error during force restart:', err);
      // If force restart fails, reinitialize
      initRecognition();
      setTimeout(() => {
        if (shouldBeListening.current && recognitionRef.current) {
          recognitionRef.current.start();
        }
      }, 200);
    }
  }, [initRecognition]);

  // Check if recognition is ready and listening
  const isReady = useCallback(() => {
    return recognitionRef.current && isListening;
  }, [isListening]);

  return { isListening, startListening, stopListening, error, forceRestart, isReady };
};

export default useSpeechToText;
