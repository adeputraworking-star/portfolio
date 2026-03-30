/**
 * Portfolio Tour - State Machine & Logic
 *
 * Manages the guided tour experience with cat guides
 * AND the "Ask Me Anything" chat mode post-tour
 */

// Types
interface TourStep {
  id: string;
  target: string | null; // CSS selector or null for fullscreen
  animation: 'idle' | 'waving' | 'typing' | 'pointing' | 'celebrating' | 'listening' | 'thinking';
  message: string;
  welcomeMode?: boolean;
  navigateTo?: string; // URL to navigate to on next step
  page?: string; // Which page this step belongs to
}

interface TourState {
  currentStep: number;
  isActive: boolean;
  isTyping: boolean;
  hasCompleted: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ChatState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Constants
const STORAGE_KEY = 'portfolio_tour_v1';
const TOUR_STEP_KEY = 'portfolio_tour_step';
const TOUR_ACTIVE_KEY = 'portfolio_tour_active';
const TYPING_SPEED = 25; // ms per character
const HOME_PATH = '/';
const TOUR_PARAM = 'start-tour';
const MAX_CHAT_HISTORY = 10;

// Page navigation order
const pageOrder = ['/', '/about', '/skills', '/projects', '/experience', '/contact', '/blog'];

// Get next page in tour
function getNextPage(currentPage: string): string | null {
  const currentIndex = pageOrder.indexOf(currentPage);
  if (currentIndex === -1 || currentIndex >= pageOrder.length - 1) {
    return null;
  }
  return pageOrder[currentIndex + 1];
}

// Mark tour as actively in progress (for multi-page tour)
function setTourActive(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(TOUR_ACTIVE_KEY, 'true');
    } else {
      localStorage.removeItem(TOUR_ACTIVE_KEY);
    }
  } catch {
    // localStorage not available
  }
}

// Check if tour is actively in progress
function isTourActive(): boolean {
  try {
    return localStorage.getItem(TOUR_ACTIVE_KEY) === 'true';
  } catch {
    return false;
  }
}

// Cat names for each page
const catNames: Record<string, string> = {
  '/': 'Neko',
  '/about': 'Mochi',
  '/skills': 'Yuki',
  '/projects': 'Shadow',
  '/experience': 'Patches',
  '/contact': 'Splash',
  '/blog': 'Pixel',
};

