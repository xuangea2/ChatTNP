const API_BASE = "http://localhost:8011";

const chatContainer = document.getElementById("chatContainer");
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const typingIndicator = document.getElementById("typingIndicator");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const cancelSettings = document.getElementById("cancelSettings");
const saveSettings = document.getElementById("saveSettings");
const maxTokensInput = document.getElementById("maxTokens");
const temperatureInput = document.getElementById("temperature");
const streamToggle = document.getElementById("streamToggle");
const systemPromptInput = document.getElementById("systemPrompt");
const markdownToggle = document.getElementById("markdownToggle");
const modelSelector = document.getElementById("modelSelector");

let messages = [];
// Default system prompt
const DEFAULT_SYSTEM_PROMPT = 'You are a Spanish speaking helpful assistant';

function autoResizeTextarea(el){
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}
promptInput.addEventListener('input', ()=> autoResizeTextarea(promptInput));
promptInput.addEventListener('keydown', (e)=>{
  if((e.key === 'Enter') && (e.ctrlKey || e.shiftKey)){
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

function renderMarkdownIfEnabled(content){
  if(typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined' && markdownToggle && markdownToggle.checked){
    try {
      const raw = marked.parse(content, { breaks: true });
      return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    } catch(e){
      return content; // Fallback
    }
  }
  return content;
}

function addMessage(role, content){
  const div = document.createElement('div');
  div.className = `message message-${role}`;
  div.dataset.role = role;
  if(role === 'assistant' || role === 'user'){
    const maybeHTML = renderMarkdownIfEnabled(content);
    if(maybeHTML !== content){
      div.innerHTML = maybeHTML;
    } else {
      div.textContent = content;
    }
  } else {
    div.textContent = content;
  }
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

function addThinking(){
  const div = document.createElement('div');
  div.className = 'thinking';
  div.innerHTML = `<div class="spinner"></div><span>Generating...</span>`;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

function updateThinking(thinkingDiv, content){
  thinkingDiv.className = 'message message-assistant';
  const maybeHTML = renderMarkdownIfEnabled(content);
  if(maybeHTML !== content){
    thinkingDiv.innerHTML = maybeHTML;
  } else {
    thinkingDiv.textContent = content;
  }
}

function setLoading(is){
  sendBtn.disabled = is;
  typingIndicator.classList.toggle('hidden', !is);
}

function openSettings(){
  // Pre-fill current system prompt (first message if role system) or default
  const sysMsg = messages.find(m => m.role === 'system');
  systemPromptInput.value = sysMsg ? sysMsg.content : DEFAULT_SYSTEM_PROMPT;
  settingsModal.classList.remove('hidden');
}
function closeSettingsModal(){ settingsModal.classList.add('hidden'); }

settingsBtn.addEventListener('click', openSettings);
closeSettings.addEventListener('click', closeSettingsModal);
cancelSettings.addEventListener('click', closeSettingsModal);
saveSettings.addEventListener('click', ()=> {
  const newPrompt = systemPromptInput.value.trim();
  if(newPrompt){
    // Update or insert system message at start
    if(messages.length && messages[0].role === 'system'){
      messages[0].content = newPrompt;
      // Update DOM first system bubble
      const firstBubble = chatContainer.querySelector('[data-role="system"]');
      if(firstBubble) firstBubble.textContent = newPrompt;
    } else {
      messages.unshift({ role: 'system', content: newPrompt });
      // Insert visually at top
      const div = document.createElement('div');
      div.className = 'message message-system';
      div.dataset.role = 'system';
      div.textContent = newPrompt;
      chatContainer.insertBefore(div, chatContainer.firstChild);
    }
  }
  closeSettingsModal();
});

clearBtn.addEventListener('click', ()=>{
  messages = [];
  chatContainer.innerHTML = '';
  // Re-add system prompt after clearing
  messages.push({ role: 'system', content: systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT });
  addMessage('system', messages[0].content);
});

chatForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if(!prompt) return;
  messages.push({ role: 'user', content: prompt });
  addMessage('user', prompt);
  promptInput.value = '';
  autoResizeTextarea(promptInput);

  const thinkingDiv = addThinking();
  setLoading(true);

  const payload = {
    messages: messages,
    model: modelSelector.value,
    max_new_tokens: parseInt(maxTokensInput.value, 10) || 256,
    temperature: parseFloat(temperatureInput.value) || 0.7,
    stream: streamToggle.checked
  };

  try {
    if(streamToggle.checked){
      // Streaming via fetch and readable stream
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        assistantText += decoder.decode(value, {stream:true});
        updateThinking(thinkingDiv, assistantText);
      }
      messages.push({ role: 'assistant', content: assistantText });
    } else {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      updateThinking(thinkingDiv, data.reply);
      messages.push({ role: 'assistant', content: data.reply });
    }
  } catch(err){
    updateThinking(thinkingDiv, `Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
});

// Initial system message default
messages.push({ role: 'system', content: DEFAULT_SYSTEM_PROMPT });
addMessage('system', DEFAULT_SYSTEM_PROMPT);

// Close settings on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSettingsModal();
  }
});
