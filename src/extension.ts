/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { type ChildProcess, spawn } from "child_process"

// eslint-disable-next-line import/no-unresolved
import { workspace, commands, languages, window } from "vscode"
import { LanguageClient } from "vscode-languageclient/node"
import { HoverRequest, CompletionRequest } from "vscode-languageserver-protocol"

import type { ExtensionContext, TextDocument, OutputChannel } from "vscode"
import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
  DidSaveTextDocumentParams,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node"

let client: LanguageClient
let server: ChildProcess

function startServer(context : ExtensionContext) {
  const config = workspace.getConfiguration("bsclsp")
  const serverCommand: string = config.get("serverCommand") ?? ""

  if (serverCommand) {
    const serverCommandArguments: string[] = []

    const initializationOptions: Object | undefined=
      config.get("initializationOptions") 

    // eslint-disable-next-line @typescript-eslint/require-await
    const serverOptions: ServerOptions = async (): Promise<ChildProcess> => {
      const prepend = ""
      server = spawn(serverCommand, serverCommandArguments, {
        env: {
          ...process.env,
          PATH: prepend.concat(process.env["PATH"] ?? ""),
        },
      })
      void window.showInformationMessage(
        `Started language server: ${serverCommand}`,
      )
      return server
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector: ['bluespec', 'bh'],
      diagnosticCollectionName: "bsc-lsp",
      initializationOptions,
    }

    client = new LanguageClient(
      "bsclsp",
      "BSC LSP Client",
      serverOptions,
      clientOptions,
    )

    void client.start();
  
  }
}

async function killServer(): Promise<void> {
  await client.stop()
  server.kill()
}

export function activate(context: ExtensionContext) {
  startServer(context)


  context.subscriptions.push(
    commands.registerCommand("bsclsp.restartServer", async () => {
      await killServer()
      startServer()
    }),
  )
}

export function deactivate(): Thenable<void> | undefined {
  return killServer()
}
