<!-- VocalTraining.vue -->
<template>
    <div class="vocal-training" :class="{ 'recording': isRecording }">
      <nav class="top-nav">
        <button class="back-button">
          <span class="arrow-left"></span>
          Back
        </button>
        <div class="settings-button">
          <div class="gear-icon"></div>
        </div>
      </nav>
  
      <div class="lesson-header">
        <div class="lesson-number">Lesson</div>
        <h1>Pitch Control Training</h1>
        <p class="subtitle">Master your pitch accuracy through moaning exercises</p>
        <div class="difficulty">
          <span class="difficulty-label">Difficulty:</span>
          <div class="difficulty-stars">
            <span class="star filled">★</span>
            <span class="star filled">★</span>
            <span class="star">★</span>
          </div>
        </div>
      </div>
  
      <div class="exercise-container">
        <div class="exercise-header">
          <h2>Target Note Exercise</h2>
          <div class="streak-counter">
            <span class="streak-label">Streak:</span>
            <span class="streak-value">{{ streak }}</span>
          </div>
        </div>
  
        <div class="visualization-area">
          <canvas ref="visualizer" class="audio-visualizer"></canvas>
        </div>
        
        <div class="mic-button" @click="toggleRecording" :class="{ 'active': isRecording }">
          <div class="mic-ring"></div>
          <div class="mic-icon" :class="{ 'pulse': isRecording }">
            <div class="mic-inner"></div>
          </div>
          <p class="mic-label">{{ isRecording ? 'Recording...' : 'Tap to Start' }}</p>
        </div>
  
        <div class="note-display">
          <div class="current-note">
            <p>Current Note</p>
            <h3>{{ currentNote }}</h3>
          </div>
          <div class="target-note">
            <p>Target</p>
            <h3>{{ targetNote }}</h3>
          </div>
        </div>
  
        <div class="metrics-container">
          <div class="metric accuracy">
            <p>Accuracy</p>
            <div class="accuracy-value">{{ accuracy }}%</div>
            <div class="accuracy-bar">
              <div class="accuracy-fill" :style="{ width: `${accuracy}%` }"></div>
            </div>
          </div>
          
          <div class="metric pitch-deviation">
            <p>Pitch Deviation</p>
            <div class="deviation-meter">
              <div class="deviation-indicator" :style="{ left: `${50 + pitchDeviation}%` }"></div>
            </div>
          </div>
        </div>
  
        <div class="session-stats">
          <div class="stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ sessionTime }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Notes Hit</span>
            <span class="stat-value">{{ notesHit }}/{{ totalNotes }}</span>
          </div>
        </div>
      </div>
  
      <div class="bottom-controls">
        <button class="control-button help-button">
          <span class="help-icon">?</span>
          <span>Help</span>
        </button>
        <button class="control-button next-button" :disabled="accuracy < 70">
          Next Exercise
          <span class="arrow-right"></span>
        </button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'VocalTraining',
    data() {
      return {
        isRecording: false,
        currentNote: 'A4',
        targetNote: 'C4',
        accuracy: 82,
        streak: 5,
        pitchDeviation: 0,
        sessionTime: '02:34',
        notesHit: 7,
        totalNotes: 10,
        mediaRecorder: null,
        audioChunks: [],
        audioContext: null,
        analyser: null,
        visualizerData: null
      }
    },
    mounted() {
      this.setupAudioVisualizer();
    },
    methods: {
      async setupAudioVisualizer() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.visualizerData = new Uint8Array(this.analyser.frequencyBinCount);
        this.drawVisualizer();
      },
      
      drawVisualizer() {
        const canvas = this.$refs.visualizer;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
  
        const draw = () => {
          requestAnimationFrame(draw);
          if (this.isRecording) {
            this.analyser.getByteTimeDomainData(this.visualizerData);
            
            ctx.fillStyle = 'rgba(34, 34, 34, 0.2)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#23d5ab';
            ctx.beginPath();
            
            const sliceWidth = width / this.visualizerData.length;
            let x = 0;
            
            for (let i = 0; i < this.visualizerData.length; i++) {
              const v = this.visualizerData[i] / 128.0;
              const y = v * height / 2;
              
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        };
        
        draw();
      },
  
      async toggleRecording() {
        if (!this.isRecording) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioSource = this.audioContext.createMediaStreamSource(stream);
            audioSource.connect(this.analyser);
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
              this.audioChunks.push(event.data);
            };
  
            this.mediaRecorder.onstop = () => {
              const audioBlob = new Blob(this.audioChunks);
              this.analyzePitch(audioBlob);
            };
  
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startPitchDetection();
          } catch (err) {
            console.error('Error accessing microphone:', err);
          }
        } else {
          this.mediaRecorder.stop();
          this.isRecording = false;
          this.stopPitchDetection();
        }
      },
  
      startPitchDetection() {
        // Simulated pitch detection
        this.pitchDetectionInterval = setInterval(() => {
          this.pitchDeviation = Math.sin(Date.now() / 1000) * 20;
          this.accuracy = Math.max(0, Math.min(100, this.accuracy + (Math.random() - 0.5) * 5));
        }, 100);
      },
  
      stopPitchDetection() {
        clearInterval(this.pitchDetectionInterval);
      },
  
      analyzePitch(audioBlob) {
        // Here you would implement actual pitch detection
        console.log('Analyzing pitch from audio blob:', audioBlob);
      }
    },
    beforeDestroy() {
      this.stopPitchDetection();
      if (this.audioContext) {
        this.audioContext.close();
      }
    }
  }
  </script>
  
  <style scoped>
  .vocal-training {
    min-height: 100vh;
    padding: 2rem;
    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
    color: white;
    font-family: 'Inter', sans-serif;
  }
  
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .back-button, .settings-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    padding: 0.8rem 1.2rem;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .back-button:hover, .settings-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .arrow-left, .arrow-right {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(135deg);
    margin-right: 8px;
  }
  
  .arrow-right {
    transform: rotate(-45deg);
    margin-right: 0;
    margin-left: 8px;
  }
  
  .lesson-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .lesson-number {
    font-size: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 1rem 0;
  }
  
  .difficulty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .difficulty-stars {
    display: flex;
    gap: 0.3rem;
  }
  
  .star {
    color: rgba(255, 255, 255, 0.3);
    font-size: 1.2rem;
  }
  
  .star.filled {
    color: #FFD700;
  }
  
  .exercise-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  .exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .streak-counter {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 12px;
  }
  
  .visualization-area {
    height: 120px;
    margin-bottom: 2rem;
  }
  
  .audio-visualizer {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }
  
  .mic-button {
    position: relative;
    width: 150px;
    height: 150px;
    margin: 2rem auto;
    cursor: pointer;
    text-align: center;
  }
  
  .mic-ring {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }
  
  .mic-button.active .mic-ring {
    animation: ring-pulse 1.5s ease infinite;
  }
  
  @keyframes ring-pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .mic-icon {
    width: 100px;
    height: 100px;
    margin: 25px auto;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .mic-inner {
    width: 50px;
    height: 30px;
    background: #23a6d5;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  
  .mic-button:hover .mic-inner {
    background: #23d5ab;
  }
  
  .note-display {
    display: flex;
    justify-content: space-around;
    margin: 2rem 0;
  }
  
  .current-note, .target-note {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    min-width: 120px;
  }
  
  .metrics-container {
    margin: 2rem 0;
  }
  
  .metric {
    margin-bottom: 1.5rem;
  }
  
  .accuracy-bar {
    height: 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    overflow: hidden;
    margin-top: 0.5rem;
  }
  
  .accuracy-fill {
    height: 100%;
    background: linear-gradient(90deg, #23a6d5, #23d5ab);
    transition: width 0.3s ease;
  }
  
  .deviation-meter {
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    margin-top: 1rem;
    position: relative;
  }
  
  .deviation-indicator {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #23d5ab;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.3s ease;
  }
  
  .session-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-label {
  display: block;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
}

.bottom-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.control-button {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.help-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.help-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.help-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.next-button {
  background: linear-gradient(90deg, #23a6d5, #23d5ab);
  color: white;
  font-weight: 600;
  padding: 1rem 2rem;
  box-shadow: 0 4px 12px rgba(35, 166, 213, 0.3);
}

.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(35, 166, 213, 0.4);
}

.next-button:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(35, 166, 213, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(35, 166, 213, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(35, 166, 213, 0.3);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .vocal-training {
    padding: 1rem;
  }

  .exercise-container {
    padding: 1.5rem;
    margin: 0 1rem;
  }

  .mic-button {
    width: 120px;
    height: 120px;
  }

  .mic-icon {
    width: 80px;
    height: 80px;
    margin: 20px auto;
  }

  .mic-inner {
    width: 40px;
    height: 40px;
  }

  .note-display {
    flex-direction: column;
    gap: 1rem;
  }

  .current-note, .target-note {
    min-width: 100%;
  }

  .bottom-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .control-button {
    width: 100%;
    justify-content: center;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .exercise-container {
    background: rgba(0, 0, 0, 0.2);
  }

  .mic-icon {
    background: rgba(255, 255, 255, 0.9);
  }

  .help-button {
    background: rgba(0, 0, 0, 0.3);
  }

  .accuracy-bar, .deviation-meter {
    background: rgba(0, 0, 0, 0.3);
  }
}

/* Custom Scrollbar */
.vocal-training::-webkit-scrollbar {
  width: 8px;
}

.vocal-training::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.vocal-training::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.vocal-training::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* Focus States */
.control-button:focus, 
.mic-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.4);
}

/* Loading States */
.loading {
  position: relative;
}

.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    rgba(255, 255, 255, 0) 100%);
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Hover Effects */
.mic-button:hover .mic-ring {
  border-color: rgba(255, 255, 255, 0.4);
}

.current-note:hover,
.target-note:hover {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

/* Active Recording States */
.recording .visualization-area {
  border: 2px solid rgba(35, 166, 213, 0.5);
  animation: border-pulse 1.5s infinite;
}

@keyframes border-pulse {
  0% {
    border-color: rgba(35, 166, 213, 0.5);
  }
  50% {
    border-color: rgba(35, 213, 171, 0.5);
  }
  100% {
    border-color: rgba(35, 166, 213, 0.5);
  }
}
</style>