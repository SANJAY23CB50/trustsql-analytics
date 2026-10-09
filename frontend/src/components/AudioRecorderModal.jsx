import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Upload, Play, Check, AlertCircle, FileAudio, Sparkles, RefreshCw } from 'lucide-react';
import VoicePulseVisualizer from './VoicePulseVisualizer';

export default function AudioRecorderModal({
  isOpen,
  onClose,
  onTranscriptReady
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setInterimText('');
      setFinalTranscript('');
      setAudioBlob(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const startRecording = async () => {
    setErrorMsg(null);
    setInterimText('');
    setFinalTranscript('');
    audioChunksRef.current = [];

    // 1. Web Speech Recognition API (real-time streaming speech-to-text)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimText(interim);
        if (final) {
          setFinalTranscript(final.trim());
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition warning:', e.error);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Recognition error', err);
      }
    }

    // 2. MediaRecorder for Audio capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setErrorMsg('Microphone permission denied or not available. You can also upload an audio file below.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const handleApplyTranscript = () => {
    const textToUse = (finalTranscript || interimText).trim();
    if (textToUse) {
      onTranscriptReady(textToUse);
      onClose();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/audio/transcribe', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFinalTranscript(data.transcript);
      } else {
        setErrorMsg(data.detail || 'Failed to transcribe audio file.');
      }
    } catch (err) {
      setErrorMsg(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const currentLiveText = finalTranscript || interimText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Voice Audio to SQL Query
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-center">
          {/* Waveform visualizer & Record Button */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 scale-105 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-105'
              }`}
            >
              {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
            </button>

            <p className="text-xs font-semibold text-slate-300">
              {isRecording ? 'Listening... Click to finish speaking' : 'Click microphone to start speaking'}
            </p>

            {isRecording && <VoicePulseVisualizer isRecording={true} />}
          </div>

          {/* Transcript Display Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left min-h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Speech Transcript</span>
              </span>
              {isRecording && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Streaming</span>
                </span>
              )}
            </div>

            <p className="text-sm text-slate-200 font-medium italic">
              {currentLiveText ? `"${currentLiveText}"` : 'Your spoken words will appear here in real-time...'}
            </p>
          </div>

          {/* Action buttons */}
          {currentLiveText && !isRecording && (
            <button
              onClick={handleApplyTranscript}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Use Transcript & Generate SQL</span>
            </button>
          )}

          {/* File Upload Option */}
          <div className="pt-4 border-t border-slate-800 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Or upload audio voice recording (.wav, .mp3, .webm):</span>
            </div>
            <label className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 border-dashed rounded-xl cursor-pointer text-xs text-slate-300 transition-all">
              <FileAudio className="w-4 h-4 text-indigo-400" />
              <span>{isUploading ? 'Transcribing Audio...' : 'Choose Audio File'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Error notice if any */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
