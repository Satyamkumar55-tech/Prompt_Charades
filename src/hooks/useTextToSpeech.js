import { useState, useCallback, useEffect, useRef } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const synthesisRef = useRef(window.speechSynthesis);

  const timeoutRef = useRef(null);
  const utteranceRef = useRef(null);

  const loadVoices = useCallback(() => {
    const availableVoices = synthesisRef.current.getVoices();
    setVoices(availableVoices);
  }, []);

  useEffect(() => {
    if (!synthesisRef.current) return;
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadVoices]);

  const speak = useCallback((text, preferredVoiceName = 'Google US English') => {
    if (!synthesisRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    synthesisRef.current.cancel(); 

    timeoutRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance; 
      
      const voice = voices.find(v => v.name.includes(preferredVoiceName)) || 
                    voices.find(v => v.name.toLowerCase().includes('english') && v.name.includes('US')) ||
                    voices.find(v => v.lang.includes('en-US')) ||
                    voices[0];
                    
      if (voice) utterance.voice = voice;
      
      utterance.pitch = 1.0; 
      utterance.rate = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('SpeechSynthesis Error:', e);
        setIsSpeaking(false);
      };

      synthesisRef.current.speak(utterance);
    }, 50); 
  }, [voices]);

  const cancelSpeech = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, isSpeaking, cancelSpeech, voices };
};

export default useTextToSpeech;
