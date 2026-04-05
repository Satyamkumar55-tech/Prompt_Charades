import { useState, useCallback, useRef, useEffect } from 'react';

const useSpeechToText = (onTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [error, setError] = useState(null);
  const shouldBeListening = useRef(false);
  
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
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if it should be listening
      if (shouldBeListening.current) {
        const restart = () => {
          if (!shouldBeListening.current) return;
          try {
            recognition.start();
          } catch (err) {
            console.error('Failed to auto-restart recognition:', err);
            setTimeout(restart, 1000);
          }
        };
        setTimeout(restart, 100);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return; // Ignore no-speech error
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, startListening, stopListening, error };
};

export default useSpeechToText;
