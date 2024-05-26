// import 'bootstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';
import './css/styles.css';
// import {db} from './firebase.js'


class BaseComponent {
  constructor() {
    this.getElements();
  }

  getElements() {
    this.nameInput = document.querySelector('.container .card form input[type="text"]:nth-child(1)');
    this.phoneNumberInput = document.querySelector('.container .card form input[type="text"]:nth-child(2)');
    this.fileInput = document.querySelector('.container .card form input[type="file"]');
    this.recordButton = document.querySelector('.container .card .audio-btn');
    this.sendButton = document.querySelector('.container .card .send');
    this.timerDisplay = document.querySelector('.container .card .countdown');
    this.distressTypeSelect = document.querySelector('#sos-type');
  }

  showAlert(message) {
    alert(message);
  }
}

class RecordingComponent extends BaseComponent {
  constructor() {
    super();
    this.mediaRecorder = null;
    this.voiceChunks = [];
    this.voiceBlob = null;
    this.countdownTimer = null;
    this.initRecording();
  }

  initRecording() {
    this.recordButton.addEventListener('click', () => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.voiceChunks = [];
        this.mediaRecorder.addEventListener('dataavailable', event => {
          this.voiceChunks.push(event.data);
        });
        this.mediaRecorder.addEventListener('stop', () => {
          this.voiceBlob = new Blob(this.voiceChunks, { type: 'audio/wav' });
        });
        this.startTimer();
      })
      .catch(error => {
        this.showAlert('Error accessing microphone: ' + error.message);
      });
  }

  stopRecording() {
    this.mediaRecorder.stop();
    clearInterval(this.countdownTimer);
    this.timerDisplay.textContent = '15:00';
  }

  startTimer() {
    let timeLeft = 15 * 60;
    this.timerDisplay.textContent = this.formatTime(timeLeft);
    this.countdownTimer = setInterval(() => {
      timeLeft -= 1;
      this.timerDisplay.textContent = this.formatTime(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(this.countdownTimer);
        this.stopRecording();
      }
    }, 1000);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
}

class SOSForm extends RecordingComponent {
  constructor() {
    super();
    this.initForm();
  }

  initForm() {
    this.sendButton.addEventListener('click', async () => {
      const callTime = new Date().toISOString();
      const location = await this.getUserLocation();
      const callerName = this.nameInput.value;
      const callerNumber = this.phoneNumberInput.value;
      const images = Array.from(this.fileInput.files).map(file => URL.createObjectURL(file));
      const message = "This is an SOS, please help";
      const distressType = this.distressTypeSelect.value; 

      const sosMessage = {
        callTime,
        location,
        voiceNote: this.voiceBlob ? URL.createObjectURL(this.voiceBlob) : null,
        message,
        callerName,
        callerNumber,
        images,
        distressType
      };

      // this.sendToFirebase(sosMessage);
      console.log(sosMessage)
    });
  }

  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        }, () => {
          reject(new Error('Unable to retrieve location'));
        });
      } else {
        reject(new Error('Geolocation not supported by this browser'));
      }
    });
  }

  sendToFirebase(sosMessage) {
    const db = firebase.firestore();
    db.collection('sosMessages').add(sosMessage)
      .then(() => {
        this.showAlert('SOS sent successfully');
      })
      .catch(error => {
        this.showAlert('An error occurred sending your message: ' + error.message);
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SOSForm();
});