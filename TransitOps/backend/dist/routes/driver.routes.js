"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_js_1 = require("../controllers/driver.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Protect all driver routes
router.use(auth_middleware_js_1.protect);
router.route('/')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DISPATCHER, client_1.Role.SAFETY_OFFICER), driver_controller_js_1.getAllDrivers)
    .post((0, rbac_middleware_js_1.restrictTo)(client_1.Role.SAFETY_OFFICER), driver_controller_js_1.createDriver);
router.route('/:id')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DISPATCHER, client_1.Role.SAFETY_OFFICER), driver_controller_js_1.getDriver)
    .put((0, rbac_middleware_js_1.restrictTo)(client_1.Role.SAFETY_OFFICER), driver_controller_js_1.updateDriver)
    .delete((0, rbac_middleware_js_1.restrictTo)(client_1.Role.SAFETY_OFFICER), driver_controller_js_1.deleteDriver);
exports.default = router;
