import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

export default function TrustVoiceMicBanner({
  onTranscriptReceived
}) {
  const [isListening, setIsListening] = useState(false);
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'blocked'
  const [interimText, setInterimText] = useState('');
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');

  // Keep ref synced
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    // Auto-stop only after 4.5 seconds of complete silence
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        stopMic();
      }
    }, 4500);
  };

  const startMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicState('blocked');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Continuous mode so it does not disconnect on brief pauses
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      accumulatedTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setMicState('listening');
        resetSilenceTimer();
      };

      recognition.onresult = (event) => {
        resetSilenceTimer();
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (currentFinal) {
          accumulatedTranscriptRef.current += currentFinal;
        }

        const fullText = (accumulatedTranscriptRef.current + currentInterim).trim();
        setInterimText(fullText);

        if (fullText) {
          onTranscriptReceived(fullText);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition status:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setMicState('blocked');
          setIsListening(false);
        } else if (e.error === 'no-speech') {
          // Keep listening even if momentary no-speech
          resetSilenceTimer();
        }
      };

      recognition.onend = () => {
        // If the user didn't explicitly stop and we are still in listening mode, auto-restart
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            if (micState !== 'blocked') setMicState('idle');
          }
        } else {
          setIsListening(false);
          if (micState !== 'blocked') setMicState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setMicState('blocked');
      setIsListening(false);
    }
  };

  const stopMic = () => {
    isListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setMicState('idle');
  };

  const toggleMic = () => {
    if (isListening) {
      stopMic();
    } else {
      startMic();
    }
  };

  // 28 beaded dots
  const dotsCount = 28;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs">
      {/* Left: Circle Teal Mic Button + Text */}
      <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-4">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 ${
            isListening
              ? 'bg-[#007b88] text-white ring-4 ring-teal-200 animate-pulse'
              : micState === 'blocked'
              ? 'bg-[#006677] text-white'
              : 'bg-[#006677] hover:bg-[#005566] text-white active:scale-95'
          }`}
          title={isListening ? 'Click to stop recording' : 'Click to start speaking'}
        >
          {isListening ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <div className="text-xs text-slate-500 leading-relaxed max-w-lg">
          {micState === 'blocked' ? (
            <span>
              Microphone blocked. Allow microphone access for this page, then tap the mic again.
            </span>
          ) : isListening ? (
            <span className="text-teal-700 font-medium">
              🎙️ Listening... (tap mic when done speaking)
            </span>
          ) : (
            <span>
              Tap the microphone to speak your question in natural English.
            </span>
          )}
        </div>
      </div>

      {/* Right: Beaded Audio Waveform Equalizer Dots */}
      <div className="flex items-center space-x-1 shrink-0 overflow-hidden">
        {Array.from({ length: dotsCount }).map((_, i) => {
          const isActive = isListening;
          return (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                isActive
                  ? 'bg-teal-500 scale-125 animate-pulse'
                  : 'bg-[#b6d5db]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
