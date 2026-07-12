"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_js_1 = require("../utils/errors.js");
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new errors_js_1.AppError('You are not logged in. Please log in to get access.', 401));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'transitops_super_secret_jwt_key_2026_safe_and_long');
        req.user = decoded;
        next();
    }
    catch (err) {
        return next(new errors_js_1.AppError('Invalid or expired token. Please log in again.', 401));
    }
};
exports.protect = protect;
