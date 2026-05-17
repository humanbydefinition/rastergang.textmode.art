/**
 * Message protocol for communication between parent window and iframe runner.
 */

export const PROTOCOL_VERSION = 1;
export const EDITOR_PROTOCOL_VERSION = 2;

export type ProtocolVersion = typeof PROTOCOL_VERSION | typeof EDITOR_PROTOCOL_VERSION;

export type RunnerClient = 'synth' | 'editor';

export interface RunnerCapabilities {
	protocolVersions: ProtocolVersion[];
	clients: RunnerClient[];
	runtimeConfig: boolean;
	exports: Array<'image' | 'svg' | 'txt' | 'gif' | 'webm'>;
	fonts: boolean;
	playback: boolean;
	heartbeat: boolean;
}

export interface RuntimeSettings {
	width: number;
	height: number;
	fontSize: number;
	frameRate: number;
}

export type ImageExportFormat = 'png' | 'jpg' | 'webp';

export interface ImageExportOptions {
	format?: ImageExportFormat;
	scale?: number;
	quality?: number;
}

export interface SvgExportOptions {
	includeBackgroundRectangles?: boolean;
	drawMode?: 'fill' | 'stroke';
	strokeWidth?: number;
}

export interface TxtExportOptions {
	preserveTrailingSpaces?: boolean;
	lineEnding?: 'lf' | 'crlf';
}

export interface GifExportOptions {
	filename?: string;
	frameCount?: number;
	frameRate?: number;
	scale?: number;
	repeat?: number;
}

export interface WebmExportOptions {
	filename?: string;
	frameCount?: number;
	frameRate?: number;
	quality?: number;
	transparent?: boolean;
}

export type ExportRequest =
	| { format: 'image'; options?: ImageExportOptions }
	| { format: 'svg'; options?: SvgExportOptions }
	| { format: 'txt'; options?: TxtExportOptions }
	| { format: 'gif'; options?: GifExportOptions }
	| { format: 'webm'; options?: WebmExportOptions };

export type PlaybackAction = 'play' | 'pause' | 'stop' | 'seek' | 'next' | 'previous' | 'setMaxFrames' | 'state';

export interface PlaybackState {
	isPlaying: boolean;
	frame: number;
	maxFrames: number;
	fps?: number;
}

export interface ExportProgress {
	state: string;
	frameIndex?: number;
	totalFrames?: number;
	message?: string;
}

export interface InitMessage {
	type: 'INIT';
	v: ProtocolVersion;
	client?: RunnerClient;
}

export interface ReadyMessage {
	type: 'READY';
	v?: ProtocolVersion;
	capabilities?: RunnerCapabilities;
}

export interface RunOkMessage {
	type: 'RUN_OK';
	timestamp: number;
	requestId?: string;
}

