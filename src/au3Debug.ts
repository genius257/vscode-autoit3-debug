//import * as vscode from 'vscode';
import {
	DebugSession, OutputEvent, TerminatedEvent,
	/*InitializedEvent, TerminatedEvent, StoppedEvent, BreakpointEvent, OutputEvent,
	ProgressStartEvent, ProgressUpdateEvent, ProgressEndEvent, InvalidatedEvent,
	Thread, StackFrame, Scope, Source, Handles, Breakpoint, MemoryEvent*/
} from '@vscode/debugadapter';
import { DebugProtocol as VSCodeDebugProtocol } from '@vscode/debugprotocol'
import * as childProcess from 'child_process'
import { Au3Runtime, FileAccessor } from './au3Runtime';
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

    public constructor(fileAccessor: FileAccessor) {
        super();

        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);

        /*this._runtime =*/ new Au3Runtime(/*fileAccessor*/);
    }

    protected async launchRequest(response: VSCodeDebugProtocol.LaunchResponse, args: LaunchRequestArguments, request?: VSCodeDebugProtocol.Request): Promise<void> {
        const process = childProcess.spawn(args.executable, [args.script], {stdio: "pipe"});
        process.on('error', (err) => {
            response.success = false;
            response.message = err.message;
            response.body = err.stack;
            this.sendResponse(response);
            this.sendEvent(new TerminatedEvent());
        });

        process.on("exit", (code) => {
            response.success = true;
            response.body = `Exit code: ${code}`;
            this.sendResponse(response);
            this.sendEvent(new OutputEvent(`Exit code: ${code}`, 'console'));
            this.sendEvent(new TerminatedEvent());
        });

        process.stdout.on("data", (chunk: Buffer|string) => this.sendEvent(new OutputEvent(chunk.toString(), 'stdout')));
        process.stderr.on("data", (chunk: Buffer|string) => this.sendEvent(new OutputEvent(chunk.toString(), 'stderr')));
    }
}
