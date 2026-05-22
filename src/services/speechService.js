// CyberWeather OS speech assistant service

export function speak(text, onStart = () => {}, onEnd = () => {}) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    return;
  }

  // Cancel any active speak queues
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a premium, professional futuristic voice
  const voices = window.speechSynthesis.getVoices();
  const selectVoice = () => {
    // Look for high quality English voices (Google, Natural, Siri, Zira, Cortana)
    const preferredVoices = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Microsoft David',
      'Samantha',
      'Siri'
    ];
    for (const name of preferredVoices) {
      const v = voices.find(voice => voice.name.includes(name) && voice.lang.startsWith('en'));
      if (v) return v;
    }
    return voices.find(voice => voice.lang.startsWith('en'));
  };

  utterance.voice = selectVoice();
  utterance.rate = 1.05; // slightly faster for sleek cyberpunk feel
  utterance.pitch = 0.95; // slightly lower pitch for a smooth voice
  utterance.volume = 1.0;

  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = (e) => {
    console.error('Speech synthesis utterance error', e);
    onEnd();
  };

  // Chrome bug workaround: voices aren't populated immediately
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      utterance.voice = selectVoice();
      window.speechSynthesis.speak(utterance);
    };
  } else {
    window.speechSynthesis.speak(utterance);
  }
}

let activeRecognition = null;

export function listen(onResult, onEnd, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported on this browser.');
    return null;
  }

  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // already stopped
    }
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    onEnd();
    activeRecognition = null;
  };

  activeRecognition = recognition;
  recognition.start();
  
  return recognition;
}

export function stopListening() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // already stopped
    }
    activeRecognition = null;
  }
}
