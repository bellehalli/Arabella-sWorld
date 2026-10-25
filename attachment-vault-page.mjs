import {initializeCloud,loginGate} from './cloud.mjs';
import {AttachmentVault,attachmentPreviewKind,ATTACHMENT_MAX_BYTES,ATTACHMENT_MAX_PER_RECORD} from './attachment-vault.mjs';
import {active} from './core.mjs';
import {types} from './catalog.mjs';

const root=document.querySelector('#vault-root');
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const sizeLabel=size=>size<1024?`${size} B`:size<1024*1024?`${(size/1024).toFixed(1)} KB`:`${(size/1024/1024).toFixed(1)} MB`;
const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'Date unavailable':date.toLocaleString();};
const URLS=new Set();
const previewDialog=document.querySelector('#preview-dialog');
const previewContent=document.querySelector('#preview-content');
function rememberUrl(url){URLS.add(url);return url;}
function clearUrls(){for(const url of URLS)URL.revokeObjectURL(url);URLS.clear();}
window.addEventListener('pagehide',clearUrls);
previewDialog?.addEventListener('close',()=>{previewContent.replaceChildren();clearUrls();});

function unavailable(message){root.innerHTML=`<a href="./#settings">← Back to DreamHub</a><section class="vault-panel"><p class="eyebrow">ARABELLA’S PRIVATE LITTLE UNIVERSE</p><h1>My private attachment vault</h1><p role="alert">${esc(message)}</p></section>`;}

