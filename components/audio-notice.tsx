'use client';
import {useAudioSettings} from '../lib/use-audio-settings';
import {prepareAudio,speakDelivery} from '../lib/speech';
export default function AudioNotice(){const {settings,status}=useAudioSettings();if(settings.muted||!settings.voice||status==='ready'||status==='loading')return null;return <button className="room-audio-note" onClick={()=>{prepareAudio();speakDelivery('sound_retry');}}>声音暂时不可用，点这里再试一次</button>;}
