<template>
  <div class="yoga-pose">
    <header class="header">
      <h1>Yoga Pose Detector</h1>
      <p>Target Pose: <strong>{{ targetPoseName }}</strong></p>
    </header>

    <div class="camera-container">
      <!-- Video stream from the webcam, little issue will see later -->
      <video ref="video" autoplay playsinline muted></video>
      <!-- issue will see later overlay for drawing the pose and keypoints -->
      <canvas ref="canvas"></canvas>
    </div>

    <section class="feedback">
      <p>Detected Pose: <strong>{{ detectedPose }}</strong></p>
      <p>Match Score: <strong>{{ matchScore.toFixed(1) }}%</strong></p>
      <p v-if="averageError !== null">Avg. Angle Error: <strong>{{ averageError.toFixed(1) }}°</strong></p>
    </section>
  </div>
</template>

<script>
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';

export default {
  name: "YogaPose",
  data() {
    return {
      video: null,
      canvas: null,
      ctx: null,
      net: null,
      targetPoseName: "Tree Pose",
      detectedPose: "None",
      matchScore: 0,
      averageError: null,
      detectionInterval: null,
      treePoseTemplate: {
        leftKnee: 180,
        rightKnee: 90,
        leftElbow: 180,
        rightElbow: 180,
      },
      tolerance: 30,
    };
  },
  async mounted() {
    // Set the backend and wait until ready doesnt work
    await tf.setBackend('webgl');
    await tf.ready();
    this.setupCamera();
    this.loadPoseNet();
    window.addEventListener("resize", this.resizeCanvas);
  },
  beforeDestroy() {
    if (this.detectionInterval) clearInterval(this.detectionInterval);
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach((track) => track.stop());
    }
    window.removeEventListener("resize", this.resizeCanvas);
  },
  methods: {
    async loadPoseNet() {
      this.net = await posenet.load();
      this.detectionInterval = setInterval(this.detectPose, 100);
    },
    async setupCamera() {
      this.video = this.$refs.video;
      this.canvas = this.$refs.canvas;
      this.ctx = this.canvas.getContext("2d");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        this.video.srcObject = stream;
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.resizeCanvas();
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    },
    resizeCanvas() {
      if (this.video && this.video.videoWidth && this.video.videoHeight) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      }
    },
    async detectPose() {
      if (!this.video || !this.video.videoWidth || !this.video.videoHeight) return;
      
      if (!this.net) return;
      const pose = await this.net.estimateSinglePose(this.video, { flipHorizontal: false });
      this.drawPose(pose);
      
      const leftKnee = this.getJointAngle(pose.keypoints, 'leftHip', 'leftKnee', 'leftAnkle');
      const rightKnee = this.getJointAngle(pose.keypoints, 'rightHip', 'rightKnee', 'rightAnkle');
      const leftElbow = this.getJointAngle(pose.keypoints, 'leftShoulder', 'leftElbow', 'leftWrist');
      const rightElbow = this.getJointAngle(pose.keypoints, 'rightShoulder', 'rightElbow', 'rightWrist');
      
      if ([leftKnee, rightKnee, leftElbow, rightElbow].every(val => val !== null)) {
        const diffLeftKnee = Math.abs(this.treePoseTemplate.leftKnee - leftKnee);
        const diffRightKnee = Math.abs(this.treePoseTemplate.rightKnee - rightKnee);
        const diffLeftElbow = Math.abs(this.treePoseTemplate.leftElbow - leftElbow);
        const diffRightElbow = Math.abs(this.treePoseTemplate.rightElbow - rightElbow);
        
        const totalError = diffLeftKnee + diffRightKnee + diffLeftElbow + diffRightElbow;
        const avgError = totalError / 4;
        this.averageError = avgError;
        let score = 100 - (avgError / this.tolerance) * 100;
        score = Math.max(0, Math.min(100, score));
        this.matchScore = score;
        this.detectedPose = score > 70 ? this.targetPoseName : "None";
      } else {
        this.averageError = null;
        this.matchScore = 0;
        this.detectedPose = "None";
      }
    },
    getJointAngle(keypoints, partA, partB, partC) {
      const kpA = keypoints.find(k => k.part === partA);
      const kpB = keypoints.find(k => k.part === partB);
      const kpC = keypoints.find(k => k.part === partC);
      if (!kpA || !kpB || !kpC) return null;
      if (kpA.score < 0.5 || kpB.score < 0.5 || kpC.score < 0.5) return null;
      return this.computeAngle(kpA.position, kpB.position, kpC.position);
    },
    computeAngle(A, B, C) {
      const BA = { x: A.x - B.x, y: A.y - B.y };
      const BC = { x: C.x - B.x, y: C.y - B.y };
      const dot = BA.x * BC.x + BA.y * BC.y;
      const magBA = Math.sqrt(BA.x ** 2 + BA.y ** 2);
      const magBC = Math.sqrt(BC.x ** 2 + BC.y ** 2);
      if (magBA === 0 || magBC === 0) return 0;
      const angleRad = Math.acos(dot / (magBA * magBC));
      return angleRad * (180 / Math.PI);
    },
    drawPose(pose) {
      const ctx = this.ctx;
      const canvas = this.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
      pose.keypoints.forEach(keypoint => {
        if (keypoint.score > 0.5) {
          ctx.beginPath();
          ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "#23d5ab";
          ctx.fill();
        }
      });
    }
  }
};
</script>
<!-- later i will try to math out the joints but the lib isnt working idk why-->