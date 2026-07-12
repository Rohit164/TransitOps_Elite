"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fleet_controller_js_1 = require("../controllers/fleet.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All fleet routes are protected by JWT
router.use(auth_middleware_js_1.protect);
router.route('/')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DRIVER, client_1.Role.FINANCIAL_ANALYST), fleet_controller_js_1.getAllVehicles)
    .post((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER), fleet_controller_js_1.createVehicle);
router.route('/:id')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DRIVER, client_1.Role.FINANCIAL_ANALYST), fleet_controller_js_1.getVehicle)
    .put((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER), fleet_controller_js_1.updateVehicle)
    .delete((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER), fleet_controller_js_1.deleteVehicle);
exports.default = router;
