/**
 * Portfolio Tour - State Machine & Logic
 *
 * Manages the guided tour experience with Neko the cat hacker
 */

// Types
interface TourStep {
  id: string;
  target: string | null; // CSS selector or null for fullscreen
  animation: 'idle' | 'waving' | 'typing' | 'pointing' | 'celebrating';
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

// Constants
const STORAGE_KEY = 'portfolio_tour_v1';
const TOUR_STEP_KEY = 'portfolio_tour_step';
const TYPING_SPEED = 25; // ms per character
const HOME_PATH = '/';
const TOUR_PARAM = 'start-tour';

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
      message: 'These cards are shortcuts to explore different sections. Each page has its own cat guide!',
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
      message: "That's my tour! Visit other pages to meet my friends - Mochi, Yuki, Shadow, Patches, and Splash!",
      welcomeMode: true,
      page: '/',
    },
  ],

  // === ABOUT PAGE (Mochi - Orange Cat) ===
  '/about': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Hey there! I'm Mochi, the orange cat! Let me tell you about Ade!",
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
      message: "That's all about Ade! Check out Skills to meet Yuki, or click me anytime!",
      welcomeMode: true,
      page: '/about',
    },
  ],

  // === SKILLS PAGE (Yuki - White Cat) ===
  '/skills': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Purr! I'm Yuki, the white cat! Let me show you Ade's technical skills!",
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
      message: "So many skills! Visit Projects to meet Shadow the black cat!",
      welcomeMode: true,
      page: '/skills',
    },
  ],

  // === PROJECTS PAGE (Shadow - Black Cat) ===
  '/projects': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "*emerges from shadows* I'm Shadow. Let me show you the projects...",
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
      message: "Impressive work... *fades into shadows* Visit Experience to meet Patches!",
      welcomeMode: true,
      page: '/projects',
    },
  ],

  // === EXPERIENCE PAGE (Patches - Calico Cat) ===
  '/experience': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Meow meow! I'm Patches the calico! Let's explore the career journey!",
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
      message: "What a journey! Head to Contact to meet Splash and say hi to Ade!",
      welcomeMode: true,
      page: '/experience',
    },
  ],

  // === CONTACT PAGE (Splash - Cyan Cat) ===
  '/contact': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Splashy hello! I'm Splash! Ready to connect with Ade?",
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
      message: "Don't be shy, send a message! Thanks for visiting - come back anytime!",
      welcomeMode: true,
      page: '/contact',
    },
  ],

  // === BLOG PAGE (Pixel - Purple Cat) ===
  '/blog': [
    {
      id: 'welcome',
      target: null,
      animation: 'waving',
      message: "Nyaa~! I'm Pixel, the purple cat! Welcome to the blog!",
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
      message: "Stay tuned for more posts! Don't forget to check out the other pages!",
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
  // Normalize paths like /about/ to /about
  if (path.endsWith('/') && path !== '/') {
    return path.slice(0, -1);
  }
  return path;
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

// Check if current step matches current page
function isStepOnCurrentPage(step: TourStep): boolean {
  const currentPage = getCurrentPage();
  const stepPage = step.page || '/';

  // Normalize for comparison
  const normalizedCurrent = currentPage === '' ? '/' : currentPage;
  const normalizedStep = stepPage === '' ? '/' : stepPage;

  return normalizedCurrent === normalizedStep;
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
    await renderStep();
  } else {
    // Tour complete
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
  completeTour();
}

// Complete the tour
function completeTour(): void {
  state.isActive = false;
  state.hasCompleted = true;
  markTourCompleted();
  clearSavedTourStep();

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
}

// Start the tour
async function startTour(): Promise<void> {
  // Load tour steps for current page
  loadTourForCurrentPage();

  state.currentStep = 0;
  state.isActive = true;
  state.hasCompleted = false;

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

// Setup keyboard navigation
function setupKeyboardNav(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
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

    if (target.closest('#tour-next')) {
      e.preventDefault();
      nextStep();
    } else if (target.closest('#tour-prev')) {
      e.preventDefault();
      prevStep();
    } else if (target.closest('#tour-skip')) {
      e.preventDefault();
      skipTour();
    } else if (target.closest('#cat-guide') && !state.isActive) {
      // Click on cat when tour is not active - restart tour
      e.preventDefault();
      restartTour();
    } else if (target.closest('#restart-tour')) {
      // Click on restart button
      e.preventDefault();
      restartTour();
    }
  });
}

// Initialize tour system
function initTour(): void {
  // Load tour for current page
  loadTourForCurrentPage();

  // Wait for all components to initialize
  setTimeout(() => {
    setupKeyboardNav();
    setupButtonControls();

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
      // Just show the cat in idle state
      if (window.catGuide) {
        window.catGuide.show();
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
      skipTyping: (fullMessage: string) => void;
      setStep: (current: number, total: number) => void;
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
    portfolioTour: {
      start: () => Promise<void>;
      restart: () => Promise<void>;
      skip: () => void;
      next: () => Promise<void>;
      prev: () => Promise<void>;
      isActive: () => boolean;
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
};

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTour);
} else {
  initTour();
}

export { startTour, restartTour, skipTour, nextStep, prevStep };
