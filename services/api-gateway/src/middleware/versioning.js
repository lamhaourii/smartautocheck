/**
 * API Versioning middleware
 * Extracts version from URL path and attaches to request
 */
const versioningMiddleware = (req, res, next) => {
  // Extract version from path: /api/v1/... or /api/v2/...
  const versionMatch = req.path.match(/^\/api\/(v\d+)\//);
  
  if (versionMatch) {
    req.apiVersion = versionMatch[1];
  } else {
    // Default to v1 if no version specified
    req.apiVersion = 'v1';
  }

  next();
};

/**
 * Version validation middleware
 * Ensures requested API version is supported
 */
const validateVersion = (supportedVersions = ['v1']) => {
  return (req, res, next) => {
    if (!supportedVersions.includes(req.apiVersion)) {
      return res.status(400).json({
        success: false,
        message: `API version ${req.apiVersion} is not supported`,
        supportedVersions
      });
    }
    next();
  };
};

module.exports = {
  versioningMiddleware,
  validateVersion
};
