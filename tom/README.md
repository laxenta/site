# my-project

## Project setup
```
pnpm install
```

### Compiles and hot-reloads for development
```
pnpm run serve
```

### Compiles and minifies for production
```
pnpm run build
```

### Lints and fixes files
```
pnpm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).



<template>
  <div class="pitch-training">
    <header class="header">
      <h1>Pitch Training</h1>
      <p class="instruction">
        Sing the target note:
        <span class="target-note">{{ targetNote }}</span>
      </p>
    </header>
    <main class="main-content">
      <div class="visualization-container">
        <canvas ref="visualizer" class="visualizer"></canvas>
      </div>
      <div class="metrics">
        <div class="metric">
          <p>Current Note</p>
          <h2>{{ currentNote }}</h2>
        </div>
        <div class="metric">
          <p>Accuracy</p>
          <h2>{{ accuracy }}%</h2>
        </div>
      </div>
      <div class="session-progress">
        <p>Progress: {{ notesHit }} / {{ totalNotes }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
      <div class="mic-section">
        <button class="mic-button" @click="toggleRecording">
          <div class="mic-icon" :class="{ 'recording': isRecording }">
            <div class="mic-inner"></div>
          </div>
          <span class="mic-label">{{ isRecording ? "Stop" : "Start" }}</span>
        </button>
      </div>
    </main>
    <footer class="footer">
      <button class="control-button" @click="changeTarget">Change Target</button>
      <button class="control-button" @click="resetSession">Reset Session</button>
    </footer>
  </div>
</template>

<script>
export default {
  name: "PitchTraining",
  data() {
    return {
      isRecording: false,
      currentNote: "-",
      targetNote: "C4",
      accuracy: 0,
      audioContext: null,
      analyser: null,
      stream: null,
      targetNotes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
      targetIndex: 0,
      notesHit: 0,
      totalNotes: 10,
      noteHit: false,
      frequencyData: null,
      timerID: null,
      buffer: null,
      noteFrequencies: {
        'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
        'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
        'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
        'C6': 1046.50
      },
    };
  },
  computed: {
    progressPercentage() {
      return (this.notesHit / this.totalNotes) * 100;
    },
  },
  mounted() {
    this.setupAudio();
    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();
    this.drawVisualizerBackground();
  },
  beforeUnmount() {
    this.stopRecording();
    if (this.audioContext) {
      this.audioContext.close();
    }
    window.removeEventListener("resize", this.resizeCanvas);
    if (this.timerID) {
      cancelAnimationFrame(this.timerID);
    }
  },
  methods: {
    setupAudio() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.buffer = new Float32Array(this.analyser.fftSize);
      } catch (error) {
        console.error("Error setting up audio context:", error);
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
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          this.stream = stream;
          const source = this.audioContext.createMediaStreamSource(stream);
          source.connect(this.analyser);
          this.isRecording = true;
          this.updatePitch();
          this.drawVisualizer();
        })
        .catch(err => {
          console.error("Error accessing microphone:", err);
          alert("Microphone access is required for pitch detection.");
        });
    },
    
    stopRecording() {
      this.isRecording = false;
      this.currentNote = "-";
      this.accuracy = 0;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      if (this.timerID) {
        cancelAnimationFrame(this.timerID);
        this.timerID = null;
      }
      
      this.drawVisualizerBackground();
    },
    
    updatePitch() {
      if (!this.isRecording) return;
      
      this.analyser.getFloatTimeDomainData(this.buffer);
      const volumeLevel = this.getVolumeLevel(this.buffer);
      
      if (volumeLevel < 0.01) {
        this.currentNote = "-";
        this.accuracy = 0;
        this.timerID = requestAnimationFrame(this.updatePitch);
        return;
      }
      
      const frequency = this.autoCorrelate(this.buffer, this.audioContext.sampleRate);
      
      if (frequency > 0) {
        this.currentNote = this.getClosestNote(frequency);
        
        const targetFreq = this.noteFrequencies[this.targetNote] || 440;
        const cents = 1200 * Math.log2(frequency / targetFreq);
        const absCents = Math.abs(cents);
        
        const threshold = 15;
        this.accuracy = absCents <= threshold
          ? 100
          : Math.max(0, 100 - ((absCents - threshold) * 2));
        
        if (this.accuracy >= 90 && !this.noteHit) {
          this.noteHit = true;
          if (this.notesHit < this.totalNotes) {
            this.notesHit++;
          }
        } else if (this.accuracy < 90) {
          this.noteHit = false;
        }
      } else {
        this.currentNote = "-";
        this.accuracy = 0;
      }
      
      this.timerID = requestAnimationFrame(this.updatePitch);
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
        let currentCorrelation = 0;
        
        for (let i = 0; i < MAX_SAMPLES; i++) {
          currentCorrelation += Math.abs(buffer[i] - buffer[i + offset]);
        }
        
        currentCorrelation = 1 - (currentCorrelation / MAX_SAMPLES);
        
        if (currentCorrelation > bestCorrelation) {
          bestCorrelation = currentCorrelation;
          bestOffset = offset;
        }
      }
      
      if (bestCorrelation > 0.9) {
        let shift = 0;
        if (bestOffset > 0 && bestOffset < MAX_PERIOD) {
          // Calculate shift using values surrounding the best offset
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
      const notes = Object.keys(this.noteFrequencies);
      let closestNote = notes[0];
      let closestDistance = Infinity;
      
      for (const note in this.noteFrequencies) {
        const noteFreq = this.noteFrequencies[note];
        const distance = Math.abs(noteFreq - frequency);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNote = note;
        }
      }
      
      return closestNote;
    },
    
    resizeCanvas() {
      const canvas = this.$refs.visualizer;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.drawVisualizerBackground();
      }
    },
    
    drawVisualizerBackground() {
      const canvas = this.$refs.visualizer;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      for (let i = 0; i <= height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
    },
    
    drawVisualizer() {
      if (!this.isRecording) return;
      
      const canvas = this.$refs.visualizer;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      this.analyser.getByteFrequencyData(this.frequencyData);
      
      ctx.fillStyle = 'rgba(30, 39, 46, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = (width / this.frequencyData.length) * 2.5;
      
      for (let i = 0; i < this.frequencyData.length; i++) {
        const percent = this.frequencyData[i] / 255;
        const barHeight = percent * height;
        
        const hue = i / this.frequencyData.length * 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        
        ctx.fillRect(
          i * barWidth, 
          height - barHeight, 
          barWidth, 
          barHeight
        );
      }
      
      this.analyser.getFloatTimeDomainData(this.buffer);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#23d5ab';
      ctx.beginPath();
      
      const sliceWidth = width / this.buffer.length;
      let x = 0;
      
      for (let i = 0; i < this.buffer.length; i++) {
        const v = this.buffer[i] * 0.5 + 0.5;
        const y = v * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
      
      requestAnimationFrame(this.drawVisualizer);
    },
    
    changeTarget() {
      this.targetIndex = (this.targetIndex + 1) % this.targetNotes.length;
      this.targetNote = this.targetNotes[this.targetIndex];
      this.noteHit = false;
    },
    
    resetSession() {
      this.notesHit = 0;
      this.noteHit = false;
    }
  }
};
</script>

<style scoped>
.pitch-training {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
  color: #fff;
  font-family: 'Inter', sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.instruction {
  font-size: 1.2rem;
  margin-top: 10px;
}

.target-note {
  font-weight: bold;
  color: #23d5ab;
  font-size: 1.4rem;
}

.main-content {
  width: 100%;
  max-width: 600px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  margin-bottom: 20px;
}

.visualization-container {
  width: 100%;
  height: 150px;
  background: #1e272e;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.visualizer {
  width: 100%;
  height: 100%;
}

.metrics {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.metric {
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px 20px;
  width: 45%;
}

.metric p {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
}

.metric h2 {
  font-size: 1.8rem;
  margin: 5px 0 0;
  color: #23d5ab;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.session-progress {
  margin-bottom: 20px;
}

.session-progress p {
  text-align: center;
  margin: 0 0 10px;
  font-size: 1rem;
}

.progress-bar {
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  height: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #23d5ab, #23a6d5);
  width: 0%;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(35, 213, 171, 0.6);
}

.mic-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.mic-button {
  background: #23d5ab;
  border: none;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.mic-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.mic-button:active {
  transform: scale(0.98);
}

.mic-icon {
  background: #fff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.mic-icon.recording {
  background: #ff5252;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
}

.mic-inner {
  background: #23d5ab;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.recording .mic-inner {
  background: #fff;
}

.mic-label {
  display: block;
  margin-top: 10px;
  font-size: 1rem;
  font-weight: bold;
}

.footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.control-button {
  background: rgba(35, 213, 171, 0.8);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.control-button:hover {
  background: #23d5ab;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.control-button:active {
  transform: translateY(1px);
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .instruction {
    font-size: 1rem;
  }
  
  .target-note {
    font-size: 1.2rem;
  }
  
  .main-content {
    padding: 15px;
  }
  
  .metric h2 {
    font-size: 1.6rem;
  }
  
  .mic-button {
    width: 100px;
    height: 100px;
  }
  
  .mic-icon {
    width: 50px;
    height: 50px;
  }
  
  .mic-inner {
    width: 25px;
    height: 25px;
  }
  
  .control-button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}
</style>