<template>
  <div class="pitch-trainer">
    <header>
      <h1>Pitch Trainer</h1>
      <p class="subtitle">
        Uh.. Tune Your  Vocals:
        <span class="target-note" :style="noteColorStyle">{{ targetNote }}</span>
      </p>
    </header>

    <div class="main-content">
      <div class="visualizer-container">
        <div class="target-indicator" :style="{ left: `${targetIndicatorPosition}%` }"></div>
        <canvas ref="waveformCanvas" class="waveform-canvas"></canvas>
        <canvas ref="spectrumCanvas" class="spectrum-canvas"></canvas>
      </div>

      <div class="metrics-row">
        <div class="metric-card" :class="{ 'pulse': isRecording && accuracy > 90 }">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V16M9 10V14M15 6V18M18 12V14M6 12V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Current Note</h3>
            <p class="metric-value">{{ currentNote || '-' }}</p>
          </div>
        </div>

        <div class="metric-card" :class="{ 'accurate': accuracy > 90 }">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12L10 17L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Accuracy</h3>
            <p class="metric-value">{{ accuracy.toFixed(1) }}%</p>
            <div class="accuracy-meter">
              <div class="accuracy-fill" :style="{ width: `${Math.min(accuracy, 100)}%`, background: accuracyGradient }"></div>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 12L16 9L13 15L9 10L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Pitch Difference</h3>
            <p class="metric-value">{{ Math.abs(pitchDifferenceCents).toFixed(1) }} cents</p>
            <p class="metric-detail">{{ pitchDifferenceCents > 0 ? 'Too High' : pitchDifferenceCents < 0 ? 'Too Low' : 'Perfect' }}</p>
          </div>
        </div>
      </div>

      <div class="controls-container">
        <button class="record-button" :class="{ 'recording': isRecording }" @click="toggleRecording">
          <span class="record-icon"></span>
          <span class="button-text">{{ isRecording ? 'Stop' : 'Start' }}</span>
        </button>

        <div class="session-controls">
          <div class="progress-section">
            <div class="progress-label">
              <span>Session Progress</span>
              <span>{{ notesHit }} / {{ totalNotes }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
          </div>
          
          <div class="action-buttons">
            <button class="action-button" @click="changeTarget">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21L12 17L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Next Note
            </button>
            <button class="action-button" @click="resetSession">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4V10H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 14 3.22501C12.5255 2.89026 10.9946 2.93887 9.54322 3.36523C8.09179 3.79159 6.75739 4.57954 5.64 5.66L4 7.00001" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 20V14H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.51 15C4.01717 16.4332 4.87913 17.7146 6.01547 18.7246C7.1518 19.7346 8.52552 20.4402 10 20.775C11.4745 21.1097 13.0054 21.0611 14.4568 20.6348C15.9082 20.2084 17.2426 19.4205 18.36 18.34L20 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div class="history-section">
        <h2>Performance History</h2>
        <div class="history-chart">
          <div v-for="(item, index) in sessionHistory" :key="index" class="history-bar" :style="{ height: `${item.accuracy}%`, backgroundColor: getHistoryBarColor(item.accuracy) }">
            <span class="history-tooltip">{{ item.note }}: {{ item.accuracy.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PitchTrainer",
  data() {
    return {
      isRecording: false,
      audioContext: null,
      analyser: null,
      stream: null,
      currentNote: null,
      targetNote: "C4",
      accuracy: 0,
      pitchDifferenceCents: 0,
      notesHit: 0,
      totalNotes: 10,
      noteHit: false,
      sessionHistory: [],
      frequencyData: null,
      waveformData: null,
      animationFrame: null,
      targetNotes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
      targetIndex: 0,
      noteFrequencies: {
        'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
        'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
        'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
        'C6': 1046.50
      },
      noteColors: {
        'C': '#FF5252',
        'C#': '#FF7752',
        'D': '#FFCA28',
        'D#': '#D4E157',
        'E': '#66BB6A',
        'F': '#26C6DA',
        'F#': '#42A5F5',
        'G': '#5C6BC0',
        'G#': '#7E57C2',
        'A': '#AB47BC',
        'A#': '#EC407A',
        'B': '#EF5350'
      }
    };
  },
  computed: {
    progressPercentage() {
      return (this.notesHit / this.totalNotes) * 100;
    },
    noteColorStyle() {
      const noteName = this.targetNote.charAt(0) + (this.targetNote.charAt(1) === '#' ? '#' : '');
      const color = this.noteColors[noteName] || '#FFFFFF';
      return { color, textShadow: `0 0 10px ${color}` };
    },
    accuracyGradient() {
      if (this.accuracy < 50) {
        return 'linear-gradient(90deg, #f44336, #ff9800)';
      } else if (this.accuracy < 90) {
        return 'linear-gradient(90deg, #ff9800, #4caf50)';
      } else {
        return 'linear-gradient(90deg, #4caf50, #00c853)';
      }
    },
    targetIndicatorPosition() {
      const targetFreq = this.noteFrequencies[this.targetNote] || 440;
      // we will normalize frequency to a position on the spectrum display (0-100%)
      // and i am assuming we display from ~80Hz to ~1000Hz on log scale ;o
      const minLogFreq = Math.log(80);
      const maxLogFreq = Math.log(1000);
      const targetLogFreq = Math.log(targetFreq);
      return ((targetLogFreq - minLogFreq) / (maxLogFreq - minLogFreq)) * 100;
    }
  },
  mounted() {
    this.setupAudio();
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.initCanvases();
  },
  beforeUnmount() {
    this.stopRecording();
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  },
  methods: {
    setupAudio() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;
        
        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);
        this.waveformData = new Float32Array(this.analyser.fftSize);
      } catch (error) {
        console.error("Failed to initialize audio context:", error);
      }
    },
    
    initCanvases() {
      const waveformCanvas = this.$refs.waveformCanvas;
      const spectrumCanvas = this.$refs.spectrumCanvas;
      
      if (waveformCanvas && spectrumCanvas) {
        const waveformCtx = waveformCanvas.getContext('2d');
        const spectrumCtx = spectrumCanvas.getContext('2d');
        
        this.drawWaveformGrid(waveformCtx, waveformCanvas.width, waveformCanvas.height);
        
        this.drawSpectrumGrid(spectrumCtx, spectrumCanvas.width, spectrumCanvas.height);
      }
    },
    
    handleResize() {
      const waveformCanvas = this.$refs.waveformCanvas;
      const spectrumCanvas = this.$refs.spectrumCanvas;
      
      if (waveformCanvas && spectrumCanvas) {
        waveformCanvas.width = waveformCanvas.offsetWidth;
        waveformCanvas.height = waveformCanvas.offsetHeight;
        
        spectrumCanvas.width = spectrumCanvas.offsetWidth;
        spectrumCanvas.height = spectrumCanvas.offsetHeight;
        
        this.initCanvases();
      }
    },
    
    toggleRecording() {
      if (!this.isRecording) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
    },
    
    startRecording() {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          this.stream = stream;
          const source = this.audioContext.createMediaStreamSource(stream);
          source.connect(this.analyser);
          this.isRecording = true;
          this.updatePitch();
          this.animateCanvases();
        })
        .catch(err => {
          console.error("Microphone access error:", err);
          alert("Microphone access is required for pitch detection.");
        });
    },
    
    stopRecording() {
      this.isRecording = false;
      this.currentNote = null;
      this.accuracy = 0;
      this.pitchDifferenceCents = 0;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      
      // Reset canvases
      this.initCanvases();
    },
    
    updatePitch() {
      if (!this.isRecording) return;
      
      this.analyser.getFloatTimeDomainData(this.waveformData);
      const volumeLevel = this.getVolumeLevel(this.waveformData);
      
      if (volumeLevel < 0.01) {
        this.currentNote = null;
        this.accuracy = 0;
        this.pitchDifferenceCents = 0;
        this.animationFrame = requestAnimationFrame(this.updatePitch);
        return;
      }
      
      const frequency = this.autoCorrelate(this.waveformData, this.audioContext.sampleRate);
      
      if (frequency > 0) {
        this.currentNote = this.getClosestNote(frequency);
        
        const targetFreq = this.noteFrequencies[this.targetNote] || 440;
        this.pitchDifferenceCents = 1200 * Math.log2(frequency / targetFreq);
        
        const absCents = Math.abs(this.pitchDifferenceCents);
        const threshold = 15;
        
        this.accuracy = absCents <= threshold
          ? 100
          : Math.max(0, 100 - ((absCents - threshold) * 2));
        
        if (this.accuracy >= 90 && !this.noteHit) {
          this.noteHit = true;
          
          if (this.notesHit < this.totalNotes) {
            this.notesHit++;
            //history
            this.sessionHistory.push({
              note: this.targetNote,
              accuracy: this.accuracy
            });
            
            //10 limits
            if (this.sessionHistory.length > 10) {
              this.sessionHistory.shift();
            }
            
            //auto change and update target notes :3
            if (this.notesHit === this.totalNotes) {
              setTimeout(() => this.changeTarget(), 1000);
            }
          }
        } else if (this.accuracy < 85) {
          this.noteHit = false;
        }
      } else {
        this.currentNote = null;
        this.accuracy = 0;
        this.pitchDifferenceCents = 0;
      }
      
      this.animationFrame = requestAnimationFrame(this.updatePitch);
    },
    
    autoCorrelate(buffer, sampleRate) {
      const SIZE = buffer.length;
      const MAX_SAMPLES = Math.floor(SIZE / 2);
      const MIN_FREQUENCY = 80;
      const MAX_FREQUENCY = 1000;
      const MIN_PERIOD = Math.floor(sampleRate / MAX_FREQUENCY);
      const MAX_PERIOD = Math.floor(sampleRate / MIN_FREQUENCY);
      
      let rms = 0;
      for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
      }
      rms = Math.sqrt(rms / SIZE);
      
      if (rms < 0.01) return -1;
      
      let bestOffset = -1;
      let bestCorrelation = 0;
      
      for (let offset = MIN_PERIOD; offset <= MAX_PERIOD; offset++) {
        let correlation = 0;
        
        for (let i = 0; i < MAX_SAMPLES; i++) {
          correlation += Math.abs(buffer[i] - buffer[i + offset]);
        }
        
        correlation = 1 - (correlation / MAX_SAMPLES);
        
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      }
      
      if (bestCorrelation > 0.8) {
        //remade pitch calculation with interpolation
        let shift = 0;
        if (bestOffset > 0 && bestOffset < MAX_PERIOD) {
          // interpolating here using adjacent offsets
          const prevCorrelation = 1 - (Math.abs(buffer[bestOffset-1] - buffer[0]) / MAX_SAMPLES);
          const nextCorrelation = 1 - (Math.abs(buffer[bestOffset+1] - buffer[0]) / MAX_SAMPLES);
          
          shift = (nextCorrelation - prevCorrelation) / (2 * (2 * bestCorrelation - nextCorrelation - prevCorrelation));
        }
        
        return sampleRate / (bestOffset + shift);
      }
      
      return -1;
    },
    
    getVolumeLevel(buffer) {
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += Math.abs(buffer[i]);
      }
      return sum / buffer.length;
    },
    
    getClosestNote(frequency) {
      const noteEntries = Object.entries(this.noteFrequencies);
      let closestNote = noteEntries[0][0];
      let closestDistance = Infinity;
      
      for (const [note, freq] of noteEntries) {
        const distance = Math.abs(freq - frequency);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNote = note;
        }
      }
      
      return closestNote;
    },
    
    animateCanvases() {
      if (!this.isRecording) return;
      
      const waveformCanvas = this.$refs.waveformCanvas;
      const spectrumCanvas = this.$refs.spectrumCanvas;
      
      if (waveformCanvas && spectrumCanvas) {
        const waveformCtx = waveformCanvas.getContext('2d');
        const spectrumCtx = spectrumCanvas.getContext('2d');
        
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getFloatTimeDomainData(this.waveformData);
        
        waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
        
        this.drawWaveformGrid(waveformCtx, waveformCanvas.width, waveformCanvas.height);
        this.drawSpectrumGrid(spectrumCtx, spectrumCanvas.width, spectrumCanvas.height);
        
        this.drawWaveform(waveformCtx, waveformCanvas.width, waveformCanvas.height);
      //draw the waveforms to actually display the sound in a wave :p
        this.drawSpectrum(spectrumCtx, spectrumCanvas.width, spectrumCanvas.height);
        
        this.animationFrame = requestAnimationFrame(this.animateCanvases);
      }
    },
    
    drawWaveformGrid(ctx, width, height) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
           
      for (let i = 0; i <= height; i += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      
      for (let i = 0; i <= width; i += width / 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    },
    
    drawSpectrumGrid(ctx, width, height) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= height; i += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      
      // frequency markers - logarithmic scale
      const frequencies = [100, 200, 400, 800];
      const logMin = Math.log(80);
      const logMax = Math.log(1000);
      
      frequencies.forEach(freq => {
        const logFreq = Math.log(freq);
        const x = ((logFreq - logMin) / (logMax - logMin)) * width;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${freq}Hz`, x, height - 5);
      });
    },
    
    drawWaveform(ctx, width, height) {
      const sliceWidth = width / this.waveformData.length;
      let x = 0;
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.accuracy > 90 ? '#4caf50' : '#42A5F5';
      ctx.beginPath();
      
      for (let i = 0; i < this.waveformData.length; i++) {
        const v = this.waveformData[i] * 0.5 + 0.5;
        const y = v * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
      
      // effect for high accuracy
      if (this.accuracy > 90) {
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    },
    
    drawSpectrum(ctx, width, height) {
      const barWidth = width / (this.frequencyData.length / 4);
      
      for (let i = 0; i < this.frequencyData.length / 4; i++) {
        const barHeight = (this.frequencyData[i] / 255) * height;
        const x = i * barWidth;
        const y = height - barHeight;
        
        // this will calculate hue based on frequency (blue for low, red for high)
        const hue = 240 - (i / (this.frequencyData.length / 4) * 240);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        
        if (this.currentNote) {
          const currentNoteFreq = this.noteFrequencies[this.currentNote];
          const freqAtBin = i * (this.audioContext.sampleRate / 2) / this.frequencyData.length;
          
          if (Math.abs(freqAtBin - currentNoteFreq) < 20) {
            ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.5)`;
            ctx.fillRect(x - 2, y - 2, barWidth + 3, barHeight + 4);
          }
        }
      }
      
      //target frequency
      if (this.targetNote) {
        const targetFreq = this.noteFrequencies[this.targetNote];
        const logMin = Math.log(80);
        const logMax = Math.log(1000);
        const logFreq = Math.log(targetFreq);
        const x = ((logFreq - logMin) / (logMax - logMin)) * width;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x - 2, 0, 4, height);
        
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.fillText(this.targetNote, x, 15);
      }
    },
    
    changeTarget() {
      this.targetIndex = (this.targetIndex + 1) % this.targetNotes.length;
      this.targetNote = this.targetNotes[this.targetIndex];
      this.noteHit = false;
    },
    
    resetSession() {
      this.notesHit = 0;
      this.noteHit = false;
      this.sessionHistory = [];
    },
    
    getHistoryBarColor(accuracy) {
      if (accuracy < 50) return '#f44336';
      if (accuracy < 70) return '#ff9800';
      if (accuracy < 90) return '#ffc107';
      return '#4caf50';
    }
  }
};
</script>

