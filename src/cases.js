import { db } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.container');

  try {
    const sosMessages = await db.collection('sosMessages')
                                .orderBy('callTime', 'desc')
                                .get();

    sosMessages.forEach(doc => {
      const data = doc.data();
      const distressCard = document.createElement('div');
      distressCard.classList.add('distress-card');
      distressCard.innerHTML = `
        <p>Distress type: ${data.distressType}</p>
        <p>Caller: ${data.callerName}</p>
        <p>Caller number: ${data.callerNumber}</p>
        <p>Call time: ${new Date(data.callTime).toLocaleString()}</p>
        <p>Distress location: Latitude ${data.location.latitude}, Longitude ${data.location.longitude}</p>
        <p>Help dispatched: ${data.message}</p>
        <div>
          ${data.voiceNote ? `<audio controls><source src="${data.voiceNote}" type="audio/wav">Your browser does not support the audio element.</audio>` : 'No voice note available'}
        </div>
        <div>
          ${data.images.length ? data.images.map(image => `<img src="${image}" alt="media" style="max-width: 100px;"/>`).join('') : 'No media'}
        </div>
      `;
      container.appendChild(distressCard);
    });
  } catch (error) {
    console.error('Error fetching SOS messages: ', error);
  }
});
