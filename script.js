const mainStatus = document.getElementById('mainStatus');
const modelsInput = document.getElementById('modelsInput');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const panelsWrap = document.getElementById('panels');
const copyAllBtn = document.getElementById('copyAllBtn');
const downloadBtn = document.getElementById('downloadBtn');
const streamCheckbox = document.getElementById('streamCheckbox');

function setStatus(t){ mainStatus.textContent = t; }
function parseModels(raw){ return raw.split(',').map(s=>s.trim()).filter(Boolean); }
function createPanel(model){
  const p=document.createElement('div');
  p.className='panel';
  const header=document.createElement('div');
  header.className='header';
  header.textContent=`Model: ${model}`;
  const body=document.createElement('div');
  body.className='body';
  body.style.whiteSpace='pre-wrap';
  body.textContent='Waiting...';
  p.appendChild(header); p.appendChild(body); panelsWrap.appendChild(p);
  return {panel:p, header, body};
}

clearBtn.addEventListener('click',()=>{ panelsWrap.innerHTML=''; setStatus('Cleared'); });
copyAllBtn.addEventListener('click',()=>{
  const text = Array.from(panelsWrap.querySelectorAll('.panel')).map(p=>{
    return p.querySelector('.header').textContent + "\n" + p.querySelector('.body').textContent;
  }).join('\n\n---\n\n');
  navigator.clipboard.writeText(text).then(()=> setStatus('Copied all outputs'));
});
downloadBtn.addEventListener('click',()=>{
  const data = Array.from(panelsWrap.querySelectorAll('.panel')).map(p=>{
    return {model:p.querySelector('.header').textContent.replace('Model: ',''),
            text:p.querySelector('.body').textContent};
  });
  const payload={prompt:promptInput.value,timestamp:new Date().toISOString(),results:data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='responses.json';
  a.click(); URL.revokeObjectURL(url);
  setStatus('Downloaded JSON');
});

sendBtn.addEventListener('click', async()=>{
  const models=parseModels(modelsInput.value);
  const prompt=promptInput.value.trim();
  if(!prompt){ setStatus('Enter prompt'); return; }
  if(models.length===0){ setStatus('Add at least one model'); return; }

  panelsWrap.innerHTML=''; setStatus('Sending...');

  for(const model of models){
    const {panel, header, body} = createPanel(model);
    body.textContent=''; header.textContent=`Model: ${model} — connecting...`;

    try{
      const systemMsg={role:'system', content:`You are a helpful assistant. Mention your model name.`};
      const userMsg={role:'user', content:prompt};
      const useStream = streamCheckbox.checked;

      if(useStream){
        header.textContent=`Model: ${model} — streaming...`;
        const stream = await puter.ai.chat([systemMsg,userMsg], {model:model, stream:true});
        let collected='';
        for await(const part of stream){
          const textPiece = part?.text ?? (part?.delta?.content ?? '') ?? '';
          collected+=textPiece;
          body.textContent=collected;
          panel.scrollTop=panel.scrollHeight;
        }
        header.textContent=`Model: ${model} — done`;
      } else {
        header.textContent=`Model: ${model} — waiting...`;
        const resp = await puter.ai.chat([systemMsg,userMsg], {model:model, stream:false});
        const text = resp?.message?.content?.[0]?.text ?? JSON.stringify(resp);
        body.textContent=text;
        header.textContent=`Model: ${model} — done`;
      }
    } catch(err){
      header.textContent=`Model: ${model} — error`;
      body.textContent='Error: '+(err?.message || String(err));
      console.error(err);
    }
  }
  setStatus('All requests completed');
});
