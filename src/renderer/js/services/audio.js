/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
class AudioService {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
        
        // Background music
        this.bgMusic = null;
        this.bgMusicVolume = 0.2;
        this.bgMusicPlaying = false;
        this.bgMusicLoop = true;
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio service initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }

    /**
     * Resume audio context if suspended (required for Chrome's autoplay policy)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Play stone placement sound - a soft "click" sound
     */
    playStonePlace() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;
        
        // Create oscillator for the initial click
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);

        // Add a subtle "thud" for weight
        const noise = this.audioContext.createOscillator();
        const noiseGain = this.audioContext.createGain();
        
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(150, now);
        noise.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        
        noiseGain.gain.setValueAtTime(this.volume * 0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noise.start(now);
        noise.stop(now + 0.1);
    }

    /**
     * Play capture sound - multiple stones being removed
     * @param {number} count - Number of stones captured (affects intensity)
     */
    playCapture(count = 1) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;
        const intensity = Math.min(count, 10) / 10;

        // Create a "scattering" sound with multiple short clicks
        for (let i = 0; i < Math.min(count, 5); i++) {
            const delay = i * 0.03;
            
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400 + Math.random() * 200, now + delay);
            osc.frequency.exponentialRampToValueAtTime(100, now + delay + 0.1);
            
            gainNode.gain.setValueAtTime(this.volume * 0.15 * (1 + intensity), now + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.12);
        }

        // Add a low rumble for emphasis
        const rumble = this.audioContext.createOscillator();
        const rumbleGain = this.audioContext.createGain();
        
        rumble.type = 'sine';
        rumble.frequency.setValueAtTime(80, now);
        rumble.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        
        rumbleGain.gain.setValueAtTime(this.volume * 0.1 * (1 + intensity), now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        rumble.connect(rumbleGain);
        rumbleGain.connect(this.audioContext.destination);
        
        rumble.start(now);
        rumble.stop(now + 0.25);
    }

    /**
     * Play collision sound - red stone appears
     */
    playCollision() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Dramatic two-tone clash
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        gain1.gain.setValueAtTime(this.volume * 0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.2);

        // Second tone
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(800, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(150, now + 0.18);
        
        gain2.gain.setValueAtTime(this.volume * 0.15, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        
        osc2.start(now + 0.02);
        osc2.stop(now + 0.22);
    }

    /**
     * Play turn notification sound
     */
    playTurnNotification() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Gentle two-note chime
        const notes = [523.25, 659.25]; // C5, E5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gainNode.gain.setValueAtTime(this.volume * 0.2, now + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    /**
     * Play timer warning sound - byo-yomi countdown
     */
    playTimerWarning() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        
        gainNode.gain.setValueAtTime(this.volume * 0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Play timer critical warning - last 5 seconds
     */
    playTimerCritical() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Urgent double-beep
        for (let i = 0; i < 2; i++) {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(1000, now + i * 0.08);
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, now + i * 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.05);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.05);
        }
    }

    /**
     * Play game over sound
     * @param {boolean} isWin - True if the local player won
     */
    playGameOver(isWin) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        if (isWin) {
            // Victory fanfare - ascending arpeggio
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.15);
                
                gainNode.gain.setValueAtTime(this.volume * 0.25, now + i * 0.15);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
                
                osc.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.4);
            });
        } else {
            // Defeat sound - descending notes
            const notes = [392.00, 329.63, 261.63]; // G4, E4, C4
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.2);
                
                gainNode.gain.setValueAtTime(this.volume * 0.2, now + i * 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.35);
                
                osc.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                osc.start(now + i * 0.2);
                osc.stop(now + i * 0.2 + 0.35);
            });
        }
    }

    /**
     * Play pass sound
     */
    playPass() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Soft descending tone
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
        
        gainNode.gain.setValueAtTime(this.volume * 0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }

    /**
     * Play error/invalid move sound
     */
    playError() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Harsh buzz
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        
        gainNode.gain.setValueAtTime(this.volume * 0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Set sound enabled/disabled
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Set volume level
     * @param {number} volume - 0.0 to 1.0
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get current enabled state
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Load and prepare background music
     * @param {string} src - Path to the audio file (default: 天涯归魂.mp3)
     */
    async loadBackgroundMusic(src = '../../scripts/天涯归魂.mp3') {
        try {
            this.bgMusic = new Audio(src);
            this.bgMusic.loop = this.bgMusicLoop;
            this.bgMusic.volume = this.bgMusicVolume;
            
            // Wait for metadata
            await new Promise((resolve) => {
                this.bgMusic.addEventListener('loadedmetadata', resolve, { once: true });
            });
            
            console.log('Background music loaded:', src);
            return true;
        } catch (error) {
            console.warn('Failed to load background music:', error);
            return false;
        }
    }

    /**
     * Play background music
     * @param {boolean} loop - Whether to loop the music (default: true)
     */
    async playBackgroundMusic(loop = true) {
        if (!this.enabled) return;
        
        await this.resume();
        
        try {
            if (!this.bgMusic) {
                await this.loadBackgroundMusic();
            }
            
            this.bgMusic.loop = loop;
            this.bgMusic.volume = this.bgMusicVolume;
            
            const playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            this.bgMusicPlaying = true;
            console.log('Background music started');
        } catch (error) {
            console.warn('Failed to play background music:', error);
        }
    }

    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.bgMusic && this.bgMusicPlaying) {
            this.bgMusic.pause();
            this.bgMusicPlaying = false;
            console.log('Background music paused');
        }
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
            this.bgMusicPlaying = false;
            console.log('Background music stopped');
        }
    }

    /**
     * Set background music volume
     * @param {number} volume - 0.0 to 1.0
     */
    setBackgroundMusicVolume(volume) {
        this.bgMusicVolume = Math.max(0, Math.min(1, volume));
        if (this.bgMusic) {
            this.bgMusic.volume = this.bgMusicVolume;
        }
    }

    /**
     * Toggle background music play/pause
     */
    async toggleBackgroundMusic() {
        if (this.bgMusicPlaying) {
            this.pauseBackgroundMusic();
        } else {
            await this.playBackgroundMusic();
        }
        return this.bgMusicPlaying;
    }

    /**
     * Check if background music is playing
     */
    isBackgroundMusicPlaying() {
        return this.bgMusicPlaying;
    }

    /**
     * Set background music loop
     * @param {boolean} loop - Whether to loop
     */
    setBackgroundMusicLoop(loop) {
        this.bgMusicLoop = loop;
        if (this.bgMusic) {
            this.bgMusic.loop = loop;
        }
    }
}

// Export singleton instance
const audioService = new AudioService();

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = audioService;
}
