let context:AudioContext|null=null;
export function gameAudioContext(){context??=new AudioContext();return context;}
