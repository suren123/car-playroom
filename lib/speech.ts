const gentleChineseVoiceNames = [
  'xiaoxiao', 'ting-ting', 'tingting', 'meijia', 'mei-jia', 'xiaoyi', 'yaoyao', 'huihui', '女声', 'female',
];

const audioPrompts: Array<{ phrases: string[]; src: string }> = [
  { phrases: ['红灯，停一停', '红灯亮了', '红灯停'], src: '/audio/red-light.mp3' },
  { phrases: ['绿灯，可以出发', '绿灯亮了', '绿灯走'], src: '/audio/green-light.mp3' },
  { phrases: ['前面的车先走，等一等', '看看队伍，轮到最前面的车', '排好队了，看看轮到谁', '轮到最前面的车出发'], src: '/audio/wait-turn.mp3' },
  { phrases: ['我们慢慢来，再选一个试试', '没关系，我们再试一次', '再试一次'], src: '/audio/try-again.mp3' },
  { phrases: ['请大人帮忙', '请帮帮我', '有点难，请帮帮我'], src: '/audio/ask-for-help.mp3' },
  { phrases: ['先慢慢看一看', '看看亮起来的提示', '看一遍示范，再试试', '找一个小提示'], src: '/audio/hint.mp3' },
  { phrases: ['我们休息一下', '停一停，没关系'], src: '/audio/pause.mp3' },
  { phrases: ['前面施工', '路上施工', '这条路封住啦', '换一条没有封住的路'], src: '/audio/detour.mp3' },
  { phrases: ['任务完成啦', '小桥搭好啦', '安全到站啦', '大家都出发啦', '改道也能到达', '小车回到车库啦', '完成啦！'], src: '/audio/finished.mp3' },
  { phrases: ['小司机，我们慢慢来', '准备好了吗'], src: '/audio/welcome.mp3' },
];

let currentAudio: HTMLAudioElement | null = null;
let playbackId = 0;

export function stopSpeech(): void {
  playbackId += 1;
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  currentAudio?.pause();
  if (currentAudio) currentAudio.currentTime = 0;
  currentAudio = null;
}

export function speakGently(text: string, enabled = true): void {
  if (!enabled || typeof window === 'undefined') return;

  stopSpeech();
  const normalized = text.replace(/[\s，。！？、：；“”‘’"']/g, '');
  const audioPrompt = audioPrompts.find(({ phrases }) => phrases.some((phrase) => normalized.includes(phrase.replace(/[\s，。！？、：；“”‘’"']/g, ''))));
  if (audioPrompt && typeof Audio !== 'undefined') {
    const id = playbackId;
    const audio = new Audio(audioPrompt.src);
    audio.preload = 'auto';
    audio.volume = 1;
    currentAudio = audio;
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
    };
    void audio.play().catch(() => {
      if (playbackId === id) speakWithDeviceVoice(text);
    });
    return;
  }

  speakWithDeviceVoice(text);
}

function speakWithDeviceVoice(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