// Page-specific tour steps - each cat has their own tour!
const pageTours: Record<string, TourStep[]> = {
  // === HOME PAGE (Neko - Gray Cat) ===
  '/': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Meow! I'm Neko, your guide on this homepage. Let me show you around!",
      welcomeMode: true,
      page: '/',
    },
    {
      id: 'ascii-art',
      target: '[data-tour-id="ascii-art"]',
      animation: 'pointing',
      message: "This is Ade's digital signature. Pretty cool ASCII art, right?",
      page: '/',
    },
    {
      id: 'intro-terminal',
      target: '[data-tour-id="intro-terminal"]',
      animation: 'typing',
      message: "Here's the quick intro - a fullstack engineer with 5+ years of experience!",
      page: '/',
    },
    {
      id: 'nav-cards',
      target: '[data-tour-id="nav-cards"]',
      animation: 'pointing',
      message: 'These cards are shortcuts to explore different sections.',
      page: '/',
    },
    {
      id: 'matrix-toggle',
      target: '#matrix-toggle',
      animation: 'pointing',
      message: 'Psst... try this button for a cool Matrix rain effect!',
      page: '/',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "That's my tour! Click Next to meet Mochi on the About page!",
      welcomeMode: true,
      page: '/',
      navigateTo: '/about',
    },
  ],

  // === ABOUT PAGE (Mochi - Orange Cat) ===
  '/about': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Hey there! I'm Mochi, the orange cat! Neko sent you? Let me tell you about Ade!",
      welcomeMode: true,
      page: '/about',
    },
    {
      id: 'bio',
      target: '[data-tour-id="page-content"] .terminal-window',
      animation: 'typing',
      message: "Here's the bio - a self-taught fullstack engineer who's been coding for 5+ years!",
      page: '/about',
    },
    {
      id: 'stats',
      target: '[data-tour-id="page-content"] .grid',
      animation: 'pointing',
      message: '5+ years, 5 companies, 15+ technologies, 5 industries - impressive numbers!',
      page: '/about',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "That's all about Ade! Click Next to meet Yuki on the Skills page!",
      welcomeMode: true,
      page: '/about',
      navigateTo: '/skills',
    },
  ],

  // === SKILLS PAGE (Yuki - White Cat) ===
  '/skills': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Purr! I'm Yuki, the white cat! Mochi told me you're coming! Let me show you Ade's skills!",
      welcomeMode: true,
      page: '/skills',
    },
    {
      id: 'skills-list',
      target: '[data-tour-id="page-content"]',
      animation: 'typing',
      message: 'Frontend, Backend, Database, DevOps - full stack expertise with beautiful progress bars!',
      page: '/skills',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "So many skills! Click Next to meet Shadow on the Projects page!",
      welcomeMode: true,
      page: '/skills',
      navigateTo: '/projects',
    },
  ],

  // === PROJECTS PAGE (Shadow - Black Cat) ===
  '/projects': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "*emerges from shadows* I'm Shadow. Yuki mentioned you... Let me show you the projects.",
      welcomeMode: true,
      page: '/projects',
    },
    {
      id: 'projects-list',
      target: '[data-tour-id="page-content"]',
      animation: 'pointing',
      message: 'Healthcare, Fintech, Banking, Education, Gaming - diverse industries, real impact.',
      page: '/projects',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "Impressive work... Click Next to meet Patches on the Experience page...",
      welcomeMode: true,
      page: '/projects',
      navigateTo: '/experience',
    },
  ],

  // === EXPERIENCE PAGE (Patches - Calico Cat) ===
  '/experience': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Meow meow! I'm Patches the calico! Shadow said you're on a tour! Let's see the career journey!",
      welcomeMode: true,
      page: '/experience',
    },
    {
      id: 'timeline',
      target: '[data-tour-id="page-content"]',
      animation: 'typing',
      message: '5 companies, 5+ years of growth - from junior developer to leading teams!',
      page: '/experience',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "What a journey! Click Next to meet Splash on the Contact page!",
      welcomeMode: true,
      page: '/experience',
      navigateTo: '/contact',
    },
  ],

  // === CONTACT PAGE (Splash - Cyan Cat) ===
  '/contact': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Splashy hello! I'm Splash! Patches told me you've met everyone! Ready to connect with Ade?",
      welcomeMode: true,
      page: '/contact',
    },
    {
      id: 'contact-info',
      target: '[data-tour-id="page-content"]',
      animation: 'pointing',
      message: 'Email, WhatsApp, LinkedIn, GitHub - so many ways to reach out!',
      page: '/contact',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "Almost done! Click Next to meet Pixel on the Blog page!",
      welcomeMode: true,
      page: '/contact',
      navigateTo: '/blog',
    },
  ],

  // === BLOG PAGE (Pixel - Purple Cat) ===
  '/blog': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Nyaa~! I'm Pixel, the last cat! You've met everyone! Welcome to the blog!",
      welcomeMode: true,
      page: '/blog',
    },
    {
      id: 'blog-posts',
      target: '[data-tour-id="page-content"]',
      animation: 'typing',
      message: 'Here you\'ll find technical articles, tutorials, and dev stories!',
      page: '/blog',
    },
    {
      id: 'complete',
      target: null,
      animation: 'celebrating',
      message: "Tour complete! You've met all 7 cats! Feel free to ask me anything - click the mic button!",
      welcomeMode: true,
      page: '/blog',
    },
  ],
};

// Get tour steps for current page
function getTourStepsForPage(page: string): TourStep[] {
  return pageTours[page] || pageTours['/'];
}

// For backward compatibility
let tourSteps: TourStep[] = [];

