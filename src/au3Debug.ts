import * as vscode from 'vscode';
import {
	DebugSession, OutputEvent, TerminatedEvent,
	/*InitializedEvent, TerminatedEvent, StoppedEvent, BreakpointEvent, OutputEvent,
	ProgressStartEvent, ProgressUpdateEvent, ProgressEndEvent, InvalidatedEvent,
	Thread, StackFrame, Scope, Source, Handles, Breakpoint, MemoryEvent*/
} from '@vscode/debugadapter';
import { DebugProtocol as VSCodeDebugProtocol } from '@vscode/debugprotocol'
import * as childProcess from 'child_process'
import { /*Au3Runtime,*/ FileAccessor } from './au3Runtime';
//import * as vscode from 'vscode';

export interface LaunchRequestArguments extends VSCodeDebugProtocol.LaunchRequestArguments {
    /** Full path to the AutoIt3 executable */
    executable: string;
    /** Full path to the AutoIt3 script */
    script: string;
}

export class Au3DebugSession extends DebugSession {
    // we don't support multiple threads, so we can use a hardcoded ID for the default thread
    //private static threadID = 1;

    // a AutoIt3 runtime (or debugger)
    //private _runtime: Au3Runtime;

    private process: childProcess.ChildProcessWithoutNullStreams | undefined;

    public constructor(fileAccessor: FileAccessor) {
        super();

        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);

        // this._runtime = new Au3Runtime(/*fileAccessor*/);
    }

    protected async launchRequest(response: VSCodeDebugProtocol.LaunchResponse, args: LaunchRequestArguments, request?: VSCodeDebugProtocol.Request): Promise<void> {
        //vscode.debug.activeDebugConsole.append
        vscode.commands.executeCommand('workbench.panel.repl.view.focus');
        
        this.process = childProcess.spawn(args.executable, [args.script], {stdio: "pipe"});
        this.process.on('error', (err) => {
            response.success = false;
            response.message = err.message;
            response.body = err.stack;
            this.sendResponse(response);
            this.sendEvent(new TerminatedEvent());
        });

        this.process.on("exit", (code) => {
            response.success = true;
            response.body = `Exit code: ${code}`;
            this.sendResponse(response);
            this.sendEvent(new OutputEvent(`Exit code: ${code}`, 'console'));
            this.sendEvent(new TerminatedEvent());
        });

        this.process.stdout.on("data", (chunk: Buffer|string) => this.sendEvent(new OutputEvent(chunk.toString(), 'stdout')));
        this.process.stderr.on("data", (chunk: Buffer|string) => this.sendEvent(new OutputEvent(chunk.toString(), 'stderr')));
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
}
