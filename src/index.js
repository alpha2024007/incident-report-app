import { db, storage } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


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
    this.voiceNoteURL = null;
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
        this.mediaRecorder.addEventListener('stop', async () => {
          this.voiceBlob = new Blob(this.voiceChunks, { type: 'audio/wav' });
          await this.uploadAudio(this.voiceBlob);
        });
        this.startTimer();
      })
      .catch(error => {
        this.showAlert('Error accessing microphone: ' + error.message);
      });
  }

  async uploadAudio(blob) {
    const fileName = `recordings/${new Date().toISOString()}.wav`;
    const audioRef = ref(storage, fileName);

    try {
      const snapshot = await uploadBytes(audioRef, blob);
      this.voiceNoteURL = await getDownloadURL(snapshot.ref);
      // console.log('File available at', this.voiceNoteURL);
    } catch (error) {
      this.showAlert('Error uploading audio: ' + error.message);
    }
  }

  stopRecording() {
    this.mediaRecorder.stop();
    clearInterval(this.countdownTimer);
    this.timerDisplay.textContent = '00:30';
  }

  startTimer() {
    let timeLeft = 30;
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
      const message = "This is an SOS, please help";
      const distressType = this.distressTypeSelect.value; 

      const imageFiles = Array.from(this.fileInput.files);
      const imageUrls = await this.uploadImages(imageFiles);

      const sosMessage = {
        callTime,
        location,
        voiceNote: this.voiceNoteURL || null,
        message,
        callerName,
        callerNumber,
        images: imageUrls,
        distressType
      };

      // console.log(sosMessage);
      this.sendToFirebase(sosMessage);
    });
  }

  async uploadImages(files) {
    const uploadPromises = files.map(async (file) => {
      const fileName = `images/${new Date().toISOString()}-${file.name}`;
      const imageRef = ref(storage, fileName);

      try {
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (error) {
        this.showAlert('Error uploading image: ' + error.message);
        return null;
      }
    });

    return Promise.all(uploadPromises);
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