<style scoped>
.pitch-trainer {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  color: #fff;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  overflow-x: hidden;
}

header {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px 0;
  position: relative;
  z-index: 1;
}

header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 10px rgba(79, 172, 254, 0.3);
  letter-spacing: -0.5px;
  animation: titlePulse 8s ease-in-out infinite;
}

header .subtitle {
  font-size: 1.1rem;
  margin-top: 8px;
  opacity: 0.9;
  font-weight: 400;
}

.target-note {
  font-weight: 700;
  font-size: 1.3rem;
  padding: 0 6px;
  position: relative;
  animation: notePulse 2s ease-in-out infinite;
  display: inline-block;
  transition: color 0.3s ease;
}

.target-note::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: currentColor;
  transform-origin: center;
  transform: scaleX(0.8);
  opacity: 0.5;
  animation: underlinePulse 2s ease-in-out infinite;
}

.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.visualizer-container {
  position: relative;
  height: 260px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.waveform-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  z-index: 1;
}

.spectrum-canvas {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 50%;
  z-index: 1;
}

.target-indicator {
  position: absolute;
  top: 50%;
  height: 50%;
  width: 2px;
  background: rgba(255, 255, 255, 0.7);
  z-index: 2;
  transform: translateY(0);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  pointer-events: none;
  animation: indicatorPulse 2s ease-in-out infinite;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.metric-card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
  z-index: 0;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

.metric-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin-right: 16px;
  color: #fff;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.metric-card h3 {
  margin: 0 0 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  transition: all 0.3s ease;
  background: linear-gradient(90deg, #fff, #e0e0e0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.metric-detail {
  font-size: 0.85rem;
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.6);
}

