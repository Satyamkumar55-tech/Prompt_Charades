import { useState, useCallback, useEffect, useRef } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const synthesisRef = useRef(window.speechSynthesis);

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
    };
  }, [loadVoices]);

  const speak = useCallback((text, preferredVoiceName = 'Google US English') => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel(); // Cancel any existing speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select voice - try to find preferred, then any US English, then first available
    const voice = voices.find(v => v.name.includes(preferredVoiceName)) || 
                  voices.find(v => v.name.includes('English') && v.name.includes('US')) ||
                  voices[0];
                  
    if (voice) utterance.voice = voice;
    
    utterance.pitch = 1.0; 
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  }, [voices]);

  const cancelSpeech = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, isSpeaking, cancelSpeech, voices };
};

export default useTextToSpeech;
