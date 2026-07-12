"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routers
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const fleet_routes_js_1 = __importDefault(require("./routes/fleet.routes.js"));
const driver_routes_js_1 = __importDefault(require("./routes/driver.routes.js"));
const trip_routes_js_1 = __importDefault(require("./routes/trip.routes.js"));
const maintenance_routes_js_1 = __importDefault(require("./routes/maintenance.routes.js"));
const expense_routes_js_1 = __importDefault(require("./routes/expense.routes.js"));
const analytics_routes_js_1 = __importDefault(require("./routes/analytics.routes.js"));
const settings_routes_js_1 = __importDefault(require("./routes/settings.routes.js"));
// Import error utilities
const errors_js_1 = require("./utils/errors.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Enable CORS - allow all origins so frontend (file:// or any dev port) can connect
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Parse incoming JSON requests
app.use(express_1.default.json());
// API Base Health check
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'TransitOps ERP REST API is active and running',
        version: '1.0.0',
        timestamp: new Date(),
        frontendUrl: 'http://localhost:5173/'
    });
});
app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'TransitOps REST API Directory',
        frontend: 'http://localhost:5173/',
        endpoints: {
            auth: '/api/auth (POST /login, POST /signup)',
            fleet: '/api/fleet (GET, POST)',
            drivers: '/api/drivers (GET, POST)',
            trips: '/api/trips (GET, POST, PATCH /dispatch, PATCH /complete)',
            maintenance: '/api/maintenance (GET, POST, PATCH /status)',
            expenses: '/api/expenses (GET, POST)',
            analytics: '/api/analytics (GET)',
            settings: '/api/settings (GET, PUT)'
        }
    });
});
// Mount routers
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/fleet', fleet_routes_js_1.default);
app.use('/api/drivers', driver_routes_js_1.default);
app.use('/api/trips', trip_routes_js_1.default);
app.use('/api/maintenance', maintenance_routes_js_1.default);
app.use('/api/expenses', expense_routes_js_1.default);
app.use('/api/analytics', analytics_routes_js_1.default);
app.use('/api/settings', settings_routes_js_1.default);
// Catch-all route for undefined endpoints
app.all('*', (req, res, next) => {
    next(new errors_js_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Centralized error handling middleware
app.use(errors_js_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`[Server] TransitOps backend started successfully on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Local URL: http://localhost:${PORT}`);
});
