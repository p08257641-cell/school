const axios = require('axios');

async function test() {
  try {
    const url = 'https://schoolgo-j0fv.onrender.com/api/public/report-card/some_token';
    console.log('Fetching:', url);
    const res = await axios.get(url);
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
  }
}
test();