.metric-card.pulse .metric-icon {
  animation: iconPulse 1s ease-in-out infinite;
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.metric-card.pulse .metric-value {
  animation: valuePulse 1s ease-in-out infinite;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  -webkit-background-clip: text;
  background-clip: text;
}

.metric-card.accurate .metric-icon {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.metric-card.accurate .metric-value {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  -webkit-background-clip: text;
  background-clip: text;
}

.accuracy-meter {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-top: 12px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease-out, background 0.5s ease;
}

.controls-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .controls-container {
    flex-direction: row;
  }
}

.record-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0061ff, #60efff);
  color: white;
  border: none;
  border-radius: 50px;
  height: 60px;
  padding: 0 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 97, 255, 0.3);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.record-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.record-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 97, 255, 0.4);
}

.record-button:hover::before {
  left: 100%;
}

.record-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 97, 255, 0.3);
}

.record-button.recording {
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  box-shadow: 0 4px 20px rgba(255, 65, 108, 0.3);
  animation: recordPulse 2s ease-in-out infinite;
}

.record-button.recording:hover {
  box-shadow: 0 6px 25px rgba(255, 65, 108, 0.4);
}

.record-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #fff;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.record-button.recording .record-icon {
  animation: recordIconPulse 2s ease-in-out infinite;
}

