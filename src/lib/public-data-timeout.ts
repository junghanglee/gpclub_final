export const PUBLIC_DATA_TIMEOUT_MS = 7000;

export function withPublicDataTimeout<T>(
	request: PromiseLike<T>,
	label: string,
	timeoutMs = PUBLIC_DATA_TIMEOUT_MS,
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = globalThis.setTimeout(() => {
			reject(new Error(`${label} timed out after ${timeoutMs}ms`));
		}, timeoutMs);

		Promise.resolve(request).then(
			(value) => {
				globalThis.clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				globalThis.clearTimeout(timer);
				reject(error);
			},
		);
	});
}
