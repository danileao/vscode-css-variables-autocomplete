/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from "vscode";
// import { promises as fs, PathLike } from 'fs';
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

let filesCollection: string[] = [];
const directoriesToSkip = [
  "bower_components",
  "node_modules",
  "www",
  "platforms",
];

function readDirectorySynchronously(directory: string) {
  const currentDirectorypath = path.join(directory);

  const currentDirectory = fs.readdirSync(currentDirectorypath, "utf8");

  currentDirectory.forEach((file) => {
    const fileShouldBeSkipped = directoriesToSkip.indexOf(file) > -1;
    const pathOfCurrentItem = path.join(directory + path.sep + file);
    if (!fileShouldBeSkipped && fs.statSync(pathOfCurrentItem).isFile()) {
      filesCollection.push(pathOfCurrentItem);
    } else if (!fileShouldBeSkipped) {
      const directorypath = path.join(directory + path.sep + file);
      console.log(directorypath);
      readDirectorySynchronously(directorypath);
    }
  });
  console.log(filesCollection);
}

let arrayVariables: string[] = [];
const reading = async (rl: any) => {
  try {
    for await (const line of rl) {
      if (line.trim().startsWith("--")) {
        const [variable, _] = line.split(":");
        arrayVariables.push(variable.trim());
      }
    }
    return Promise.all(arrayVariables);
  } catch (e) {
    console.log(e.stack);
  }
};

export function activate(context: vscode.ExtensionContext) {
  const provider1 = vscode.languages.registerCompletionItemProvider(
    [
      "plaintext",
      "typescript",
      "typescriptreact",
      "javascript",
      "javascriptreact",
      "css",
      "scss",
      "less",
    ],
    {
      async provideCompletionItems() {
        const workspaceFolder = vscode.workspace.workspaceFolders || [];
        const folderPath = workspaceFolder[0].uri.toString().split(":")[1];
        console.log("Dirname", folderPath);
        readDirectorySynchronously(folderPath);

        const colors: vscode.CompletionItem[] = [];

        for await (const variable of filesCollection) {
          const readable = fs.createReadStream(variable);
          const rl = readline.createInterface({
            input: readable,
          });

          reading(rl).then((resolve) => console.log(resolve));
        }
        for await (const color of arrayVariables) {
          colors.push(new vscode.CompletionItem(color));
        }

        arrayVariables = [];
        filesCollection = [];

        return colors;
      },
    }
  );

  context.subscriptions.push(provider1);
}
