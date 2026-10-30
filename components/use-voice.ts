"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { speechChunks } from "@/lib/speech-text";

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

// Pause qui marque la fin du message : assez longue pour reprendre son souffle
// au milieu d'une phrase (« Départ le… 1er avril »).
const SILENCE_MS = 2000;

// Dictée : onFinal reçoit le message complet, une fois que le visiteur a fini de
// parler (2 s de silence) ou qu'il a recliqué sur le micro.
export function useDictation(onFinal: (text: string) => void) {
  const supported = useBrowserSupports(() => recognitionConstructor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const onFinalRef = useRef(onFinal);

  // La dernière version de onFinal, pour la reconnaissance déjà lancée.
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => () => cancelRef.current?.(), []);

  function start() {
    const Constructor = recognitionConstructor();
    if (!Constructor || listening) return;
    const recognition = new Constructor();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    // Écoute continue : Chrome ne s'arrête plus à la première hésitation.
    recognition.continuous = true;

    let heard = "";
    let cancelled = false;
    let silence: ReturnType<typeof setTimeout> | undefined;

    recognition.onresult = (event) => {
      // En écoute continue, results contient tout ce qui a été dit depuis le début.
      heard = Array.from(event.results, (result) => result[0].transcript).join(" ").replace(/\s+/g, " ");
      setInterim(heard);
      clearTimeout(silence);
      silence = setTimeout(() => recognition.stop(), SILENCE_MS);
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech" && heard.trim()) return;
      setError(DICTATION_ERRORS[event.error] ?? "La dictée n'a pas fonctionné. Réessayez.");
    };
    recognition.onend = () => {
      clearTimeout(silence);
      setListening(false);
      setInterim("");
      recognitionRef.current = null;
      cancelRef.current = null;
      if (!cancelled && heard.trim()) onFinalRef.current(heard.trim());
    };
    // Annuler (fermeture de la bulle) : on coupe sans envoyer.
    cancelRef.current = () => {
      cancelled = true;
      recognition.abort();
    };
    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
    recognition.start();
  }

  // Arrêter : envoie ce qui a été dit.
  function stop() {
    recognitionRef.current?.stop();
  }

  // Annuler : coupe le micro sans rien envoyer.
  function cancel() {
    cancelRef.current?.();
  }

  return { supported, listening, interim, error, start, stop, cancel };
}

// La meilleure voix française installée sur l'appareil. On écarte la voix en
// ligne de Chrome (« Google français ») : elle reste souvent muette sans erreur.
// Les voix « Premium » ou « améliorées » téléchargées par le visiteur passent devant.
function voiceScore(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase().replace("_", "-");
  let score = 0;
  if (/premium|enhanced|améliorée|natural|neural/.test(name)) score += 50;
  if (lang === "fr-fr") score += 10;
  if (/grandma|grandpa|rocko|shelley|reed|sandy|eddy|flo/.test(name)) score -= 20; // voix fantaisie
  return score;
}

function bestFrenchVoice(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((v) => v.localService && v.lang.toLowerCase().startsWith("fr"))
    .sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

// Lecture à voix haute, avec une voix française si le système en a une.
export function useSpeech() {
  const supported = useBrowserSupports(() => "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);

  // Chrome charge la liste des voix en différé : on la demande dès l'ouverture.
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  // On se tait quand la bulle disparaît (changement de page).
  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // Chaque lecture a son jeton : les événements d'une lecture annulée sont ignorés.
  const tokenRef = useRef(0);

  function speak(text: string) {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const token = ++tokenRef.current;
    synth.cancel();
    const queue = speechChunks(text);
    if (queue.length === 0) return;
    const voice = bestFrenchVoice(synth.getVoices());

    function speakNext() {
      if (tokenRef.current !== token) return;
      const chunk = queue.shift();
      if (!chunk) {
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "fr-FR";
      if (voice) utterance.voice = voice;
      utterance.onend = speakNext;
      utterance.onerror = (event) => {
        if (tokenRef.current === token && event.error !== "interrupted" && event.error !== "canceled") setSpeaking(false);
      };
      synth.speak(utterance);
    }

    setSpeaking(true);
    // Chrome perd parfois une lecture lancée juste après cancel().
    setTimeout(speakNext, 50);
  }

  function cancel() {
    tokenRef.current++;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return { supported, speaking, speak, cancel };
}