// State
const state: TourState = {
  currentStep: 0,
  isActive: false,
  isTyping: false,
  hasCompleted: false,
};

// Chat state
let chatState: ChatState = 'idle';
let chatHistory: ChatMessage[] = [];
let chatModeActive = false;
let currentAbortController: AbortController | null = null;

// Check if tour was completed before
function hasCompletedTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// Mark tour as completed
function markTourCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // localStorage not available
  }
}

// Clear tour completion
function clearTourCompletion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

// Check if we're on the home page
function isHomePage(): boolean {
  return window.location.pathname === HOME_PATH || window.location.pathname === '/index.html';
}

// Get current page path (normalized)
function getCurrentPage(): string {
  const path = window.location.pathname;
  if (path.endsWith('/') && path !== '/') {
    return path.slice(0, -1);
  }
  return path;
}

// Get cat name for current page
function getCurrentCatName(): string {
  return catNames[getCurrentPage()] || 'Neko';
}

// Check if URL has tour start parameter
function shouldStartFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has(TOUR_PARAM);
}

// Clear the tour parameter from URL
function clearTourParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(TOUR_PARAM);
  window.history.replaceState({}, '', url.pathname);
}

// Save current tour step
function saveTourStep(step: number): void {
  try {
    localStorage.setItem(TOUR_STEP_KEY, String(step));
  } catch {
    // localStorage not available
  }
}

// Get saved tour step
function getSavedTourStep(): number | null {
  try {
    const step = localStorage.getItem(TOUR_STEP_KEY);
    return step !== null ? parseInt(step, 10) : null;
  } catch {
    return null;
  }
}

// Clear saved tour step
function clearSavedTourStep(): void {
  try {
    localStorage.removeItem(TOUR_STEP_KEY);
  } catch {
    // localStorage not available
  }
}

// Get current step data
function getCurrentStep(): TourStep {
  return tourSteps[state.currentStep];
}

// Initialize tour steps for current page
function loadTourForCurrentPage(): void {
  const page = getCurrentPage();
  tourSteps = getTourStepsForPage(page);
}

// Render current step
async function renderStep(): Promise<void> {
  const step = getCurrentStep();

  // Update cat animation
  if (window.catGuide) {
    window.catGuide.setAnimation(step.animation);
  }

  // Play purr during celebrating animation
  if (step.animation === 'celebrating' && window.soundManager) {
    window.soundManager.playPurr();
  }

  // Update spotlight
  if (window.tourSpotlight) {
    if (step.welcomeMode) {
      window.tourSpotlight.setWelcomeMode(true);
      window.tourSpotlight.show(true);
    } else {
      window.tourSpotlight.setWelcomeMode(false);
      window.tourSpotlight.show();
      window.tourSpotlight.highlightElement(step.target);
    }
  }

  // Update speech bubble
  if (window.speechBubble) {
    window.speechBubble.setStep(state.currentStep + 1, tourSteps.length);
    window.speechBubble.show(step.welcomeMode);

    // Type out the message
    state.isTyping = true;
    await window.speechBubble.typeMessage(step.message, TYPING_SPEED);
    state.isTyping = false;
  }
}

// Go to next step
async function nextStep(): Promise<void> {
  if (!state.isActive) return;

  // Skip typing if still in progress
  if (state.isTyping && window.speechBubble) {
    window.speechBubble.skipTyping(getCurrentStep().message);
    state.isTyping = false;
    return;
  }

  if (state.currentStep < tourSteps.length - 1) {
    state.currentStep++;
    // Play meow when going to next step
    if (window.soundManager && state.currentStep % 2 === 0) {
      window.soundManager.playMeow();
    }
    await renderStep();
  } else {
    // Check if we should navigate to next page
    const currentStep = getCurrentStep();
    if (currentStep.navigateTo) {
      // Mark tour as active and navigate
      setTourActive(true);
      window.location.href = currentStep.navigateTo;
      return;
    }
    // Tour complete - no more pages
    completeTour();
  }
}

