import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel;
     let disposable = vscode.commands.registerCommand('extension.opencodeGenerator', () => {
        panel = vscode.window.createWebviewPanel(
            'textboxUI', // The internal ID of the webview
            'Textbox UI', // The title of the webview
            vscode.ViewColumn.One, // Where to show the webview
            {
                enableScripts: true, // Allow JavaScript in the webview
            }
        );
        if(panel){
            panel.webview.html = getWebviewContent();
            panel.webview.onDidReceiveMessage(
                message => {
                  switch (message.command) {
                    case 'copyAndPasteValue':
                      // Trigger the command to paste the value in the editor
                      vscode.commands.executeCommand('extension.copyAndPasteValue', message.value);
                      return;
                  }
                },
                undefined,
                context.subscriptions
              );
        } 
    });

    function closeWebview() {
        if (panel) {
            panel.dispose(); // Dispose of the webview to close it
        }
    }

    
    const editor1 = vscode.window.activeTextEditor;
    const copyAndPasteValueCommand = vscode.commands.registerCommand('extension.copyAndPasteValue', async (valueToCopy: string) => {
    // Close the webview (if it's open)
    if (editor1) {
        const uri = editor1.document.uri;
        // Try to reopen the document
        await vscode.window.showTextDocument(uri, { preview: false }).then(newEditor => {
            insertTextAtPosition(newEditor, valueToCopy);
        });
        closeWebview();
    }

        // Helper function to insert text at the current cursor position
    function insertTextAtPosition(editor: vscode.TextEditor, text: string) {
        const position = editor.selection.active;  // Get the current cursor position
        editor.edit((editBuilder: { insert: (arg0: any, arg1: any) => void; }) => {
            editBuilder.insert(position, text); // Insert the copied text at the cursor position
        }).then((success: any) => {
            if (success) {
                vscode.window.showInformationMessage('Code Generated successfully!');
            } else {
                vscode.window.showErrorMessage('Failed to insert text.');
            }
        });
    }
    });


    

    context.subscriptions.push(disposable, copyAndPasteValueCommand);
}

export function deactivate() {}

function getWebviewContent() {

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grid Layout</title>
    <style>
        /* Ensure the body and html take up the full height */
        html, body {
            height: 100%;
            margin: 0;
        }

        /* Grid container */
        .grid-container {
            display: grid;
            height: 100%; /* Full window height */
            grid-template-columns: 80% 20%; /* 80% for the first column, 20% for the second column */
            grid-template-rows: 100%; /* Full height for rows */
        }

        /* Column 1 style (takes 80% of the width) */
        .column-1 {
            background-color: #f4f4f4; /* Light grey background */
            padding: 20px;
        }

        /* Column 2 style (takes 20% of the width) */
        .column-2 {
            background-color: #e0e0e0; /* Darker grey background */
            padding: 20px;
        }
        .heading {
            height: 30px;
            border-bottom: 1px solid grey;
        }
        .output {
            height: 70%;
            width: 100%
        }
        .functionrow {
            margin-bottom: 10px;
            display: flex;
        }
        .parameterrow {
            display: inline-flex;
            margin-bottom: 10px;
        }
        .outparamrow {
            margin-bottom: 10px;
            display: flex;
        }
        .parameterButton{
            margin-right: 10px;
        }
        .textbox-container {
            margin-top: 10px;
            margin-bottom: 10px;
        }
        .textbox-container input {
            margin-right: 10px;
        }
    </style>
    <script>
        function generateCode(){
            var definition = document.getElementById("definition");
            var functionName = document.getElementById("functionInput");
            var outparam = document.getElementById("outparam");
            var container = document.getElementById("textbox-list");
            var textboxes = container.getElementsByClassName("parameterTextbox");

            let params = [];
            if (textboxes.length > 0) {
                for(let i=0;i<textboxes.length;i++) {
                    params.push(textboxes[i].value);
                };
            }
            let parameters = params.toString();
            definition.value = "const " + functionName.value + " = ("+ parameters+ ") => { \\n return "+outparam.value+"; \\n }";
        }

        function addTextbox() {
            // Get the container where the textboxes will be added
            var container = document.getElementById("textbox-list");

            // Create a new div to hold the new textbox
            var newTextboxDiv = document.createElement("div");
            newTextboxDiv.className = "textbox-container";

            // Create the new input element (textbox)
            var newTextbox = document.createElement("input");
            newTextbox.type = "text";
            newTextbox.placeholder = "parameter";
            newTextbox.style="width:150px";
            newTextbox.className="parameterTextbox"
            newTextbox.addEventListener("input", function(){
                generateCode();
            })
            // Append the textbox to the new div
            newTextboxDiv.appendChild(newTextbox);

            // Append the new div to the container
            container.appendChild(newTextboxDiv);
        }

        // Function to remove the last textbox
        function removeTextbox() {
            // Get the container where the textboxes are located
            var container = document.getElementById("textbox-list");

            // Get all the textboxes within the container
            var textboxes = container.getElementsByClassName("textbox-container");

            // If there are any textboxes, remove the last one
            if (textboxes.length > 0) {
                container.removeChild(textboxes[textboxes.length - 1]);
                generateCode();
            } 
        }
        
        const copyCode = () => {
            const vscode = acquireVsCodeApi();
                    const valueToCopy = document.getElementById("definition").value;
                    vscode.postMessage({
                        command: 'copyAndPasteValue',
                        value: valueToCopy
                    });
                    };
    </script>
</head>
<body>
    <div class="grid-container">
        <div class="column-1">
            <h1 class="heading">Inputs</h1>
            <div class="functionrow">
                <label for="functionInput" style="display:block;width:150px">Function Name</label>
                <input type="text" id="functionInput" style="width:150px" oninput="generateCode()" placeholder="function name"></input>
            </div>
            <div class="parameterrow">
                <label for="functionParameters" style="display:block;width:150px">FunctionParameters</label>
                    <!-- Buttons to add and remove textboxes -->
                     <div class="parameterButton">
                        <button onclick="addTextbox()" style="width:75px">Add</button>
                        <button onclick="removeTextbox()" style="width:75px">Remove</button>
    
                        <div id="textbox-list" style="max-height: 200px; overflow-y: scroll;">
                            <!-- New textboxes will be added here -->
                        </div>
                     </div>
                    
            </div>
            <div class="outparamrow">
                <label for="outparam" style="display:block;width:150px">Function Output</label>
                <input type="text" id="outparam" style="width:150px" oninput="generateCode()" placeholder="function output"></input>
            </div>
            <button id="copyButton" onclick="copyCode()">Generate and Paste Code</button>
        </div>
        <div class="column-2">
            <h1 class="heading">Definition</h1>
            <textarea id="definition" class="output" type="text"></textarea>
        </div>

    </div>
</body>
</html>
`;
}
