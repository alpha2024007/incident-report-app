import { jest } from '@jest/globals';
import SOSForm from './index.js';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Mock firebase
jest.mock('firebase/app');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('firebase/storage', () => {
  const originalModule = jest.requireActual('firebase/storage');
  return {
    ...originalModule,
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
  };
});

describe('SOSForm', () => {
  let sosForm;

  beforeEach(() => {
    // Mock the DOM elements
    document.body.innerHTML = `
      <div class="container">
        <div class="card">
          <form>
            <input type="text" placeholder="Enter your name" />
            <input type="text" placeholder="Enter your phone number" />
            <input type="file" placeholder="Upload media" multiple />
          </form>
          <div class="audio">
            <div class="countdown">15:00</div>
            <div class="audio-btn"></div>
            <p>Record audio</p>
          </div>
          <div class='distress-type'>
            <label for="sos-type">Distress Type:</label>
            <select id="sos-type">
              <option value="medical">Medical</option>
              <option value="security">Security</option>
            </select>
          </div>
          <button class="send">Send</button>
        </div>
      </div>
    `;

    // Initialize the SOSForm instance
    sosForm = new SOSForm();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should start and stop recording when the record button is clicked', () => {
    const mockGetUserMedia = jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });

    navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia,
    };

    const recordButton = document.querySelector('.audio-btn');
    recordButton.click(); // Start recording

    expect(mockGetUserMedia).toHaveBeenCalled();

    const mediaRecorderMock = {
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn((event, callback) => {
        if (event === 'dataavailable') callback({ data: 'audio data' });
        if (event === 'stop') callback();
      }),
    };

    window.MediaRecorder = jest.fn().mockImplementation(() => mediaRecorderMock);

    recordButton.click(); // Stop recording

    expect(mediaRecorderMock.stop).toHaveBeenCalled();
  });

  test('should fetch user location successfully', async () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        Promise.resolve(success({ coords: { latitude: 50, longitude: 50 } }))
      ),
    };

    global.navigator.geolocation = mockGeolocation;

    const location = await sosForm.getUserLocation();

    expect(location).toEqual({ latitude: 50, longitude: 50 });
  });

  test('should handle geolocation errors', async () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success, error) =>
        Promise.resolve(error())
      ),
    };

    global.navigator.geolocation = mockGeolocation;

    await expect(sosForm.getUserLocation()).rejects.toThrow('Unable to retrieve location');
  });

  test('should send SOS message to Firebase', async () => {
    const mockAdd = jest.fn().mockResolvedValue({});
    const mockFirestore = {
      collection: jest.fn(() => ({
        add: mockAdd,
      })),
    };

    firebase.firestore.mockReturnValue(mockFirestore);

    const mockUploadBytes = jest.fn().mockResolvedValue({
      ref: {
        getDownloadURL: jest.fn().mockResolvedValue('http://firebase.storage/download-url')
      }
    });

    const sendButton = document.querySelector('.send');

    // Mock user inputs
    sosForm.nameInput.value = 'John Doe';
    sosForm.phoneNumberInput.value = '1234567890';
    const file = new File(['file content'], 'file.png', { type: 'image/png' });
    Object.defineProperty(sosForm.fileInput, 'files', { value: [file] });
    sosForm.voiceBlob = new Blob(['audio data'], { type: 'audio/wav' });
    sosForm.distressTypeSelect.value = 'medical';

    // Mock location
    jest.spyOn(sosForm, 'getUserLocation').mockResolvedValue({ latitude: 50, longitude: 50 });

    // Mock Firebase Storage methods
    ref.mockReturnValue({});
    uploadBytes.mockImplementation((ref, file) => mockUploadBytes(ref, file));
    getDownloadURL.mockImplementation(() => Promise.resolve('http://firebase.storage/download-url'));

    sendButton.click();

    await new Promise(process.nextTick);

    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
      callerName: 'John Doe',
      callerNumber: '1234567890',
      location: { latitude: 50, longitude: 50 },
      distressType: 'medical',
      voiceNote: 'http://firebase.storage/download-url',
      images: ['http://firebase.storage/download-url'],
    }));
  });

  test('should handle Firebase errors', async () => {
    const mockAdd = jest.fn().mockRejectedValue(new Error('Firebase error'));
    const mockFirestore = {
      collection: jest.fn(() => ({
        add: mockAdd,
      })),
    };

    firebase.firestore.mockReturnValue(mockFirestore);

    const mockUploadBytes = jest.fn().mockRejectedValue(new Error('Firebase storage error'));

    const sendButton = document.querySelector('.send');

    // Mock user inputs
    sosForm.nameInput.value = 'John Doe';
    sosForm.phoneNumberInput.value = '1234567890';
    const file = new File(['file content'], 'file.png', { type: 'image/png' });
    Object.defineProperty(sosForm.fileInput, 'files', { value: [file] });
    sosForm.voiceBlob = new Blob(['audio data'], { type: 'audio/wav' });
    sosForm.distressTypeSelect.value = 'medical';

    // Mock location
    jest.spyOn(sosForm, 'getUserLocation').mockResolvedValue({ latitude: 50, longitude: 50 });

    jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock Firebase Storage methods
    ref.mockReturnValue({});
    uploadBytes.mockImplementation((ref, file) => mockUploadBytes(ref, file));
    getDownloadURL.mockImplementation(() => Promise.reject(new Error('Firebase storage error')));

    sendButton.click();

    await new Promise(process.nextTick);

    expect(window.alert).toHaveBeenCalledWith('An error occurred sending your message: Firebase error');
  });
});
