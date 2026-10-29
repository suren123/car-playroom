// All narration uses one media element and the media clock for word timing.
let loadingAudio=false,loadingTimer=0;
function setPlayingUI(){
 $('playPage').textContent=loadingAudio?'◌':playing?'Ⅱ':'▶';
 $('playPage').classList.toggle('loading',loadingAudio);
 $('playPage').setAttribute('aria-label',loadingAudio?'暂停加载':playing?'暂停朗读':activeClip?'继续朗读':'朗读本页');
 $('playPage').setAttribute('aria-busy',String(loadingAudio));
}
function stopAudio(reset=true){
 token++;clearTimeout(loadingTimer);loadingAudio=false;narrator.pause();narrator.removeAttribute('src');narrator.load();
 queue=[];playing=false;activeClip=null;clearHighlight();setPlayingUI();hideNotice('audio');$('progress').style.width='0%';
 if(reset){$('audioTitle').textContent='听一听这页的故事';$('audioSubtitle').textContent='普通话固定配音'}
}
function requestPlayback(){
 const myToken=++token;loadingAudio=true;setPlayingUI();clearTimeout(loadingTimer);
 loadingTimer=setTimeout(()=>{if(token===myToken&&loadingAudio)showNotice('声音正在加载，请稍等一下。','audio',()=>playClips(queue.slice(queueIndex)))},4500);
 narrator.play().then(()=>{if(token!==myToken)return;clearTimeout(loadingTimer);loadingAudio=false;playing=!narrator.paused;setPlayingUI();hideNotice('audio')}).catch(error=>{
  if(token!==myToken)return;clearTimeout(loadingTimer);loadingAudio=false;playing=false;setPlayingUI();
  if(error.name!=='AbortError')showNotice('声音暂时没能播放，点一下再试试。','audio',()=>playClips(queue.slice(queueIndex)));
 });
}
function playClips(ids){stopAudio(false);queue=ids.filter(id=>CLIPS[id]);queueIndex=0;if(queue.length)playCurrent()}
function playCurrent(){
 if(queueIndex>=queue.length){stopAudio(false);$('audioTitle').textContent='朗读结束';return}
 activeClip=queue[queueIndex];clearHighlight();syncNarration(activeClip);prepareWordHighlight(activeClip);
 $('audioSubtitle').textContent=TEXT[activeClip];$('audioTitle').textContent='正在朗读 · '+titles[current];
 narrator.src=CLIPS[activeClip];narrator.playbackRate=Number($('speed').value);requestPlayback();
}
function pauseNarration(){token++;clearTimeout(loadingTimer);loadingAudio=false;narrator.pause();playing=false;setPlayingUI();hideNotice('audio')}
narrator.addEventListener('ended',()=>{if(activeClip&&narrator.ended){queueIndex++;playCurrent()}});
narrator.addEventListener('playing',()=>{if(!activeClip)return;loadingAudio=false;playing=true;clearTimeout(loadingTimer);setPlayingUI();hideNotice('audio')});
narrator.addEventListener('pause',()=>{playing=false;setPlayingUI()});
narrator.addEventListener('error',()=>{if(!activeClip)return;token++;clearTimeout(loadingTimer);loadingAudio=false;playing=false;setPlayingUI();showNotice('声音没有加载好，文字和图片还可以继续看。','audio',()=>playClips(queue.slice(queueIndex)))});
narrator.addEventListener('timeupdate',()=>{if(narrator.duration&&queue.length)$('progress').style.width=((queueIndex+narrator.currentTime/narrator.duration)/queue.length*100)+'%'});
$('playPage').onclick=()=>{if(loadingAudio||!narrator.paused)pauseNarration();else if(activeClip)requestPlayback();else playClips(readingPlaylist())};
$('restartAudio').onclick=()=>playClips(readingPlaylist());$('stopAudio').onclick=()=>stopAudio();
$('speed').onchange=()=>{narrator.playbackRate=Number($('speed').value);persist()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(loadingAudio||!narrator.paused))pauseNarration()});
