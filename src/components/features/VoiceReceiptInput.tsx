'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

// Type declaration for Web Speech API
type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: () => void;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult;
  length: number;
};

type SpeechRecognitionResult = [{ transcript: string }];

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * VoiceReceiptInput - Voice-to-text receipt capture for hands-free expense entry
 * Uses Web Speech API for speech recognition
 */
export function VoiceReceiptInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-CA';

        recognitionRef.current.onresult = (event) => {
          const result = event.results[event.resultIndex];
          const text = result[0].transcript;
          setTranscript(text);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        setIsSupported(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const detectCategory = useCallback((text: string): string => {
    if (/gas|fuel|uber|lyft|taxi/.test(text)) return 'Vehicle';
    if (/restaurant|cafe|food|meal/.test(text)) return 'Meals & Entertainment';
    if (/hotel|travel|airline/.test(text)) return 'Travel';
    if (/office|supply|paper/.test(text)) return 'Office';
    if (/software|saas|subscription/.test(text)) return 'Professional Services';
    return 'Uncategorized';
  }, []);

  const processVoiceEntry = useCallback(async () => {
    if (!transcript) return;

    // Parse natural language receipt entry
    // Expected format: "Walmart 45.67 groceries" or "Gas station 65.50 vehicle"
    const amountMatch = transcript.match(/\$?([\d]+\.?\d{0,2})/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract vendor name (words before amount)
    const vendorMatch = transcript.match(/^([^0-9]+)/);
    const vendor = vendorMatch ? vendorMatch[1].trim() : '';

    // Simple category detection from keywords
    const category = detectCategory(transcript.toLowerCase());

    // In a real app, this would submit to the receipt API
    console.log('Voice receipt:', { vendor, amount, category, notes: transcript });

    setTranscript('');
    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
  }, [transcript, detectCategory, queryClient]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40" role="region" aria-label="Voice receipt input">
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-2 rounded-xl border border-glass-border bg-card p-4 shadow-lg"
          >
            <p className="text-sm text-text-primary mb-2">{transcript}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={processVoiceEntry}
                disabled={!transcript}
                className="inline-flex items-center gap-1.5 rounded-lg bg-champagne px-3 py-1.5 text-xs font-bold text-obsidian transition hover:bg-champagne-dim disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne/40"
              >
                <Send className="h-3 w-3" aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={isListening ? stopListening : startListening}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition focus:outline-none focus:ring-2 focus:ring-champagne/40 ${
          isListening ? 'bg-danger text-white animate-pulse' : 'bg-champagne text-obsidian'
        }`}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input for receipt'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Mic className="h-6 w-6" aria-hidden="true" />
        )}
      </motion.button>
    </div>
  );
}