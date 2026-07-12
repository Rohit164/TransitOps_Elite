"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_js_1 = require("../controllers/settings.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.protect);
// Password change endpoint is accessible to any logged-in user
router.post('/change-password', settings_controller_js_1.changePassword);
// User and RBAC management is strictly for Fleet Manager
router.use((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER));
router.route('/users')
    .get(settings_controller_js_1.getAllUsers)
    .post(settings_controller_js_1.createUser);
router.patch('/users/:id/role', settings_controller_js_1.updateUserRole);
exports.default = router;
