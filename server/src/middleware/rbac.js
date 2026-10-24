/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles
 */

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role authorization.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Requires one of: [${roles.join(', ')}].`
      });
    }

    next();
  };
};

module.exports = { authorize };
