export default class Say {
  constructor(bp, settings = {}) {
    this.bp = bp;
    this.settings = {
      audioEnabled: settings.audioEnabled || true,
      ttsEnabled: settings.ttsEnabled || true,
      ttsVoiceIndex: settings.ttsVoiceIndex || 0,
      language: settings.language || 'en-US'
    };
    this.voices = [];
  }

  init() {
    if ('speechSynthesis' in window) {
      this.available = true;
      this.loadVoices();
      if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
        speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
    } else {
      this.available = false;
      console.log('Speech Synthesis not supported in this browser.');
    }
    this.bp.say = this.speak.bind(this);
    this.bp.on('say::message', 'speak-message-text', (message) => {
      this.speak(message.text);
    });
    this.bp.on('say::tts', 'speak-tts-text', (message) => {
      this.tts(message.text);
    });

  }

  loadVoices() {
    this.voices = speechSynthesis.getVoices();
  }

  tts(text, persona = 'nova') {
    buddypond.ttsEndpoint = 'https://buddypond.com/api/tts';
    const ttsEndpoint = buddypond.ttsEndpoint || 'http://192.168.200.59:9012/api/tts';
    console.log('speaking via tts endpoint', ttsEndpoint);
    console.log('with text:', text);
    console.log('with persona:', persona);
    if (this.isSpeaking) {
      console.log('TTS is already speaking. Please wait.');
      return;
    }
    // remove all the @ symbols from the text
    text = text.replace(/@/g, '');
    this.isSpeaking = true;
    let that = this;
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${ttsEndpoint}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, persona })
        });

        console.log('got back from tts/speak', response);

        if (!response.ok) {
          throw new Error('Failed to call TTS API');
        }

        // ✅ Create an object URL from the streaming response
        const audioStream = response.body;

        // Convert stream → Blob → playable URL progressively
        const reader = audioStream.getReader();
        const chunks = [];

        // Create a new MediaSource for immediate streaming playback
        const mediaSource = new MediaSource();
        const audio = new Audio();
        audio.src = URL.createObjectURL(mediaSource);
        audio.autoplay = true;
        audio.controls = true;
        audio.volume = 1.0;
        // hide the audio element
        audio.style.display = 'none';
        document.body.appendChild(audio); // optional: append so user can see controls
        // delete the audio element after playback
        audio.addEventListener('ended', () => {
          document.body.removeChild(audio);
          that.isSpeaking = false;
        });

        mediaSource.addEventListener('sourceopen', async () => {
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

          // Feed chunks into the SourceBuffer as they arrive
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // done streaming
              sourceBuffer.addEventListener('updateend', () => {
                mediaSource.endOfStream();
                resolve({ ok: true, message: 'Playback complete' });
              });
              break;
            }
            await new Promise((res) => {
              sourceBuffer.addEventListener('updateend', res, { once: true });
              sourceBuffer.appendBuffer(value);
            });
          }
        });

      } catch (error) {
        console.error('TTS playback error:', error);
        reject(error);
      }
    });
  }


  speak(text) {

    if (!this.available || !this.settings.audioEnabled || !this.settings.ttsEnabled) {
      console.log('Warning: TTS Engine not available or disabled.');
      return;
    }

    if (!this.bp.settings.audio_enabled) {
      console.log('Audio is disabled in settings.');
      return;
    }

    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = this.voices[this.settings.ttsVoiceIndex] || this.voices[0];
    speech.lang = this.settings.language;

    window.speechSynthesis.speak(speech);
  }

  setVoice(index) {
    if (index < 0 || index >= this.voices.length) {
      console.log('Invalid voice index.');
      return;
    }
    this.settings.ttsVoiceIndex = index;
  }

  setLanguage(language) {
    this.settings.language = language;
  }

  enableTTS(enable = true) {
    this.settings.ttsEnabled = enable;
  }

  enableAudio(enable = true) {
    this.settings.audioEnabled = enable;
  }

  processMessages(message) {
    const now = new Date();
    const messageDate = new Date(message.ctime);
    const timeDiff = (now.getTime() - messageDate.getTime()) / 1000;

    // if the say message is older than 10 seconds, don't process it
    if (timeDiff > 10) {
      // TODO: better to check UUID of processedMessages
      // console.log('Message is too old to be processed for TTS.');
      return;
    }

    if (message.text.startsWith('/say')) {

      // TODO: move this to above the processedMessages() delegation
      let processedCards = bp.get('processedCards') || [];

      // console.log('say message.uuid', message.uuid);
      // console.log('processedCards', processedCards);

      // check if message.uuid is already in processedCards, if so, return
      if (processedCards.includes(message.uuid)) {
        console.log('Message already processed for TTS.');
        //return;
      }

      // push message.uuid to processedCards
      processedCards.push(message.uuid);

      // truncate processedCards to 1000 items
      if (processedCards.length > 1000) {
        processedCards = processedCards.slice(-1000);
      }

      // store processedCards in local storage
      bp.set('processedCards', processedCards);

      const parts = message.text.split(' ');
      parts.shift(); // Remove '/say'
      const textToSpeak = parts.join(' ');

      if (message.card && typeof message.card.voiceIndex !== 'undefined') {
        const originalVoiceIndex = this.settings.ttsVoiceIndex;
        this.setVoice(message.card.voiceIndex);
        // this.speak(textToSpeak || 'I have nothing to say');
        this.tts(textToSpeak || 'I have nothing to say');
        this.setVoice(originalVoiceIndex); // Restore original voice index
      } else {
        // this.speak(textToSpeak || 'I have nothing to say');
        this.tts(textToSpeak || 'I have nothing to say');

      }
    }
  }
}

