const http = require('http');

async function triggerAnalysis() {
  console.log("🚀 Triggering ultra-thorough analysis for video 95...");
  
  const postData = JSON.stringify({
    forceReanalysis: true
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/audios/95/analyze',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      // Add session cookie for admin authentication
      'Cookie': 'connect.sid=s%3AjVxQzGzPtGFOBSDmxRzfNr2rCPnwGH_8.JMSuWAqpR4hDfBN9c4k9cCKePqMLvh3YdJGjV6ot3z8'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Response status: ${res.statusCode}`);
        console.log(`📝 Response: ${data}`);
        
        if (res.statusCode === 202) {
          console.log("✅ Ultra-thorough analysis triggered successfully!");
          console.log("🎯 The system will now:");
          console.log("   - Perform comprehensive multi-AI analysis");
          console.log("   - Populate ALL 9 feedback sections");
          console.log("   - Use persistent loops until complete");
          console.log("   - Eliminate placeholder content");
          console.log("\n⏳ Processing will take 2-3 minutes...");
        } else if (res.statusCode === 401) {
          console.log("❌ Authentication failed - need valid session");
        }
        
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

triggerAnalysis().catch(console.error);