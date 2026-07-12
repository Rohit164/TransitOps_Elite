"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trip_controller_js_1 = require("../controllers/trip.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.protect);
router.route('/')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DRIVER, client_1.Role.SAFETY_OFFICER), trip_controller_js_1.getAllTrips)
    .post((0, rbac_middleware_js_1.restrictTo)(client_1.Role.DRIVER), trip_controller_js_1.createTrip);
router.route('/:id')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.DRIVER, client_1.Role.SAFETY_OFFICER), trip_controller_js_1.getTrip);
router.post('/:id/dispatch', (0, rbac_middleware_js_1.restrictTo)(client_1.Role.DRIVER), trip_controller_js_1.dispatchTrip);
router.post('/:id/complete', (0, rbac_middleware_js_1.restrictTo)(client_1.Role.DRIVER), trip_controller_js_1.completeTrip);
exports.default = router;
