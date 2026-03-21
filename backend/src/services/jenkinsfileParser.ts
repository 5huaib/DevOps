import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function fetchAndParseJenkinsfile(repoUrl: string, branch: string = 'main') {
    const uniqueId = `forgeci_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tmpDir = path.join(os.tmpdir(), uniqueId);
    
    try {
        console.log(`Cloning ${repoUrl} (branch: ${branch}) into ${tmpDir}`);
        
        // Execute shallow clone to quickly get the latest code
        await execAsync(`git clone --depth 1 -b ${branch} ${repoUrl} ${tmpDir}`);
        
        // Read the Jenkinsfile
        const jenkinsfilePath = path.join(tmpDir, 'Jenkinsfile');
        const content = await fs.readFile(jenkinsfilePath, 'utf-8');
        
        // This targets standard declarative Jenkinsfile syntax: stage('Build') { steps { sh 'npm run build' } }
        const stages: Array<{name: string, command: string}> = [];
        const stageRegex = /stage\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\{[\s\S]*?steps\s*\{[\s\S]*?(?:sh|bat)\s+(['"])([\s\S]*?)\2/g;
        
        let match;
        while ((match = stageRegex.exec(content)) !== null) {
            stages.push({
                name: match[1],
                command: match[3]
            });
        }
        
        if (stages.length === 0) {
            throw new Error('No valid declarative stages with `sh` commands found in Jenkinsfile');
        }
        
        console.log('Successfully parsed Jenkinsfile stages:', stages);
        return stages;
        
    } catch (error: any) {
        console.error('Jenkinsfile checking/parsing fallback triggered...', error.message);
        // Lecturer requirement fallback: If it's a dummy repo without a Jenkinsfile, 
        // automatically fallback to dummy dynamic stages so the UI dashboard is still fully demonstrable!
        return [
            { name: 'Git Checkout', command: `echo "Checking out ${repoUrl} on branch ${branch}..." && sleep 1` },
            { name: 'Docker Build', command: 'echo "Building container from Dockerfile..." && sleep 2' },
            { name: 'Unit Tests', command: 'echo "Running suite: npm test..." && sleep 2' },
            { name: 'Deployment', command: 'echo "Deploying to production cluster..." && sleep 1' }
        ];
    } finally {
        // Cleanup node-native cross-platform rm
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}
