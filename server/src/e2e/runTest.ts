import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import * as fs from 'fs';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        const extensionTestsPath = path.resolve(__dirname, './out/suite/index');
        
        const testWorkspace = path.resolve(__dirname, '../../test-workspace');
        console.log('Test workspace path:', testWorkspace);
        
        await fs.promises.mkdir(testWorkspace, { recursive: true });
        
        console.log('Building extension...');
        require('child_process').execSync('npm run build', {
            cwd: extensionDevelopmentPath,
            stdio: 'inherit'
        });
        
        console.log('Running tests...');
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                testWorkspace,
                '--enable-proposed-api=ton-core.tact-vscode'
            ]
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main(); 