const fs = require('fs');
const path = require('path');

const config = {
  port: 443,
  httpsOptions: {
    key: fs.readFileSync('/etc/letsencrypt/live/vballone.zrhan.top/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/vballone.zrhan.top/fullchain.pem')
  }
};

module.exports = config; 