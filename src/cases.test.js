
import { db } from './firebase';
import '@testing-library/jest-dom/extend-expect';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Mock the Firebase database
jest.mock('./firebase', () => {
  return {
    db: {
      collection: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn(),
    },
  };
});

describe('SOS messages display', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div class="container"></div>`;
  });

  test('renders SOS messages correctly', async () => {
    const mockData = [
      {
        id: '1',
        data: () => ({
          distressType: 'medical',
          callerName: 'John Doe',
          callerNumber: '1234567890',
          callTime: '2023-05-26T12:00:00Z',
          location: { latitude: 50, longitude: 50 },
          voiceNote: 'https://example.com/audio.wav',
          images: ['https://example.com/image1.png', 'https://example.com/image2.png'],
          message: 'This is an SOS, please help',
        }),
      },
    ];

    db.get.mockResolvedValue({
      forEach: (callback) => mockData.forEach(callback),
    });

    require('./cases.js'); 

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(1);

      const distressType = screen.getByText('Distress type: medical');
      expect(distressType).toBeInTheDocument();

      const callerName = screen.getByText('Caller: John Doe');
      expect(callerName).toBeInTheDocument();

      const callerNumber = screen.getByText('Caller number: 1234567890');
      expect(callerNumber).toBeInTheDocument();

      const callTime = screen.getByText(/Call time:/);
      expect(callTime).toHaveTextContent('Call time: 5/26/2023, 12:00:00 PM');

      const location = screen.getByText('Distress location: Latitude 50, Longitude 50');
      expect(location).toBeInTheDocument();

      const voiceNote = screen.getByRole('audio');
      expect(voiceNote).toBeInTheDocument();

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
    });
  });

  test('handles error when fetching SOS messages', async () => {
    console.error = jest.fn(); 
    db.get.mockRejectedValue(new Error('Error fetching SOS messages'));

    require('./cases.js'); 

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching SOS messages: ', expect.any(Error));
    });
  });
});
