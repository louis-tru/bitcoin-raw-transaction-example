const axios = require('axios');
exports.query = ({ method, params }) => {
  //'{"jsonrpc": "1.0", "id":"curltest", "method": "getblock", "params": ["00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09"] }' 
  //console.log(JSON.stringify({ method, params }));
  return new Promise((resolve, reject) => {
    axios({
      url: '/',
      baseURL: 'http://localhost:18443',
      method: 'post',
      auth: {
        username: 'me',
        password: 'mypassword'
      },
      headers: { 'content-type': 'text/plain' },
      data: JSON.stringify({ method, params })
    }).then(response => {
      if (response.data && response.data.result) {
        resolve(response.data.result);
      } else {
        reject(response);
      }
    }).catch(error => {
      resolve(error.response.data.error);
    });
  });
}