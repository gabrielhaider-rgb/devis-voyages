"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Voix de l'assistant, entièrement dans le navigateur (Web Speech API) :
// dictée (micro → texte) et lecture à voix haute (texte → voix). Gratuit, sans
// service externe côté site ; la dictée n'existe pas sur tous les navigateurs
// (pas sur Firefox) : les boutons ne s'affichent alors pas.

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Ce que sait faire le navigateur : lu côté client seulement (faux au rendu serveur),
// pour que le rendu serveur et le navigateur coïncident.
const noSubscription = () => () => {};
function useBrowserSupports(check: () => boolean) {
  return useSyncExternalStore(noSubscription, check, () => false);
}

const DICTATION_ERRORS: Record<string, string> = {
  "not-allowed": "Le micro est bloqué. Autorisez-le dans votre navigateur pour dicter votre message.",
  "service-not-allowed": "Le micro est bloqué. Autorisez-le dans votre navigateur pour dicter votre message.",
  "no-speech": "Je n'ai rien entendu. Appuyez sur le micro et parlez après le signal.",
  "audio-capture": "Aucun micro n'a été trouvé sur cet appareil.",
  network: "La dictée a besoin d'une connexion internet. Réessayez.",
};

// Dictée : onFinal reçoit la phrase complète, une fois que le visiteur a fini de parler.
export function useDictation(onFinal: (text: string) => void) {
  const supported = useBrowserSupports(() => recognitionConstructor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);

  // La dernière version de onFinal, pour la reconnaissance déjà lancée.
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function start() {
    const Constructor = recognitionConstructor();
    if (!Constructor || listening) return;
    const recognition = new Constructor();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = "";
      let final = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
        final ||= event.results[i].isFinal;
      }
      if (final) {
        setInterim("");
        if (text.trim()) onFinalRef.current(text.trim());
      } else {
        setInterim(text);
      }
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(DICTATION_ERRORS[event.error] ?? "La dictée n'a pas fonctionné. Réessayez.");
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return { supported, listening, interim, error, start, stop };
}

// Lecture à voix haute, avec une voix française si le système en a une.
export function useSpeech() {
  const supported = useBrowserSupports(() => "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);

  // On se tait quand la bulle disparaît (changement de page).
  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function speak(text: string) {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  function cancel() {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return { supported, speaking, speak, cancel };
}
