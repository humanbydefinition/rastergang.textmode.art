/**
 * Message protocol for communication between parent window and iframe runner.
 */

export const PROTOCOL_VERSION = 1;

export interface InitMessage {
	type: 'INIT';
	v: typeof PROTOCOL_VERSION;
}

export interface ReadyMessage {
	type: 'READY';
}

export interface RunOkMessage {
	type: 'RUN_OK';
	timestamp: number;
}

export interface RunErrorMessage {
	type: 'RUN_ERROR';
	message: string;
	stack?: string;
	line?: number;
	column?: number;
}

export interface SynthErrorMessage {
	type: 'SYNTH_ERROR';
	message: string;
	uniformName?: string;
}

export interface ToggleUIMessage {
	type: 'TOGGLE_UI';
}

export interface UserInteractionMessage {
	type: 'USER_INTERACTION';
}

export type RunnerToParentMessage =
	| ReadyMessage
	| RunOkMessage
	| RunErrorMessage
	| SynthErrorMessage
	| ToggleUIMessage
	| UserInteractionMessage;

export interface RunCodeMessage {
	type: 'RUN_CODE';
	code: string;
}

export interface SoftResetMessage {
	type: 'SOFT_RESET';
	code: string;
}

export interface DisposeMessage {
	type: 'DISPOSE';
}

export type ParentToRunnerMessage = RunCodeMessage | SoftResetMessage | DisposeMessage;

export type WindowToRunnerMessage = InitMessage;

export type Message = RunnerToParentMessage | ParentToRunnerMessage | WindowToRunnerMessage;

export function isRunnerMessage(msg: unknown): msg is RunnerToParentMessage {
	if (!isMessageRecord(msg)) return false;

	switch (msg.type) {
		case 'READY':
		case 'TOGGLE_UI':
		case 'USER_INTERACTION':
			return true;
		case 'RUN_OK':
			return isFiniteNumber(msg.timestamp);
		case 'RUN_ERROR':
			return (
				typeof msg.message === 'string' &&
				isOptionalString(msg.stack) &&
				isOptionalFiniteNumber(msg.line) &&
				isOptionalFiniteNumber(msg.column)
			);
		case 'SYNTH_ERROR':
			return typeof msg.message === 'string' && isOptionalString(msg.uniformName);
		default:
			return false;
	}
}

export function isParentMessage(msg: unknown): msg is ParentToRunnerMessage {
	if (!isMessageRecord(msg)) return false;

	switch (msg.type) {
		case 'RUN_CODE':
		case 'SOFT_RESET':
			return typeof msg.code === 'string';
		case 'DISPOSE':
			return true;
		default:
			return false;
	}
}

export function isInitMessage(msg: unknown): msg is InitMessage {
	return isMessageRecord(msg) && msg.type === 'INIT' && msg.v === PROTOCOL_VERSION;
}

function isMessageRecord(value: unknown): value is Record<string, unknown> & { type?: unknown } {
	return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalString(value: unknown): value is string | undefined {
	return value === undefined || typeof value === 'string';
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
	return value === undefined || isFiniteNumber(value);
}
