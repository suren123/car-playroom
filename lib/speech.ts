const gentleChineseVoiceNames = [
  'xiaoxiao', 'ting-ting', 'tingting', 'meijia', 'mei-jia', 'xiaoyi', 'yaoyao', 'huihui', '女声', 'female',
];

export function speakGently(text: string, enabled = true): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.82;
    utterance.pitch = 1.03;
    utterance.volume = 0.88;

    const voices = synthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('zh'));
    const preferred = voices.find((voice) => {
      const name = voice.name.toLowerCase();
      return gentleChineseVoiceNames.some((candidate) => name.includes(candidate));
    });
    const voice = preferred ?? voices.find((candidate) => candidate.default) ?? voices[0];
    if (voice) utterance.voice = voice;
    synthesis.speak(utterance);
  } catch {
    // Instructions stay visible when the device has no usable speech voice.
  }
}