// Go to previous step
async function prevStep(): Promise<void> {
  if (!state.isActive) return;

  if (state.currentStep > 0) {
    state.currentStep--;
    await renderStep();
  }
}

// Skip/end tour
function skipTour(): void {
  setTourActive(false);
  completeTour();
}

// Complete the tour
function completeTour(): void {
  state.isActive = false;
  state.hasCompleted = true;
  markTourCompleted();
  clearSavedTourStep();
  setTourActive(false);

  // Play success sound
  if (window.soundManager) {
    window.soundManager.playSuccess();
  }

  // Hide overlay and speech bubble
  if (window.tourSpotlight) {
    window.tourSpotlight.hide();
  }

  if (window.speechBubble) {
    window.speechBubble.hide();
  }

  // Set cat to idle
  if (window.catGuide) {
    window.catGuide.setAnimation('idle');
  }

  // Enable chat mode after a brief delay
  setTimeout(() => {
    enableChatMode();
  }, 1000);
}

// ===========================
// CHAT MODE ("Ask Me Anything")
// ===========================

function enableChatMode(): void {
  chatModeActive = true;
  chatHistory = [];

  // Show the floating mic button
  const fab = document.getElementById('chat-fab');
  if (fab) {
    fab.classList.remove('hidden');
  }
}

function disableChatMode(): void {
  chatModeActive = false;
  chatState = 'idle';

  // Hide FAB
  const fab = document.getElementById('chat-fab');
  if (fab) {
    fab.classList.add('hidden');
  }

  // Stop any ongoing processes
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  if (window.soundManager) {
    window.soundManager.stopListening();
    window.soundManager.stopSpeaking();
  }
}

function openChatBubble(): void {
  if (!window.speechBubble || !window.catGuide) return;

  const catName = getCurrentCatName();

  // Configure speech bubble for chat mode
  window.speechBubble.setMode('chat');
  window.speechBubble.setTitle(`${catName.toLowerCase()}@chat:~$`);
  window.speechBubble.clearMessage();
  window.speechBubble.show(false);

  // Show cat
  window.catGuide.show();
  window.catGuide.setAnimation('idle');

  // Set cat voice
  if (window.soundManager) {
    window.soundManager.setCatVoice(catName);
  }

  // Hide FAB while bubble is open
  const fab = document.getElementById('chat-fab');
  if (fab) {
    fab.classList.add('hidden');
  }

  // Focus the input
  const input = document.getElementById('chat-input') as HTMLInputElement;
  if (input) {
    setTimeout(() => input.focus(), 300);
  }

  // Show greeting if no history
  if (chatHistory.length === 0) {
    window.speechBubble.setMessage(`Meow! I'm ${catName}. Ask me anything about Ade's portfolio!`);
  }
}

function closeChatBubble(): void {
  if (window.speechBubble) {
    window.speechBubble.hide();
  }

  if (window.catGuide) {
    window.catGuide.setAnimation('idle');
  }

  // Show FAB again
  if (chatModeActive) {
    const fab = document.getElementById('chat-fab');
    if (fab) {
      fab.classList.remove('hidden');
    }
  }

  // Cancel ongoing request
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  if (window.soundManager) {
    window.soundManager.stopListening();
    window.soundManager.stopSpeaking();
  }

  chatState = 'idle';
}