.session-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.06);
  gap: 16px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.44, 0.05, 0.55, 0.95);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  animation: progressShine 2s infinite;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 8px;
  height: 44px;
  padding: 0 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(1px);
}

.action-button svg {
  margin-right: 8px;
}

.history-section {
  margin-top: 24px;
}

.history-section h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.9);
}

.history-chart {
  display: flex;
  height: 150px;
  align-items: flex-end;
  gap: 6px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
}

.history-chart::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 40px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 0;
}

.history-chart::after {
  content: '90%';
  position: absolute;
  right: 12px;
  bottom: 42px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.history-bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.5s cubic-bezier(0.44, 0.05, 0.55, 0.95), background-color 0.5s ease;
  min-width: 20px;
  max-width: 50px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  margin: 0 2px;
  transform-origin: bottom;
  animation: barEntrance 0.5s ease-out;
}

.history-bar:hover {
  transform: scaleY(1.05);
}

.history-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 10;
}

.history-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.history-bar:hover .history-tooltip {
  opacity: 1;
}

/* last shit is animations */
@keyframes titlePulse {
  0%, 100% {
    filter: brightness(1);
    text-shadow: 0 2px 10px rgba(79, 172, 254, 0.3);
  }
  50% {
    filter: brightness(1.2);
    text-shadow: 0 5px 15px rgba(79, 172, 254, 0.5);
  }
}