/*
// Example usage:
const say = new Say({ audioEnabled: true, ttsEnabled: true, ttsVoiceIndex: 0, language: 'en-US' });
say.processMessages({
  ctime: new Date().toISOString(),
  text: '/say Hello, how are you today?',
  card: { voiceIndex: 1 }
});
*/


let voices = [
  {
    "name": "alloy",
    "tags": ["neutral", "balanced", "versatile", "clear", "warm"],
    "description": "A well-rounded and balanced voice suitable for general-purpose agents. Calm but expressive, ideal for default narrators or professional assistants.",
    "energy": "medium",
    "gender_tone": "neutral-masculine",
    "recommended_persona_types": ["assistant", "teacher", "moderator", "manager"]
  },
  {
    "name": "ash",
    "tags": ["soft", "approachable", "youthful", "empathetic"],
    "description": "A friendly and slightly casual tone with warmth and compassion. Great for supportive, gentle, or conversational personas.",
    "energy": "low-medium",
    "gender_tone": "neutral-feminine",
    "recommended_persona_types": ["therapist", "companion", "friend", "storyteller"]
  },
  {
    "name": "ballad",
    "tags": ["narrative", "poetic", "melodic", "calm", "intimate"],
    "description": "A slow, melodic, almost musical delivery style. Works beautifully for storytellers, lorekeepers, or characters with emotional depth.",
    "energy": "low",
    "gender_tone": "neutral",
    "recommended_persona_types": ["bard", "poet", "narrator", "philosopher"]
  },
  {
    "name": "coral",
    "tags": ["crisp", "bright", "optimistic", "cheerful"],
    "description": "A lively and upbeat tone with clear articulation. Ideal for social, creative, or outgoing personas that exude energy.",
    "energy": "high",
    "gender_tone": "feminine",
    "recommended_persona_types": ["artist", "influencer", "game_host", "youthful_character"]
  },
  {
    "name": "echo",
    "tags": ["tech", "precise", "calm", "modern", "robotic"],
    "description": "A clean, slightly synthetic tone that sounds technical and analytical without being cold. Great for AI, data, or sci-fi personas.",
    "energy": "medium",
    "gender_tone": "neutral",
    "recommended_persona_types": ["data_analyst", "engineer", "ai_core", "navigator"]
  },
  {
    "name": "fable",
    "tags": ["storyteller", "fantasy", "enchanted", "dramatic"],
    "description": "A rich, theatrical voice with depth and personality. Feels like a fantasy narrator or stage performer.",
    "energy": "medium-high",
    "gender_tone": "neutral",
    "recommended_persona_types": ["storyteller", "wizard", "mentor", "mythic_character"]
  },
  {
    "name": "nova", // sama
    "tags": ["youthful", "energetic", "friendly", "modern"],
    "description": "An enthusiastic, bright, and personable tone that feels current. Good for upbeat, casual, or social personas.",
    "energy": "high",
    "gender_tone": "feminine",
    "recommended_persona_types": ["social_bot", "influencer", "friend", "companion"]
  },
  {
    "name": "onyx",
    "tags": ["deep", "commanding", "mature", "authoritative"],
    "description": "A confident, resonant voice that carries authority and calm strength. Perfect for leadership or serious personas.",
    "energy": "low-medium",
    "gender_tone": "masculine",
    "recommended_persona_types": ["leader", "commander", "mentor", "guardian"]
  },
  {
    "name": "sage",
    "tags": ["calm", "wise", "meditative", "neutral"],
    "description": "A grounded, soothing tone that conveys patience and understanding. Feels wise without being distant.",
    "energy": "low",
    "gender_tone": "neutral",
    "recommended_persona_types": ["counselor", "teacher", "zen_master", "philosopher"]
  },
  {
    "name": "shimmer", // tara
    "tags": ["playful", "expressive", "sparkly", "animated"],
    "description": "Highly expressive and lively, almost theatrical. Works great for creative, magical, or humorous personas.",
    "energy": "high",
    "gender_tone": "feminine",
    "recommended_persona_types": ["entertainer", "sprite", "trickster", "performer"]
  }
]
