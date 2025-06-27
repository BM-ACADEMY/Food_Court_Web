const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('./redisClient');

const createRateLimiter = ({ points = 20, duration = 60, keyPrefix = 'rl' }) => {
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points,     // Number of requests
    duration,   // Per duration in seconds
  });

  return (req, res, next) => {
    const identifier = req.ip; // Or use req.user.id if authenticated

    rateLimiter.consume(identifier)
      .then(() => {
        next(); // Pass request
      })
      .catch((rejRes) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later. 1 minute',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000) + 's',
        });
      });
  };
};

module.exports = createRateLimiter;
