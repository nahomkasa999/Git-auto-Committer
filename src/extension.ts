/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';

process.env.GEMINI_API_KEY = ;

console.log('test 0: Top-level module executed');

export function activate(context: vscode.ExtensionContext) {
    console.log('test 1: activate() called');

    console.log('Congratulations, your extension "esbuild-sample" is now active!');

    const disposable = vscode.commands.registerCommand('esbuild-sample.generateCommitMessage', async () => {
        console.log('test 2: Command triggered');

        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!workspacePath) {
            vscode.window.showErrorMessage('No folder open in VS Code. Open a workspace to use this extension.');
            console.log('test 2.1: No workspace path found');
            return;
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const question = (query: string) => {
            console.log('test 3: question() called');
            return new Promise<string>((resolve) => {
                rl.question(query, (answer) => {
                    resolve(answer);
                });
            });
        };

        if (!process.env.GEMINI_API_KEY) {
            console.log('test 4: GEMINI_API_KEY not defined');
            throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
        }

        console.log('test 5: Initializing GoogleGenerativeAI');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        try {
            console.log('test 6: Checking if inside a git repo');
          execSync('git rev-parse --is-inside-work-tree', { cwd: workspacePath, stdio: 'ignore' });
            vscode.window.showInformationMessage('Git repository detected.');

            console.log("git orgin url", execSync('git config --get remote.origin.url', { cwd: workspacePath }));

            console.log('test 7: Getting diff from staged changes');
            const diff = execSync('git diff', { cwd: workspacePath }).toString();
            console.log('test 7.1: Diff:', diff);

            if (!diff.trim()) {
                vscode.window.showInformationMessage('No staged changes to commit.');
                console.log('test 8: No diff found');
                return;
            }

            console.log('test 9: Calling generateCommitMessage()');
            const result = await generateCommitMessage(diff, genAI);
            const message = result.trim();
            execSync('git add .', { cwd: workspacePath });
            console.log('test 10: Committing with message');
            execSync(`git commit -m "${message}"`, { cwd: workspacePath });
            vscode.window.showInformationMessage(`✅ Committed with message: ${message}`);
        } catch (err) {
            console.log('test 11: Error caught during execution');
            console.log('Error:', err);
            if (err instanceof Error && err.message.includes('fatal: not a git repository')) {
                vscode.window.showErrorMessage('No git repository found. Initializing repository...');
                console.log('test 12: Initializing Git');
                execSync('git init', { cwd: workspacePath });
                execSync('git add .', { cwd: workspacePath });

                const remoteUrl = await question('Please enter the remote URL: ');
                console.log('test 13: Adding remote and pushing');
                execSync(`git remote add origin ${remoteUrl}`, { cwd: workspacePath });
                execSync('git branch -M main', { cwd: workspacePath });
                execSync("git commit -m 'Initial commit'", { cwd: workspacePath });
                execSync('git push -u origin main', { cwd: workspacePath });

                vscode.window.showInformationMessage('✅ Initialized and pushed to remote repository.');
            }
        } finally {
            console.log('test 14: Closing readline');
            rl.close();
        }
    });

    context.subscriptions.push(disposable);
}

async function generateCommitMessage(diff: string, genAI: GoogleGenerativeAI): Promise<string> {
    console.log('test 15: generateCommitMessage() called');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    console.log('test 16: Sending diff to model');
    const result = await model.generateContent([
        'The commit message should be short and to the point, like a git commit message. So that when I see the commit message I would say, "ohhh, this is what I did."',
        diff.slice(0, 10000),
    ]);

    if (!result.response) {
        console.log('test 17: No response from model');
        throw new Error('Failed to generate content: No response received.');
    }

    const response = result.response.text();
    console.log('test 18: Generated commit message:', response);
    return response;
}

export function deactivate() {
    console.log('test 19: deactivate() called');
}
