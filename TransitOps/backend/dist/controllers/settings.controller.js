"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.changePassword = exports.createUser = exports.getAllUsers = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const database_js_1 = __importDefault(require("../config/database.js"));
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const getAllUsers = async (req, res, next) => {
    try {
        const users = await database_js_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            status: 'success',
            data: { users }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name || !role) {
            return next(new errors_js_1.AppError('Please provide email, password, name, and role', 400));
        }
        // Validate role
        if (!Object.values(client_1.Role).includes(role)) {
            return next(new errors_js_1.AppError('Invalid role specified', 400));
        }
        // Check unique email
        const existingUser = await database_js_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return next(new errors_js_1.AppError('User with that email already exists', 400));
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await database_js_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role
            }
        });
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createUser = createUser;
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return next(new errors_js_1.AppError('Please provide currentPassword and newPassword', 400));
        }
        if (!req.user) {
            return next(new errors_js_1.AppError('Not authenticated', 401));
        }
        // Get user with password
        const user = await database_js_1.default.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            return next(new errors_js_1.AppError('User no longer exists', 404));
        }
        // Match password
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return next(new errors_js_1.AppError('Incorrect current password', 401));
        }
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await database_js_1.default.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword }
        });
        res.status(200).json({
            status: 'success',
            message: 'Password successfully changed!'
        });
    }
    catch (err) {
        next(err);
    }
};
exports.changePassword = changePassword;
const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
            return next(new errors_js_1.AppError('Please provide a role', 400));
        }
        if (!Object.values(client_1.Role).includes(role)) {
            return next(new errors_js_1.AppError('Invalid role specified', 400));
        }
        const user = await database_js_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            return next(new errors_js_1.AppError('User not found', 404));
        }
        // Prevent changing own role (to avoid lockouts)
        if (req.user && req.user.id === id) {
            return next(new errors_js_1.AppError('You cannot change your own role to prevent system lockout.', 400));
        }
        const updatedUser = await database_js_1.default.user.update({
            where: { id },
            data: { role: role }
        });
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    role: updatedUser.role
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUserRole = updateUserRole;
