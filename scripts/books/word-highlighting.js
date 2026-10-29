// Word highlights are built only in the currently visible reading surface.
let readingWords=[],readingIndex=-1,readingFrame=0,readingFallback=null;
const wordCharacter=c=>/[\p{L}\p{N}]/u.test(c);
const normalizedReading=s=>Array.from(s).filter(wordCharacter).join('');
function readingSurface(){return $('modal').open?$('modalBody'):document.querySelector('.page:not([hidden]) .activity:not([hidden])')||document.querySelector('.page:not([hidden])')}
function clearHighlight(){
 cancelAnimationFrame(readingFrame);readingFrame=0;readingWords=[];readingIndex=-1;readingFallback=null;
 document.querySelectorAll('.speaking').forEach(n=>n.classList.remove('speaking'));
 document.querySelectorAll('.narrating-card').forEach(n=>n.classList.remove('narrating-card'));
 const parents=new Set();document.querySelectorAll('[data-read-word]').forEach(n=>{parents.add(n.parentNode);n.replaceWith(document.createTextNode(n.textContent))});parents.forEach(n=>n.normalize());
}
function prepareWordHighlight(id){
 const surface=readingSurface(),words=TIMINGS[id],text=TEXT[id];if(!surface||!text)return;
 const candidates=[...surface.querySelectorAll('[data-transcript="'+id+'"],[data-copy="'+id+'"],[data-audio="'+id+'"]')].filter(n=>n.getClientRects().length&&!n.closest('[hidden]'));
 const priority=n=>n.dataset.transcript===id?0:n.dataset.copy===id?1:2;
 candidates.sort((a,b)=>priority(a)-priority(b));
 const wanted=normalizedReading(text);let match=null;
 for(const root of candidates){
  const refs=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node,clean='';
  while(node=walker.nextNode()){
   if(!node.parentElement.getClientRects().length||node.parentElement.closest('svg,.eyebrow,.small-note,.inline-read,.time,.tap-hint'))continue;
   let offset=0;for(const char of node.data){if(wordCharacter(char)){clean+=char;refs.push({node,offset,length:char.length})}offset+=char.length}
  }
  const start=clean.indexOf(wanted);if(start!==-1){match={root,refs:refs.slice(start,start+wanted.length)};break}
 }
 if(!match||!words?.length){readingFallback=match?.root||candidates[0];readingFallback?.classList.add('speaking');return}
 const originalPositions=[];let originalOffset=0;for(const char of text){if(wordCharacter(char))originalPositions.push(originalOffset);originalOffset+=char.length}
 const segments=new Map();
 for(let index=0;index<words.length;index++){
  const word=words[index];const hits=originalPositions.map((offset,i)=>offset>=word.from&&offset<word.to?match.refs[i]:null).filter(Boolean);
  if(!hits.length){readingFallback=match.root;readingFallback.classList.add('speaking');return}
  for(const hit of hits){const list=segments.get(hit.node)||[];const last=list[list.length-1];if(last&&last.index===index){last.end=hit.offset+hit.length}else list.push({index,start:hit.offset,end:hit.offset+hit.length});segments.set(hit.node,list)}
 }
 readingWords=words.map(w=>({...w,elements:[]}));
 for(const [node,list] of segments){
  const fragment=document.createDocumentFragment();let cursor=0;
  for(const segment of list){fragment.append(document.createTextNode(node.data.slice(cursor,segment.start)));const span=document.createElement('span');span.dataset.readWord=String(segment.index);span.textContent=node.data.slice(segment.start,segment.end);readingWords[segment.index].elements.push(span);fragment.append(span);cursor=segment.end}
  fragment.append(document.createTextNode(node.data.slice(cursor)));node.replaceWith(fragment);
 }
}
function updateWordHighlight(){
 if(!readingWords.length)return;const now=narrator.currentTime;
 const index=readingWords.findIndex(word=>now>=word.start&&now<word.end);
 if(index===readingIndex)return;
 if(readingIndex>=0)readingWords[readingIndex].elements.forEach(n=>n.classList.remove('reading-word'));
 readingIndex=index;if(index>=0)readingWords[index].elements.forEach(n=>n.classList.add('reading-word'));
}
function animateWords(){cancelAnimationFrame(readingFrame);updateWordHighlight();if(!narrator.paused&&!narrator.ended)readingFrame=requestAnimationFrame(animateWords)}
narrator.addEventListener('play',animateWords);
narrator.addEventListener('pause',()=>{cancelAnimationFrame(readingFrame);readingFrame=0});
narrator.addEventListener('timeupdate',()=>{if(!narrator.paused)updateWordHighlight()});
narrator.addEventListener('seeked',updateWordHighlight);
narrator.addEventListener('ratechange',()=>{if(!narrator.paused)animateWords()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!narrator.paused)animateWords()});
function readingPlaylist(){
 if(current===0&&!$('riceActivity').hidden)return ['rice0','rice1','rice2'];
 if(current===1&&!$('partActivity').hidden)return partStep<4?['find'+partQuestions[partStep]]:['partdone'];
 if(current===2&&!$('sortActivity').hidden)return [sortOrder.length===6?'sortdone':'sortintro'];
 if(current===3&&!$('quizActivity').hidden)return quizStep<3?['quiz'+quizStep]:['quizdone'];
 return playlists[current];
}
