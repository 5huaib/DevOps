"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/:pipelineId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pipelineId } = req.params;
    try {
        const jobs = yield prisma.job.findMany({
            where: { pipelineId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
}));
router.post('/ai-analyze', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { logs } = req.body;
    if (!logs)
        return res.status(400).json({ error: 'Logs are required for AI analysis' });
    // Simulated AI response
    setTimeout(() => {
        let suggestion = "Review the logs carefully. Some dependencies might be missing or tests are failing due to syntax errors.";
        if (logs.includes('npm install') || logs.includes('missing')) {
            suggestion = "Error: dependency missing. \n\nAI Suggestion:\nRun `npm install` to ensure all required packages are present before building.";
        }
        else if (logs.includes('test')) {
            suggestion = "Error: test failure detected. \n\nAI Suggestion:\nCheck the failing test cases. It seems a recent code change broke the expected assertions.";
        }
        res.json({ suggestion });
    }, 1500); // simulate network delay
}));
exports.default = router;
