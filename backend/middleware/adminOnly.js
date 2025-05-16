module.exports = function (req, res, next) {
  // req.user should be set by verifyToken middleware
  if (req.user && req.user.email === "vsharma6_be23@thapar.edu") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};