let connection;
try{connection=await initializeCloud();}catch(error){unavailable(error.message);throw error;}
if(!connection.enabled){unavailable('The private cloud is not configured for this site. This vault requires an invited account and the attachment storage migration.');}
else if(!connection.store){loginGate(root,connection.client);}
else {
  const vault=new AttachmentVault(connection.client,connection.user);
  let items=[];
  const records=active(connection.store.state).slice().sort((a,b)=>a.title.localeCompare(b.title));
  const byId=new Map(records.map(record=>[record.id,record]));
  function recordLabel(record){return `${record.title} · ${types[record.type]?.name||record.type}`;}
  function recordOptions(){return `<option value="__vault__">General attachment vault</option>${records.map(record=>`<option value="${esc(record.id)}">${esc(recordLabel(record))}</option>`).join('')}`;}
  function relationLabel(id){if(id==='__vault__')return 'General attachment vault';const record=byId.get(id);return record?recordLabel(record):'Record no longer active';}
  function render(){
    const list=items.map(item=>{
      const preview=attachmentPreviewKind(item.mime_type);
      const actions=`<button type="button" data-action="download" data-id="${esc(item.id)}">Download</button>${preview==='download'?'':`<button type="button" data-action="preview" data-id="${esc(item.id)}">Preview</button>`}<button type="button" data-action="delete" data-id="${esc(item.id)}">Delete</button>`;
      return `<article class="vault-row"><div><strong>${esc(item.file_name)}</strong><div class="vault-meta">${esc(relationLabel(item.record_id))} · ${esc(item.mime_type)} · ${sizeLabel(item.byte_size)} · ${esc(dateLabel(item.created_at))}</div></div><div class="vault-actions">${actions}</div></article>`;
    }).join('');
    root.innerHTML=`<div class="vault-skip"><a href="./#settings">← Back to DreamHub</a><a href="./#studio">Open A. Halliwell Studio</a></div><p class="eyebrow">YOUR PRIVATE FILE CABINET ♡</p><h1>My attachment vault</h1><p>Keep photos and documents beside the DreamHub records they belong to. Choose an existing record or put a file in the general vault.</p><p class="vault-warning"><strong>Private cloud storage:</strong> files are held in a private Supabase bucket with owner-only access rules. Cloud files are not end-to-end encrypted. Do not upload files you would not store with your cloud provider.</p><section class="vault-panel"><h2>Add an attachment</h2><p class="vault-muted">PDF, JPG, PNG, WebP, TXT, and DOCX · up to 15 MB per file · up to ${ATTACHMENT_MAX_PER_RECORD} files per record. SVG, HTML, and executable files are not accepted.</p><form id="attachment-form" class="vault-form"><label>Attach to a record<select name="recordId">${recordOptions()}</select></label><label>Choose a file<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx,application/pdf,image/jpeg,image/png,image/webp,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></label><button type="submit">Upload privately ♡</button></form><p id="vault-notice" class="vault-notice" role="status" aria-live="polite"></p></section><section class="vault-panel"><div class="panelhead"><h2>My saved attachments</h2><span class="tag">${items.length} file${items.length===1?'':'s'}</span></div>${items.length?list:'<p class="vault-empty">Your private attachment cabinet is empty. Add a photo or document when you’re ready.</p>'}</section><p class="vault-muted">Deleting a file removes it from private storage and its attachment list. A file attached to a trashed record remains here until you delete it.</p>`;
    bind();
  }
  async function refresh(){items=await vault.list();render();}
  function bind(){
    const form=root.querySelector('#attachment-form');
    form.addEventListener('submit',async event=>{
      event.preventDefault();const button=form.querySelector('button[type="submit"]'),status=root.querySelector('#vault-notice');button.disabled=true;status.textContent='Checking and uploading your file…';
      try{const file=form.elements.file.files?.[0];await vault.add(file,form.elements.recordId.value);form.reset();await refresh();const notice=root.querySelector('#vault-notice');if(notice)notice.textContent='Your file is safely attached to this record.';}
      catch(error){status.textContent=error.message;button.disabled=false;}
    });
    root.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',async()=>{
      const action=button.dataset.action,item=items.find(candidate=>candidate.id===button.dataset.id);if(!item)return;
      if(action==='delete'){
        if(!window.confirm(`Delete “${item.file_name}” from your private attachment vault? This can’t be undone.`))return;
        button.disabled=true;
        try{await vault.remove(item);await refresh();const status=root.querySelector('#vault-notice');if(status)status.textContent='The attachment was deleted from private storage.';}
        catch(error){button.disabled=false;const status=root.querySelector('#vault-notice');if(status)status.textContent=error.message;}
      } else if(action==='download'||action==='preview'){
        button.disabled=true;
        try{const source=await vault.download(item),blob=new Blob([source],{type:item.mime_type}),url=rememberUrl(URL.createObjectURL(blob));
          if(action==='download'){
            const link=document.createElement('a');link.href=url;link.download=item.file_name;link.rel='noopener noreferrer';link.click();setTimeout(()=>{URL.revokeObjectURL(url);URLS.delete(url);},30000);
          } else {
            previewContent.replaceChildren();
            if(item.mime_type.startsWith('image/')){const image=document.createElement('img');image.className='vault-preview-image';image.src=url;image.alt=item.file_name;previewContent.append(image);}
            else if(item.mime_type==='application/pdf'){
              const paragraph=document.createElement('p');paragraph.textContent='The PDF was downloaded securely for a temporary browser preview. Open it in a new tab:';
              const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';link.textContent=`Preview ${item.file_name}`;previewContent.append(paragraph,link);
            } else if(item.mime_type==='text/plain'){
              const paragraph=document.createElement('p');paragraph.textContent='Text preview (first 250,000 characters):';
              const text=document.createElement('pre');text.className='vault-preview-text';text.textContent=(await blob.text()).slice(0,250000);previewContent.append(paragraph,text);
            }
            previewDialog.showModal();
          }
        }catch(error){const status=root.querySelector('#vault-notice');if(status)status.textContent=error.message;}
        finally{button.disabled=false;}
      }
    }));
  }
  try{await refresh();}catch(error){unavailable(`${error.message} Make sure the private attachment migration has been applied to this isolated project.`);}
}
