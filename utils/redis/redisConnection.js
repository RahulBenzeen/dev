const { Client } = require('@elastic/elasticsearch');
const redis = require('redis');

// Load environment variables (from Docker)
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const esHost = process.env.ES_HOST || 'http://localhost:9200';

// Connect to Redis
const redisClient = redis.createClient({
  socket: { host: redisHost, port: redisPort },
});
redisClient.connect();

redisClient.on('connect', () => console.log('✅ Redis Connected!'));
redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

// Connect to Elasticsearch
const esClient = new Client({ node: esHost });

module.exports = { esClient, redisClient };
