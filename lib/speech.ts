import audioManifest from './audio-manifest.json';

const normalize = (text: string) => text.replace(/[\s，。！？、：；“”‘’"']/g, '');
const audioByText = new Map(
  Object.values(audioManifest).map((clip) => [normalize(clip.text), `/audio/${clip.file}`]),
);

let currentAudio: HTMLAudioElement | null = null;
let playbackId = 0;

function audioPlayer(): HTMLAudioElement {
  if (currentAudio) return currentAudio;
  const player = document.createElement('audio');
  player.id = 'game-prompt-audio';
  player.preload = 'auto';
  player.setAttribute('playsinline', '');
  player.setAttribute('aria-hidden', 'true');
  player.style.display = 'none';
  document.body.append(player);
  currentAudio = player;
  return player;
}

export function stopSpeech(): void {
  playbackId += 1;
  currentAudio?.pause();
  if (currentAudio) {
    currentAudio.currentTime = 0;
    currentAudio.removeAttribute('src');
    currentAudio.load();
  }
}

export function speakGently(text: string, enabled = true): void {
  if (typeof window === 'undefined') return;
  if (!enabled) {
    stopSpeech();
    return;
  }

  stopSpeech();
  const id = playbackId;
  const source = audioByText.get(normalize(text)) ?? audioByText.get(normalize('如果任务有点难，没关系，我们一起慢慢来。'));
  if (!source) return;

  const player = audioPlayer();
  player.src = source;
  player.volume = 1;
  player.onended = () => {
    if (playbackId === id && currentAudio === player) {
      player.removeAttribute('src');
      player.load();
    }
  };
  player.onerror = () => console.warn('游戏提示音频无法加载：', source);
  void player.play().catch((error: unknown) => {
    if (playbackId === id) console.warn('游戏提示音频无法播放：', error);
  });
}
