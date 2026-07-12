"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenance_controller_js_1 = require("../controllers/maintenance.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.protect);
router.route('/')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DISPATCHER, client_1.Role.FINANCIAL_ANALYST), maintenance_controller_js_1.getAllMaintenance)
    .post((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER), maintenance_controller_js_1.createMaintenance);
router.post('/:id/complete', (0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER), maintenance_controller_js_1.completeMaintenance);
exports.default = router;
