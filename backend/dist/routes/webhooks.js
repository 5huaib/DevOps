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
const jobRunner_1 = require("../services/jobRunner");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/:projectId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        const project = yield prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Create a new pipeline
        const pipeline = yield prisma.pipeline.create({
            data: {
                projectId,
                triggerType: 'webhook',
                status: 'running',
                startedAt: new Date(),
            }
        });
        // Start pipeline asynchronously (don't block the webhook response)
        (0, jobRunner_1.startPipeline)(pipeline.id, project.repoUrl).catch(console.error);
        res.json({ message: 'Pipeline triggered successfully', pipelineId: pipeline.id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
}));
exports.default = router;
