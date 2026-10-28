export function normalizeSpeechText(text:string){
 const normalized=text.replace(/[\s，。！？、：；“”‘’"']/g,'');
 // The hand animation uses the existing demonstration recording.
 return normalized==='看手指示范再试试'?'看一遍示范再试试':normalized;
}
