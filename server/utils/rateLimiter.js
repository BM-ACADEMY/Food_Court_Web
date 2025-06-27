const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redisClient } = require('./redisClient');

const createRateLimiter = ({ points = 5, duration = 60, keyPrefix = 'rl' }) => {
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points,
    duration,
  });

  return (req, res, next) => {
    // Fix for IPv6 addresses like ::ffff:127.0.0.1
    const identifier = req.ip.includes('::ffff:')
      ? req.ip.split('::ffff:')[1]
      : req.ip;

    rateLimiter.consume(identifier)
      .then(() => next())
      .catch((rejRes) => {
        const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 60;
        res.status(429).json({
          success: false,
          message: `Too many requests. Please try again later. ${retrySecs}s`,
          retryAfter: `${retrySecs}s`,
        });
      });
  };
};

module.exports = createRateLimiter;
