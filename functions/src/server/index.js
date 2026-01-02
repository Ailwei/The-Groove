"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const route_1 = __importDefault(require("./routes/route"));
const expireGrooves_1 = require("./utils/expireGrooves");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", route_1.default);
setInterval(async () => {
    try {
        await (0, expireGrooves_1.deleteExpiredGrooves)();
    }
    catch (error) {
        console.error("Failed to delete expired grooves:", error);
    }
}, 10 * 1000);
// app.listen(3000, () => console.log("Server running on port 3000"));
exports.default = app;