export interface RunErrorMessage {
	type: 'RUN_ERROR';
	message: string;
	stack?: string;
	line?: number;
	column?: number;
	requestId?: string;
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

export interface ExportResultMessage {
	type: 'EXPORT_RESULT';
	requestId: string;
	format: ExportRequest['format'];
	blob?: Blob;
	text?: string;
	filename?: string;
	mimeType?: string;
}

export interface ExportProgressMessage {
	type: 'EXPORT_PROGRESS';
	requestId: string;
	format: 'gif' | 'webm';
	progress: ExportProgress;
}

export interface FontLoadedMessage {
	type: 'FONT_LOADED';
	requestId: string;
	familyName: string | null;
	characters: string[];
}

export interface FontErrorMessage {
	type: 'FONT_ERROR';
	requestId: string;
	message: string;
}

export interface PlaybackStateMessage {
	type: 'PLAYBACK_STATE';
	requestId?: string;
	state: PlaybackState;
}

export interface PongMessage {
	type: 'PONG';
	nonce?: string;
	timestamp: number;
}

export type RunnerToParentMessage =
	| ReadyMessage
	| RunOkMessage
	| RunErrorMessage
	| SynthErrorMessage
	| ToggleUIMessage
	| UserInteractionMessage
	| ExportResultMessage
	| ExportProgressMessage
	| FontLoadedMessage
	| FontErrorMessage
	| PlaybackStateMessage
	| PongMessage;

export interface RunCodeMessage {
	type: 'RUN_CODE';
	code: string;
	requestId?: string;
}

export interface SoftResetMessage {
	type: 'SOFT_RESET';
	code: string;
	requestId?: string;
}

export interface DisposeMessage {
	type: 'DISPOSE';
}

export interface ConfigureRuntimeMessage {
	type: 'CONFIGURE_RUNTIME';
	settings: RuntimeSettings;
	requestId?: string;
}

export interface SetSettingsMessage {
	type: 'SET_SETTINGS';
	settings: Partial<RuntimeSettings>;
	requestId?: string;
}

export interface ExportMessage {
	type: 'EXPORT';
	requestId: string;
	format: ExportRequest['format'];
	options?: ExportRequest['options'];
}

export interface LoadFontMessage {
	type: 'LOAD_FONT';
	requestId: string;
	fileName: string;
	mimeType?: string;
	buffer: ArrayBuffer;
}

export interface PlaybackMessage {
	type: 'PLAYBACK';
	requestId?: string;
	action: PlaybackAction;
	frame?: number;
	maxFrames?: number;
}

export interface PingMessage {
	type: 'PING';
	nonce?: string;
}

export type ParentToRunnerMessage =
	| RunCodeMessage
	| SoftResetMessage
	| DisposeMessage
	| ConfigureRuntimeMessage
	| SetSettingsMessage
	| ExportMessage
	| LoadFontMessage
	| PlaybackMessage
	| PingMessage;

export type WindowToRunnerMessage = InitMessage;

export type Message = RunnerToParentMessage | ParentToRunnerMessage | WindowToRunnerMessage;

export function isRunnerMessage(msg: unknown): msg is RunnerToParentMessage {
	if (!isMessageRecord(msg)) return false;

	switch (msg.type) {
		case 'READY':
			return (
				(msg.v === undefined || isProtocolVersion(msg.v)) &&
				(msg.capabilities === undefined || typeof msg.capabilities === 'object')
			);
		case 'TOGGLE_UI':
		case 'USER_INTERACTION':
			return true;
		case 'RUN_OK':
			return isFiniteNumber(msg.timestamp) && isOptionalString(msg.requestId);
		case 'RUN_ERROR':
			return (
				typeof msg.message === 'string' &&
				isOptionalString(msg.stack) &&
				isOptionalFiniteNumber(msg.line) &&
				isOptionalFiniteNumber(msg.column) &&
				isOptionalString(msg.requestId)
			);
		case 'SYNTH_ERROR':
			return typeof msg.message === 'string' && isOptionalString(msg.uniformName);
		case 'EXPORT_RESULT':
			return (
				typeof msg.requestId === 'string' &&
				isExportFormat(msg.format) &&
				(msg.blob === undefined || msg.blob instanceof Blob) &&
				isOptionalString(msg.text) &&
				isOptionalString(msg.filename) &&
				isOptionalString(msg.mimeType)
			);
		case 'EXPORT_PROGRESS':
			return (
				typeof msg.requestId === 'string' &&
				(msg.format === 'gif' || msg.format === 'webm') &&
				typeof msg.progress === 'object' &&
				msg.progress !== null
			);
		case 'FONT_LOADED':
			return (
				typeof msg.requestId === 'string' &&
				(msg.familyName === null || typeof msg.familyName === 'string') &&
				Array.isArray(msg.characters) &&
				msg.characters.every((entry) => typeof entry === 'string')
			);
		case 'FONT_ERROR':
			return typeof msg.requestId === 'string' && typeof msg.message === 'string';
		case 'PLAYBACK_STATE':
			return isOptionalString(msg.requestId) && isPlaybackState(msg.state);
		case 'PONG':
			return isOptionalString(msg.nonce) && isFiniteNumber(msg.timestamp);
		default:
			return false;
	}
}

export function isParentMessage(msg: unknown): msg is ParentToRunnerMessage {
	if (!isMessageRecord(msg)) return false;

	switch (msg.type) {
		case 'RUN_CODE':
		case 'SOFT_RESET':
			return typeof msg.code === 'string' && isOptionalString(msg.requestId);
		case 'DISPOSE':
			return true;
		case 'CONFIGURE_RUNTIME':
			return isRuntimeSettings(msg.settings) && isOptionalString(msg.requestId);
		case 'SET_SETTINGS':
			return isPartialRuntimeSettings(msg.settings) && isOptionalString(msg.requestId);
		case 'EXPORT':
			return typeof msg.requestId === 'string' && isExportFormat(msg.format);
		case 'LOAD_FONT':
			return (
				typeof msg.requestId === 'string' &&
				typeof msg.fileName === 'string' &&
				isOptionalString(msg.mimeType) &&
				msg.buffer instanceof ArrayBuffer
			);
		case 'PLAYBACK':
			return (
				isOptionalString(msg.requestId) &&
				isPlaybackAction(msg.action) &&
				isOptionalFiniteNumber(msg.frame) &&
				isOptionalFiniteNumber(msg.maxFrames)
			);
		case 'PING':
			return isOptionalString(msg.nonce);
		default:
			return false;
	}
}

export function isInitMessage(msg: unknown): msg is InitMessage {
	return (
		isMessageRecord(msg) &&
		msg.type === 'INIT' &&
		isProtocolVersion(msg.v) &&
		(msg.client === undefined || msg.client === 'synth' || msg.client === 'editor')
	);
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

function isProtocolVersion(value: unknown): value is ProtocolVersion {
	return value === PROTOCOL_VERSION || value === EDITOR_PROTOCOL_VERSION;
}

function isRuntimeSettings(value: unknown): value is RuntimeSettings {
	if (!isMessageRecord(value)) return false;

	return (
		isPositiveFiniteNumber(value.width) &&
		isPositiveFiniteNumber(value.height) &&
		isPositiveFiniteNumber(value.fontSize) &&
		isPositiveFiniteNumber(value.frameRate)
	);
}

function isPartialRuntimeSettings(value: unknown): value is Partial<RuntimeSettings> {
	if (!isMessageRecord(value)) return false;

	return (
		(value.width === undefined || isPositiveFiniteNumber(value.width)) &&
		(value.height === undefined || isPositiveFiniteNumber(value.height)) &&
		(value.fontSize === undefined || isPositiveFiniteNumber(value.fontSize)) &&
		(value.frameRate === undefined || isPositiveFiniteNumber(value.frameRate))
	);
}

function isPositiveFiniteNumber(value: unknown): value is number {
	return isFiniteNumber(value) && value > 0;
}

function isExportFormat(value: unknown): value is ExportRequest['format'] {
	return value === 'image' || value === 'svg' || value === 'txt' || value === 'gif' || value === 'webm';
}

function isPlaybackAction(value: unknown): value is PlaybackAction {
	return (
		value === 'play' ||
		value === 'pause' ||
		value === 'stop' ||
		value === 'seek' ||
		value === 'next' ||
		value === 'previous' ||
		value === 'setMaxFrames' ||
		value === 'state'
	);
}

function isPlaybackState(value: unknown): value is PlaybackState {
	if (!isMessageRecord(value)) return false;

	return (
		typeof value.isPlaying === 'boolean' &&
		isFiniteNumber(value.frame) &&
		isFiniteNumber(value.maxFrames) &&
		(value.fps === undefined || isFiniteNumber(value.fps))
	);
}
