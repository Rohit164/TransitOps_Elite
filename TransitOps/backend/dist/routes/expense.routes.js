"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expense_controller_js_1 = require("../controllers/expense.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.protect);
router.get('/stats', (0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.FINANCIAL_ANALYST), expense_controller_js_1.getOperationalCosts);
router.route('/')
    .get((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FLEET_MANAGER, client_1.Role.FINANCIAL_ANALYST), expense_controller_js_1.getAllExpenses)
    .post((0, rbac_middleware_js_1.restrictTo)(client_1.Role.FINANCIAL_ANALYST), expense_controller_js_1.createExpense);
exports.default = router;
