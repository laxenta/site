<template>
  <div class="pitch-training">
    <!-- Head-->
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
          <div class="mic-icon">
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
import * as Pitchfinder from "pitchfinder";

export default {
  name: "PitchTraining",
  data() {
    return {
      isRecording: false,
      currentNote: "-",
      targetNote: "C4",
      accuracy: 0,
      mediaRecorder: null,
      audioContext: null,
      analyser: null,
      visualizerData: null,
      pitchDetector: null,
      targetNotes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
      targetIndex: 0,
      notesHit: 0,
      totalNotes: 10,
      noteHit: false, // flag to prevent multiple increments per continuous hit
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
  },
  beforeDestroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    window.removeEventListener("resize", this.resizeCanvas);
  },
  methods: {
    setupAudio() {
      this.audioContext =
        new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.visualizerData = new Uint8Array(this.analyser.frequencyBinCount);
      // Initialize the YIN detector from Pitchfinder
      this.pitchDetector = Pitchfinder.YIN();
      this.resizeCanvas();
      this.drawVisualizer();
    },
    resizeCanvas() {
      const canvas = this.$refs.visualizer;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    },
    drawVisualizer() {
      const canvas = this.$refs.visualizer;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;
      const draw = () => {
        requestAnimationFrame(draw);
        if (this.isRecording) {
          this.analyser.getByteTimeDomainData(this.visualizerData);
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          ctx.fillRect(0, 0, width, height);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#23d5ab";
          ctx.beginPath();
          const sliceWidth = width / this.visualizerData.length;
          let x = 0;
          for (let i = 0; i < this.visualizerData.length; i++) {
            const v = this.visualizerData[i] / 128.0;
            const y = (v * height) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        } else {
          ctx.clearRect(0, 0, width, height);
        }
      };
      draw();
    },
    toggleRecording() {
      if (!this.isRecording) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.isRecording = true;
            this.startDetection();
          })
            .catch((err) => {
            console.error("Error accessing microphn:", err);
          });
      } else {
        this.isRecording = false;
        this.currentNote = "-";
        this.accuracy = 0;
      }
    },
    startDetection() {
      const bufferLength = this.analyser.fftSize;
      const floatData = new Float32Array(bufferLength);
      const targetFrequency = this.noteToFrequency(this.targetNote);
      const detect = () => {
        if (!this.isRecording) return;
        this.analyser.getFloatTimeDomainData(floatData);
        const pitch = this.pitchDetector(floatData);
        if (pitch && pitch > 0) {
          this.currentNote = this.frequencyToNoteName(pitch);
          const cents = 1200 * Math.log2(pitch / targetFrequency);
          const threshold = 10; // within 10 cents counts as perfect
          const absCents = Math.abs(cents);
          this.accuracy =
            absCents <= threshold
              ? 100
              : Math.max(0, 100 - ((absCents - threshold) * 2));
          // lets register a  note  accuracy is 100 and we haven't already registered it
          if (this.accuracy === 100 && !this.noteHit) {
            this.noteHit = true;
            if (this.notesHit < this.totalNotes) {
              this.notesHit++;
            }
          } else if (this.accuracy < 100) {
            this.noteHit = false;
          }
        } else {
          this.currentNote = "-";
          this.accuracy = 0;
        }
        requestAnimationFrame(detect);
      };
      detect();
    },
    frequencyToNoteName(frequency) {
      const notes = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      const noteNumber = 12 * (Math.log2(frequency / 440)) + 69;
      const rounded = Math.round(noteNumber);
      const noteIndex = rounded % 12;
      const octave = Math.floor(rounded / 12) - 1;
      return notes[noteIndex] + octave;
    },
    noteToFrequency(note) {
      const notes = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      const regex = /^([A-G]#?)(\d)$/;
      const match = note.match(regex);
      if (!match) return 440;
      const notePart = match[1];
      const octave = parseInt(match[2], 10);
      const index = notes.indexOf(notePart);
      const midi = index + (octave + 1) * 12;
      return 440 * Math.pow(2, (midi - 69) / 12);
    },
    changeTarget() {
      this.targetIndex = (this.targetIndex + 1) % this.targetNotes.length;
      this.targetNote = this.targetNotes[this.targetIndex];
    },
    resetSession() {
      // Reset progress and clear current note/accuracy.
      this.notesHit = 0;
      this.currentNote = "-";
      this.accuracy = 0;
    },
  },
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
}
.instruction {
  font-size: 1.2rem;
  margin-top: 10px;
}
.target-note {
  font-weight: bold;
  color: #23d5ab;
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
}
.progress-fill {
  height: 100%;
  background: #23d5ab;
  width: 0%;
  transition: width 0.3s ease;
}

/* Mic */
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
  transition: transform 0.2s ease;
  outline: none;
}
.mic-button:hover {
  transform: scale(1.05);
}
.mic-icon {
  background: #fff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mic-inner {
  background: #23d5ab;
  width: 30px;
  height: 30px;
  border-radius: 50%;
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
  background: #23d5ab;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.control-button:hover {
  background: #1abc9c;
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 2rem;
  }
  .instruction {
    font-size: 1rem;
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
