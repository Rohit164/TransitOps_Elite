"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = void 0;
const errors_js_1 = require("../utils/errors.js");
/**
 * Restricts access to specified roles.
 * Checks the user's role decoded from JWT against the list of allowed roles.
 */
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_js_1.AppError('You must be logged in to access this resource.', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_js_1.AppError('Access denied: You do not have permissions for this action.', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
