document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'saai_chat_history';
  const API_KEY_KEY = 'gemini_api_key';

  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const apiKeyBtn = document.getElementById('api-key-btn');
  
  const apiModal = document.getElementById('api-modal');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveApiBtn = document.getElementById('save-api');
  const cancelApiBtn = document.getElementById('cancel-api');

  let chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  
  // Automatically greet if fresh
  if (chatHistory.length === 0) {
    addMessage('bot', "Hi there! I'm Saai, your AI friend. I'm here to chat, help you reflect on your feelings, or just talk about your day! 😊");
  } else {
    chatHistory.forEach(msg => renderMessage(msg.role, msg.text));
    scrollToBottom();
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY_KEY);
  }

  apiKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = getApiKey() || '';
    apiModal.classList.add('active');
  });

  cancelApiBtn.addEventListener('click', () => {
    apiModal.classList.remove('active');
  });

  saveApiBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem(API_KEY_KEY, key);
      showToast('Gemini API Key saved securely!');
    } else {
      localStorage.removeItem(API_KEY_KEY);
    }
    apiModal.classList.remove('active');
  });

  function renderMessage(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    
    // Safety encode HTML and map basic markdown
    let formatted = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/\n/g, "<br>");
    
    div.innerHTML = formatted;
    chatMessages.appendChild(div);
  }

  function addMessage(role, text) {
    renderMessage(role, text);
    chatHistory.push({role, text});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    scrollToBottom();
  }
  
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    const apiKey = getApiKey();
    if (!apiKey) {
      apiModal.classList.add('active');
      showToast('Please set your Gemini API key first.', true);
      return;
    }

    addMessage('user', text);
    chatInput.value = '';
    sendBtn.disabled = true;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'msg bot typing';
    loadingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();

    // Mapping history
    const contents = chatHistory.map(msg => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{text: msg.text}]
    }));

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
             parts: [{text: "You are Saai, a friendly, empathetic, and supportive AI companion located inside a 'Memory Journal' app. Your goal is to be a best friend, respond casually, ask empathetic questions, provide encouragement, and just listen to the user. Speak like a friend texting natively. Use emojis generously."}]
          },
          contents: contents
        })
      });

      const data = await response.json();
      
      loadingDiv.remove();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.candidates && data.candidates.length > 0) {
        const botReply = data.candidates[0].content.parts[0].text;
        addMessage('bot', botReply);
      }
    } catch (e) {
      loadingDiv.remove();
      renderMessage('system', 'System Error: Connect to Gemini failed. Is the API key valid?');
      scrollToBottom();
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
