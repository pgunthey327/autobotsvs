import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel;
     let disposable = vscode.commands.registerCommand('extension.opencodeGenerator', () => {
        panel = vscode.window.createWebviewPanel(
            'textboxUI', // The internal ID of the webview
            'Generate JS Code', // The title of the webview
            vscode.ViewColumn.One, // Where to show the webview
            {
                enableScripts: true,
                retainContextWhenHidden: true // Allow JavaScript in the webview
            }
        );
        if(panel){
            const reactAppPath = path.join(context.extensionPath,'client','dist','index.html');
            const htmlContent = fs.readFileSync(reactAppPath, 'utf8');
            panel.webview.html =  htmlContent;
            panel.webview.onDidReceiveMessage(
              async (message) => {
                  if (message.type === 'saveFile') {
                    const folder = context.extensionPath;
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(path.join(context.extensionPath, 'saved_files', 'example.txt')),
                        filters: {
                            'Text Files': ['txt'],
                            'All Files': ['*']
                        }
                    }) || {fsPath: ""};
                    // const filePath = folder?.replaceAll("\\","/") + '/myFile.js';  // Define the path and name of the file
                    // Asynchronously write to the file
                    fs.writeFile(uri.fsPath, message.payload, (err) => {
                        if (err) {
                            vscode.window.showErrorMessage('Error saving file: ' + err);
                        } else {
                            vscode.window.showInformationMessage('File saved successfully!');
                        }
                    });
                  }
              },
              undefined,
              context.subscriptions
          );
        }
    });
    context.subscriptions.push(disposable);
}
export function deactivate() {}

