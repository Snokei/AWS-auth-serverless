const app = require('./src/app');
const config = require('./src/config');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  console.log(`🔒 JWT Secret initialized`);
  console.log(`⚡ Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});
