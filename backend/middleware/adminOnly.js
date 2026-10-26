module.exports = function (req, res, next) {
  if (
    req.user &&
    (req.user.email === "vsharma6_be23@thapar.edu" ||
      req.user.role === "admin" ||
      req.user.isAdmin === true)
  ) {
    return next();
  }
  return res.status(403).json({ message: "Admin access only: You do not have permission to perform this action." });
};
