"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const pipelines_1 = __importDefault(require("./routes/pipelines"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const jobs_1 = __importDefault(require("./routes/jobs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/pipelines', pipelines_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/webhook', webhooks_1.default);
app.get('/health', (req, res) => {
    res.send('Server is running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ForgeCI backend listening on port ${PORT}`);
});