@keyframes notePulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
}

@keyframes underlinePulse {
  0%, 100% {
    transform: scaleX(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scaleX(1);
    opacity: 0.8;
  }
}

@keyframes indicatorPulse {
  0%, 100% {
    opacity: 0.7;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 16px rgba(255, 255, 255, 0.8);
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    background: rgba(76, 175, 80, 0.2);
  }
  50% {
    transform: scale(1.1);
    background: rgba(76, 175, 80, 0.3);
  }
}

@keyframes valuePulse {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
}

@keyframes recordPulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(255, 65, 108, 0.3);
  }
  50% {
    box-shadow: 0 4px 30px rgba(255, 65, 108, 0.5);
  }
}

@keyframes recordIconPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes progressShine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes barEntrance {
  0% {
    transform: scaleY(0);
    opacity: 0;
  }
  100% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* final adjustments for those uh jumpy thingy boxes */
@media (max-width: 768px) {
  header h1 {
    font-size: 2rem;
  }
  
  .visualizer-container {
    height: 220px;
  }
  
  .metrics-row {
    grid-template-columns: 1fr;
  }
  
  .record-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  header h1 {
    font-size: 1.8rem;
  }
  
  .visualizer-container {
    height: 180px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .metric-value {
    font-size: 1.5rem;
  }
}

.visualizer-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(66, 165, 245, 0.05) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

.visualizer-container::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 2;
}

.metric-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: -1;
}

.metric-card:hover::after {
  opacity: 1;
}

.pitch-trainer::-webkit-scrollbar {
  width: 8px;
}

.pitch-trainer::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.pitch-trainer::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.pitch-trainer::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.5);
}

/*loading state */
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.loading {
  background: linear-gradient(to right, rgba(255, 255, 255, 0.1) 8%, rgba(255, 255, 255, 0.2) 18%, rgba(255, 255, 255, 0.1) 33%);
  background-size: 800px 104px;
  animation: shimmer 1.5s infinite linear;
  border-radius: 8px;
}
</style>