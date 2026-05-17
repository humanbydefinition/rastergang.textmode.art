import { describe, expect, it } from 'vitest';
import {
	EDITOR_PROTOCOL_VERSION,
	PROTOCOL_VERSION,
	isInitMessage,
	isParentMessage,
	isRunnerMessage,
} from '../src/protocol/textmode';

describe('textmode runner protocol', () => {
	it('accepts v1 synth init messages for backward compatibility', () => {
		expect(isInitMessage({ type: 'INIT', v: PROTOCOL_VERSION })).toBe(true);
	});

	it('accepts v2 editor init messages', () => {
		expect(isInitMessage({ type: 'INIT', v: EDITOR_PROTOCOL_VERSION, client: 'editor' })).toBe(true);
	});

	it('validates v1 parent execution messages', () => {
		expect(isParentMessage({ type: 'RUN_CODE', code: 't.draw(() => {})' })).toBe(true);
		expect(isParentMessage({ type: 'SOFT_RESET', code: 't.draw(() => {})' })).toBe(true);
		expect(isParentMessage({ type: 'DISPOSE' })).toBe(true);
	});

	it('validates v2 editor parent messages', () => {
		expect(
			isParentMessage({
				type: 'CONFIGURE_RUNTIME',
				requestId: 'settings_1',
				settings: { width: 640, height: 640, fontSize: 16, frameRate: 60 },
			})
		).toBe(true);
		expect(
			isParentMessage({
				type: 'LOAD_FONT',
				requestId: 'font_1',
				fileName: 'Example.woff',
				mimeType: 'font/woff',
				buffer: new ArrayBuffer(8),
			})
		).toBe(true);
		expect(isParentMessage({ type: 'PLAYBACK', requestId: 'playback_1', action: 'seek', frame: 12 })).toBe(true);
		expect(isParentMessage({ type: 'PING', nonce: 'heartbeat_1' })).toBe(true);
	});

	it('validates v2 runner responses', () => {
		expect(
			isRunnerMessage({
				type: 'READY',
				v: EDITOR_PROTOCOL_VERSION,
				capabilities: {
					protocolVersions: [PROTOCOL_VERSION, EDITOR_PROTOCOL_VERSION],
					clients: ['synth', 'editor'],
					runtimeConfig: true,
					exports: ['image', 'svg', 'txt', 'gif', 'webm'],
					fonts: true,
					playback: true,
					heartbeat: true,
				},
			})
		).toBe(true);
		expect(
			isRunnerMessage({
				type: 'PLAYBACK_STATE',
				requestId: 'playback_1',
				state: { isPlaying: false, frame: 0, maxFrames: 200 },
			})
		).toBe(true);
		expect(isRunnerMessage({ type: 'PONG', nonce: 'heartbeat_1', timestamp: Date.now() })).toBe(true);
	});
});
