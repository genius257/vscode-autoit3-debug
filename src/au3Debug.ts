import * as vscode from 'vscode';
import {
	DebugSession, OutputEvent, TerminatedEvent,
	/*InitializedEvent, TerminatedEvent, StoppedEvent, BreakpointEvent, OutputEvent,
	ProgressStartEvent, ProgressUpdateEvent, ProgressEndEvent, InvalidatedEvent,
	Thread, StackFrame, Scope, Source, Handles, Breakpoint, MemoryEvent*/
} from '@vscode/debugadapter';
import { DebugProtocol as VSCodeDebugProtocol } from '@vscode/debugprotocol'
import * as childProcess from 'child_process'
import { dirname } from 'path';
import { /*Au3Runtime,*/ FileAccessor } from './au3Runtime';
//import * as vscode from 'vscode';

export interface LaunchRequestArguments extends VSCodeDebugProtocol.LaunchRequestArguments {
    /** Full path to the AutoIt3 executable */
    executable: string;
    /** Full path to the AutoIt3 script */
    script: string;
    /** Absolute path to the working directory of the script */
    cwd?: string;
    /** Command line arguments passed to the script */
    arguments?: Array<string>;
    /** Redirects fatal error information to the debug console instead of a message box */
    errorStdOut: boolean;
}

export class Au3DebugSession extends DebugSession {
    // we don't support multiple threads, so we can use a hardcoded ID for the default thread
    //private static threadID = 1;

    // a AutoIt3 runtime (or debugger)
    //private _runtime: Au3Runtime;

    private colorConfig: Record<string, string> | undefined;

    private process: childProcess.ChildProcessWithoutNullStreams | undefined;

    public constructor(fileAccessor: FileAccessor) {
        super();

        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);

        const configurationInformation = vscode.workspace.getConfiguration('autoit3').inspect<typeof this.colorConfig>('output.colors');

        this.colorConfig = configurationInformation?.workspaceValue || configurationInformation?.globalValue || configurationInformation?.defaultValue;
    }

    protected async launchRequest(response: VSCodeDebugProtocol.LaunchResponse, args: LaunchRequestArguments, request?: VSCodeDebugProtocol.Request): Promise<void> {
        //vscode.debug.activeDebugConsole.append
        vscode.commands.executeCommand('workbench.panel.repl.view.focus');

        const executableFlags: string[] = [];

        if (args.errorStdOut) {
            executableFlags.push('/ErrorStdOut');
        }

        this.process = childProcess.spawn(args.executable, [...executableFlags, args.script, ...(args?.arguments??[]), ], {stdio: "pipe", cwd: args.cwd ?? dirname(args.script)});
        this.process.stdout.setEncoding('binary');
        this.process.stderr.setEncoding('binary');

        let outputBuffer = '';

        this.process.on('error', (err) => {
            response.success = false;
            response.message = err.message;
            response.body = err.stack;
            this.sendResponse(response);
            this.sendEvent(new TerminatedEvent());
        });

        this.process.on("exit", (code) => {
            // Print remaning outputBuffer
            if (outputBuffer.length > 0) {
                this.writeLine(outputBuffer);
            }
            response.success = true;
            response.body = `Exit code: ${code}`;
            this.sendResponse(response);
            this.sendEvent(new OutputEvent(`Exit code: ${code}`, 'console'));
            this.sendEvent(new TerminatedEvent());
        });

        const onData = (chunk: Buffer|string) => {
            outputBuffer += chunk.toString();
            let newlineIndex;
            while ((newlineIndex = outputBuffer.indexOf('\n')) >= 0) {
                // Extract line
                const line = outputBuffer.slice(0, newlineIndex + 1);
                this.writeLine(line);
                // Remove the line from the buffer
                outputBuffer = outputBuffer.slice(newlineIndex + 1);
            }
        };

        this.process.stdout.on("data", onData);
        this.process.stderr.on("data", onData);
    }

    protected initializeRequest(response: VSCodeDebugProtocol.InitializeResponse, args: VSCodeDebugProtocol.InitializeRequestArguments): void {
        // build and return the capabilities of this debug adapter:
        response.body = response.body || {};

        response.body.supportsRestartRequest = false;
        response.body.supportsTerminateRequest = true;

        this.sendResponse(response);
    }

    protected terminateRequest(response: VSCodeDebugProtocol.TerminateResponse, args: VSCodeDebugProtocol.TerminateArguments, request?: VSCodeDebugProtocol.Request | undefined): void {
        this.process?.kill('SIGINT');
        super.terminateRequest(response, args, request);
    }

    protected writeLine(line: string): void
    {
        const lineColor = this.colorConfig?.[line[0]];

        if (lineColor !== undefined) {
            line = this.wrapLineInColor(line, lineColor);
        }

        this.sendEvent(new OutputEvent(line));
    }

    protected wrapLineInColor(line: string, color: string): string
    {
        switch (color) {
            case 'black':
                line = '\x1b[30m'+line+'\x1b[0m';
                break;
            case 'red':
                line = '\x1b[31m'+line+'\x1b[0m';
                break;
            case 'green':
                line = '\x1b[32m'+line+'\x1b[0m';
                break;
            case 'yellow':
                line = '\x1b[33m'+line+'\x1b[0m';
                break;
            case 'blue':
                line = '\x1b[34m'+line+'\x1b[0m';
                break;
            case 'magenta':
                line = '\x1b[35m'+line+'\x1b[0m';
                break;
            case 'cyan':
                line = '\x1b[36m'+line+'\x1b[0m';
                break;
            case 'white':
                line = '\x1b[37m'+line+'\x1b[0m';
                break;
            case 'orange':
                line = '\x1b[38m'+line+'\x1b[0m';
                break;
            case 'bright black':
                line = '\x1b[90m'+line+'\x1b[0m';
                break;
            case 'bright red':
                line = '\x1b[91m'+line+'\x1b[0m';
                break;
            case 'bright green':
                line = '\x1b[92m'+line+'\x1b[0m';
                break;
            case 'bright yellow':
                line = '\x1b[93m'+line+'\x1b[0m';
                break;
            case 'bright blue':
                line = '\x1b[94m'+line+'\x1b[0m';
                break;
            case 'bright magenta':
                line = '\x1b[95m'+line+'\x1b[0m';
                break;
            case 'bright cyan':
                line = '\x1b[96m'+line+'\x1b[0m';
                break;
            case 'bright white':
                line = '\x1b[97m'+line+'\x1b[0m';
                break;
            default:
                vscode.window.showWarningMessage(`Unknown color: ${color}`);
                break;
        }

        return line;
    }
}
