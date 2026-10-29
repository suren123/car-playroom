let noticeKind=null,noticeAction=null;
function showNotice(message,kind,retry){
 noticeKind=kind;noticeAction=retry;$('noticeText').textContent=message;$('readerNotice').hidden=false;
 // Keep recovery buttons reachable when a native dialog makes the page inert.
 ($('modal').open?$('modalBody'):document.body).append($('readerNotice'));
}
function hideNotice(kind){if(kind&&noticeKind!==kind)return;$('readerNotice').hidden=true;noticeKind=null;noticeAction=null}
function hydrateImages(root){
 root.querySelectorAll('img[data-src]').forEach(img=>{
  img.decoding='async';img.addEventListener('error',()=>{if(!img.isConnected)return;img.dataset.loadError='true';showNotice('图片没有加载好，点一下重新看看。','image',retryImages)});
  img.addEventListener('load',()=>{if(!img.isConnected)return;delete img.dataset.loadError;if(!document.querySelector('img[data-load-error]'))hideNotice('image')});
  img.src=img.dataset.src;delete img.dataset.src;
 });
}
function retryImages(){document.querySelectorAll('img[data-load-error]').forEach(img=>{const url=img.src;img.removeAttribute('src');img.src=url});hideNotice('image')}
$('noticeRetry').onclick=()=>noticeAction?.();$('noticeClose').onclick=()=>hideNotice();
function activityFocus(name,open){
 const activity=$(name+'Activity'),page=activity.closest('.page');
 // On tablet the activity overlays the page. Hide the covered controls from focus.
 const overlay=matchMedia('(min-width:680px) and (max-width:1100px) and (orientation:portrait)').matches;
 [...page.children].forEach(child=>{if(child!==activity)child.inert=open&&overlay});
 if(open){hydrateImages(activity);activity.querySelector('.activity-exit')?.focus({preventScroll:true});if(!overlay)activity.scrollIntoView({block:'start',behavior:'smooth'})}
}
window.addEventListener('resize',()=>{
 for(const name of ['rice','part','sort','quiz']){const activity=$(name+'Activity'),overlay=matchMedia('(min-width:680px) and (max-width:1100px) and (orientation:portrait)').matches;[...activity.closest('.page').children].forEach(child=>{if(child!==activity)child.inert=!activity.hidden&&overlay})}
});
function zoomPlant(){openModal('看一看整株水稻','<img class="plant-detail" data-src="'+ASSETS.plant+'" alt="整株水稻：上面的稻穗、细长的稻叶、一节节的稻秆，以及泥土中的稻根">')}
