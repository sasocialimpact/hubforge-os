'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  className?: string
  buttonSize?: 'sm' | 'default'
}

// Web Speech API types (not in standard TypeScript DOM lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  length: number
  isFinal: boolean
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

export function VoiceInput({ onTranscript, className, buttonSize = 'sm' }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTextRef = useRef('')
  const supportedRef = useRef(false)

  // Initialize speech recognition once (no setState in effect)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    supportedRef.current = true
    recognitionRef.current = new SR()
    const rec = recognitionRef.current
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTextRef.current += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      setInterimText(interim)
      if (finalTextRef.current.trim()) {
        onTranscript(finalTextRef.current.trim() + (interim ? ' ' + interim : ''))
      }
    }

    rec.onerror = (event: Event) => {
      console.error('[Voice] error:', event)
      setListening(false)
    }

    rec.onend = () => {
      if (finalTextRef.current.trim()) {
        onTranscript(finalTextRef.current.trim())
      }
      setListening(false)
      setInterimText('')
    }
    return () => { recognitionRef.current?.abort() }
  }, [onTranscript])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      finalTextRef.current = ''
      setInterimText('')
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch (e) {
        console.error('[Voice] start error:', e)
      }
    }
  }, [listening])

  // Check support on first render (ref is set in useEffect, but we need this for SSR safety)
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  })
  if (!isSupported) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {listening && interimText && (
        <span className="text-[11px] text-amber-600 italic max-w-[200px] truncate animate-pulse">
          {interimText}...
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        onClick={toggleListening}
        className={cn(
          'gap-1.5 shrink-0 p-1.5',
          listening && 'bg-red-100 dark:bg-red-950 text-red-600 animate-pulse'
        )}
        title={listening ? 'Stop recording' : 'Voice input'}
      >
        {listening ? (
          <Square className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}
