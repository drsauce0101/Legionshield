/**
 * Minimalist Sound Effects Utility
 * Uses synthesized minimalist sounds to ensure zero-dependency and instant loading.
 */

import { useSettingsStore } from '../stores/useSettingsStore';

class AudioService {
  private context: AudioContext | null = null;

  private isEnabled(): boolean {
    return useSettingsStore.getState().soundEnabled;
  }

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a minimalist 'click' sound
   */
  public playClick() {
    this.init();
    if (!this.context || !this.isEnabled()) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  /**
   * Play a minimalist 'pop' sound
   */
  public playPop() {
    this.init();
    if (!this.context || !this.isEnabled()) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  /**
   * Play a subtle 'whoosh' sound for drag/slide
   */
  public playSlide() {
    this.init();
    if (!this.context || !this.isEnabled()) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);

    gain.gain.setValueAtTime(0.05, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }
}

export const audioService = new AudioService();
