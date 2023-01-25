import { EventEmitter } from 'events';

export interface FileAccessor {
	isWindows: boolean;
	readFile(path: string): Promise<Uint8Array>;
	writeFile(path: string, contents: Uint8Array): Promise<void>;
}

export interface IRuntimeBreakpoint {
	id: number;
	line: number;
	verified: boolean;
}

/*
interface IRuntimeStepInTargets {
	id: number;
	label: string;
}
*/

/*
interface IRuntimeStackFrame {
	index: number;
	name: string;
	file: string;
	line: number;
	column?: number;
	instruction?: number;
}
*/

/*
interface IRuntimeStack {
	count: number;
	frames: IRuntimeStackFrame[];
}
*/

/*
interface RuntimeDisassembledInstruction {
	address: number;
	instruction: string;
	line?: number;
}
*/

export type IRuntimeVariableType = number | boolean | string | RuntimeVariable[];

export class RuntimeVariable {
	private _memory?: Uint8Array;

	public reference?: number;

	public get value() {
		return this._value;
	}

	public set value(value: IRuntimeVariableType) {
		this._value = value;
		this._memory = undefined;
	}

	public get memory() {
		if (this._memory === undefined && typeof this._value === 'string') {
			this._memory = new TextEncoder().encode(this._value);
		}
		return this._memory;
	}

	constructor(public readonly name: string, private _value: IRuntimeVariableType) {}

	public setMemory(data: Uint8Array, offset = 0) {
		const memory = this.memory;
		if (!memory) {
			return;
		}

		memory.set(data, offset);
		this._memory = memory;
		this._value = new TextDecoder().decode(memory);
	}
}

/*
interface Word {
	name: string;
	line: number;
	index: number;
}
*/

export function timeout(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class Au3Runtime extends EventEmitter {
    constructor(/*private fileAccessor: FileAccessor*/) {
        super();
    }
}
