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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPipeline = startPipeline;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execAsync = util_1.default.promisify(child_process_1.exec);
const prisma = new client_1.PrismaClient();
function startPipeline(pipelineId, repoUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stages = [
                { name: 'build', command: 'echo "Building project from ' + repoUrl + '..." && node -e "setTimeout(() => console.log(\'Build complete\'), 2000)"' },
                { name: 'test', command: 'echo "Running tests..." && node -e "setTimeout(() => console.log(\'All tests passed\'), 2000)"' },
                { name: 'deploy', command: 'echo "Deploying application..." && node -e "setTimeout(() => console.log(\'Deployment successful\'), 2000)"' }
            ];
            for (const stage of stages) {
                const job = yield prisma.job.create({
                    data: {
                        pipelineId,
                        stageName: stage.name,
                        status: 'running',
                        startedAt: new Date()
                    }
                });
                try {
                    const { stdout, stderr } = yield execAsync(stage.command);
                    const logs = stdout + (stderr ? '\nERRORS:\n' + stderr : '');
                    yield prisma.job.update({
                        where: { id: job.id },
                        data: { status: 'success', logs, endedAt: new Date() }
                    });
                }
                catch (error) {
                    const logs = error.stdout + '\n' + error.stderr + '\n' + error.message;
                    yield prisma.job.update({
                        where: { id: job.id },
                        data: { status: 'failed', logs, endedAt: new Date() }
                    });
                    yield prisma.pipeline.update({
                        where: { id: pipelineId },
                        data: { status: 'failed', endedAt: new Date() }
                    });
                    return; // Stop pipeline on failure
                }
            }
            yield prisma.pipeline.update({
                where: { id: pipelineId },
                data: { status: 'success', endedAt: new Date() }
            });
        }
        catch (error) {
            console.error('JobRunner Error:', error);
            yield prisma.pipeline.update({
                where: { id: pipelineId },
                data: { status: 'failed', endedAt: new Date() }
            });
        }
    });
}