async function sendChatMessage(userMessage: string): Promise<void> {
  if (!userMessage.trim() || chatState === 'thinking' || chatState === 'speaking') return;

  const catName = getCurrentCatName();

  // Add to history
  chatHistory.push({ role: 'user', content: userMessage.trim() });

  // Trim history to prevent token bloat
  if (chatHistory.length > MAX_CHAT_HISTORY) {
    chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
  }

  // Clear input
  const input = document.getElementById('chat-input') as HTMLInputElement;
  if (input) {
    input.value = '';
    input.disabled = true;
  }

  // Transition to thinking state
  chatState = 'thinking';
  if (window.catGuide) {
    window.catGuide.setAnimation('thinking');
  }
  if (window.speechBubble) {
    window.speechBubble.clearMessage();
    window.speechBubble.setMessage('Thinking...');
  }

  // Call API
  currentAbortController = new AbortController();
  let fullResponse = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        catName: catName,
      }),
      signal: currentAbortController.signal,
    });

    if (!response.ok) {
      let errorDetail = `Status ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody.error) errorDetail = errBody.error;
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorDetail);
    }

    // Switch to speaking animation
    chatState = 'speaking';
    if (window.catGuide) {
      window.catGuide.setAnimation('typing');
    }
    if (window.speechBubble) {
      window.speechBubble.clearMessage();
    }

    // Stream the response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let streamError = '';

    if (reader) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullResponse += parsed.text;
              if (window.speechBubble) {
                window.speechBubble.appendText(parsed.text);
              }
            }
            if (parsed.error) {
              streamError = parsed.error;
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    if (streamError && !fullResponse) {
      throw new Error(streamError);
    }

    // Add assistant response to history
    if (fullResponse) {
      chatHistory.push({ role: 'assistant', content: fullResponse });
    }

    // Speak the response via TTS
    if (fullResponse && window.soundManager) {
      window.catGuide?.setAnimation('celebrating');
      await window.soundManager.speakAsChat(fullResponse, catName);
    }

  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // User cancelled, do nothing
    } else {
      console.error('Chat error:', err);
      const errorMsg = err?.message || 'Unknown error';
      if (window.speechBubble) {
        window.speechBubble.clearMessage();
        window.speechBubble.setMessage(`Meow... ${errorMsg}. Try again?`);
      }
    }
  } finally {
    currentAbortController = null;
    chatState = 'idle';

    if (window.catGuide) {
      window.catGuide.setAnimation('idle');
    }

    // Re-enable input
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
}

function startVoiceInput(): void {
  if (!window.soundManager || !window.soundManager.isSpeechRecognitionSupported()) return;
  if (chatState === 'thinking' || chatState === 'speaking') return;

  chatState = 'listening';

  // Update UI
  if (window.catGuide) {
    window.catGuide.setAnimation('listening');
  }
  if (window.speechBubble) {
    window.speechBubble.clearMessage();
    window.speechBubble.setMessage('Listening... speak now!');
  }

  // Update mic button styles
  const micBtn = document.getElementById('chat-mic-btn');
  const fab = document.getElementById('chat-fab');
  micBtn?.classList.add('listening');
  fab?.classList.add('listening');

  window.soundManager.startListening(
    // On result
    (transcript: string) => {
      micBtn?.classList.remove('listening');
      fab?.classList.remove('listening');

      // Show what was heard
      const input = document.getElementById('chat-input') as HTMLInputElement;
      if (input) {
        input.value = transcript;
      }

      // Auto-send
      sendChatMessage(transcript);
    },
    // On error
    (error: string) => {
      micBtn?.classList.remove('listening');
      fab?.classList.remove('listening');
      chatState = 'idle';

      if (window.catGuide) {
        window.catGuide.setAnimation('idle');
      }
      if (window.speechBubble) {
        window.speechBubble.setMessage(error);
      }
    }
  );
}

// ===========================
// SETUP & CONTROLS
// ===========================

// Setup keyboard navigation
function setupKeyboardNav(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Chat mode keyboard handling
    if (chatModeActive && !state.isActive) {
      const input = document.getElementById('chat-input') as HTMLInputElement;

      if (e.key === 'Enter' && document.activeElement === input) {
        e.preventDefault();
        sendChatMessage(input.value);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeChatBubble();
        return;
      }

      return;
    }

    // Tour mode keyboard handling
    if (!state.isActive) return;

    switch (e.key) {
      case 'Enter':
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextStep();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevStep();
        break;
      case 'Escape':
        e.preventDefault();
        skipTour();
        break;
    }
  });
}

// Setup button controls
function setupButtonControls(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Tour controls
    if (target.closest('#tour-next')) {
      e.preventDefault();
      nextStep();
    } else if (target.closest('#tour-prev')) {
      e.preventDefault();
      prevStep();
    } else if (target.closest('#tour-skip')) {
      e.preventDefault();
      skipTour();
    }
    // Chat controls
    else if (target.closest('#chat-send-btn')) {
      e.preventDefault();
      const input = document.getElementById('chat-input') as HTMLInputElement;
      if (input) {
        sendChatMessage(input.value);
      }
    } else if (target.closest('#chat-mic-btn')) {
      e.preventDefault();
      startVoiceInput();
    }
    // FAB - floating mic button
    else if (target.closest('#chat-fab')) {
      e.preventDefault();
      if (chatState === 'listening') {
        // Stop listening if already listening
        if (window.soundManager) {
          window.soundManager.stopListening();
        }
        const fab = document.getElementById('chat-fab');
        fab?.classList.remove('listening');
        chatState = 'idle';
      } else {
        openChatBubble();
        // Optionally start voice input immediately
        setTimeout(() => startVoiceInput(), 500);
      }
    }
    // Cat click
    else if (target.closest('#cat-guide') && !state.isActive) {
      e.preventDefault();

      if (chatModeActive) {
        // In chat mode, clicking cat toggles the chat bubble
        const bubble = document.getElementById('speech-bubble');
        if (bubble?.classList.contains('hidden')) {
          openChatBubble();
        } else {
          // If in chat mode and bubble visible, restart tour instead
          if (window.soundManager) {
            window.soundManager.init();
            window.soundManager.playPurr();
          }
          disableChatMode();
          closeChatBubble();
          restartTour();
        }
      } else {
        // Not in chat mode - start/restart tour
        if (window.soundManager) {
          window.soundManager.init();
          window.soundManager.playPurr();
        }
        restartTour();
      }
    }
    // Restart button
    else if (target.closest('#restart-tour')) {
      e.preventDefault();
      disableChatMode();
      restartTour();
    }
  });
}

// Start the tour
async function startTour(): Promise<void> {
  // Disable chat mode if active
  disableChatMode();

  // Initialize sound manager on tour start (requires user interaction)
  if (window.soundManager) {
    window.soundManager.init();
    window.soundManager.playMeow();
    window.soundManager.startAmbientPurr();

    // Set cat voice for current page
    window.soundManager.setCatVoice(getCurrentCatName());
  }

  // Load tour steps for current page
  loadTourForCurrentPage();

  // Switch speech bubble to tour mode
  if (window.speechBubble) {
    window.speechBubble.setMode('tour');
    const catName = getCurrentCatName();
    window.speechBubble.setTitle(`${catName.toLowerCase()}@guide:~$`);
  }

  state.currentStep = 0;
  state.isActive = true;
  state.hasCompleted = false;

  // Mark tour as active for multi-page navigation
  setTourActive(true);

  // Show cat with entrance animation
  if (window.catGuide) {
    window.catGuide.show();
  }

  // Render first step
  await renderStep();
}

// Restart tour (works on any page now!)
async function restartTour(): Promise<void> {
  await startTour();
}

// Initialize tour system
function initTour(): void {
  // Load tour for current page
  loadTourForCurrentPage();

  // Wait for all components to initialize
  setTimeout(() => {
    setupKeyboardNav();
    setupButtonControls();

    // Check if tour is actively in progress (navigated from another page)
    if (isTourActive()) {
      setTimeout(() => {
        if (window.soundManager) {
          window.soundManager.init();
          window.soundManager.playMeow();
          window.soundManager.startAmbientPurr();
          window.soundManager.setCatVoice(getCurrentCatName());
        }
        startTour();
      }, 500);
      return;
    }

    // Check if we should start tour from URL parameter
    if (shouldStartFromUrl()) {
      clearTourParam();
      setTimeout(() => {
        startTour();
      }, 500);
      return;
    }

    // Check if should auto-start tour (first visit on home page only)
    if (isHomePage() && !hasCompletedTour()) {
      setTimeout(() => {
        startTour();
      }, 1000);
    } else {
      // Show the cat in idle state
      if (window.catGuide) {
        window.catGuide.show();
      }

      // If tour was completed before, enable chat mode
      if (hasCompletedTour()) {
        enableChatMode();
      }
    }
  }, 100);
}

// Export to window for global access
declare global {
  interface Window {
    catGuide: {
      element: HTMLElement | null;
      character: HTMLElement | null;
      init: () => void;
      setAnimation: (animation: string) => void;
      show: () => void;
      hide: () => void;
    };
    speechBubble: {
      element: HTMLElement | null;
      init: () => void;
      show: (welcomeMode?: boolean) => void;
      hide: () => void;
      typeMessage: (message: string, speed?: number) => Promise<void>;
      setMessage: (message: string) => void;
      appendText: (text: string) => void;
      clearMessage: () => void;
      skipTyping: (fullMessage: string) => void;
      setStep: (current: number, total: number) => void;
      setMode: (mode: 'tour' | 'chat') => void;
      setTitle: (title: string) => void;
      mode: 'tour' | 'chat';
    };
    tourSpotlight: {
      overlay: HTMLElement | null;
      spotlight: HTMLElement | null;
      init: () => void;
      show: (welcomeMode?: boolean) => void;
      hide: () => void;
      highlightElement: (selector: string | null) => void;
      setWelcomeMode: (enabled: boolean) => void;
    };
    soundManager: {
      audioContext: AudioContext | null;
      isEnabled: boolean;
      voiceEnabled: boolean;
      volume: number;
      purrInterval: number | null;
      speechSynth: SpeechSynthesis | null;
      currentUtterance: SpeechSynthesisUtterance | null;
      preferredVoice: SpeechSynthesisVoice | null;
      currentCatName: string;
      isListening: boolean;
      init: () => void;
      initVoice: () => void;
      playTypingSound: () => void;
      playMeow: () => void;
      playPurr: () => void;
      playSuccess: () => void;
      speakMessage: (message: string) => void;
      speakAsChat: (message: string, catName?: string) => Promise<void>;
      stopSpeaking: () => void;
      startAmbientPurr: () => void;
      stopAmbientPurr: () => void;
      setEnabled: (enabled: boolean) => void;
      setVoiceEnabled: (enabled: boolean) => void;
      setVolume: (volume: number) => void;
      setCatVoice: (catName: string) => void;
      startListening: (onResult: (text: string) => void, onError?: (error: string) => void) => void;
      stopListening: () => void;
      isSpeechRecognitionSupported: () => boolean;
    };
    portfolioTour: {
      start: () => Promise<void>;
      restart: () => Promise<void>;
      skip: () => void;
      next: () => Promise<void>;
      prev: () => Promise<void>;
      isActive: () => boolean;
      openChat: () => void;
      closeChat: () => void;
    };
  }
}

window.portfolioTour = {
  start: startTour,
  restart: restartTour,
  skip: skipTour,
  next: nextStep,
  prev: prevStep,
  isActive: () => state.isActive,
  openChat: openChatBubble,
  closeChat: closeChatBubble,
};

// Initialize ambient sounds on first user interaction
let soundsInitialized = false;
function initSoundsOnInteraction(): void {
  if (soundsInitialized) return;
  soundsInitialized = true;

  if (window.soundManager) {
    window.soundManager.init();
    window.soundManager.startAmbientPurr();
  }

  // Remove listeners after first interaction
  document.removeEventListener('click', initSoundsOnInteraction);
  document.removeEventListener('keydown', initSoundsOnInteraction);
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTour();
    document.addEventListener('click', initSoundsOnInteraction);
    document.addEventListener('keydown', initSoundsOnInteraction);
  });
} else {
  initTour();
  document.addEventListener('click', initSoundsOnInteraction);
  document.addEventListener('keydown', initSoundsOnInteraction);
}

export { startTour, restartTour, skipTour, nextStep, prevStep };
