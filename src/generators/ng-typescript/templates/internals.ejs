export const toQueryParams = (params: Record<string, unknown>, prefix?: string): string => {
	const queryParams: string[] = [];

	for (const [key, value] of Object.entries(params)) {
		if (
			(typeof value !== 'string' &&
				typeof value !== 'number' &&
				typeof value !== 'boolean' &&
				typeof value !== 'object') ||
			value == null
		) {
			continue;
		}

		const name = prefix ? `${prefix}[${key}]` : key;

		const param =
			typeof value === 'object'
				? toQueryParams(value as Record<string, unknown>, name)
				: encodeURIComponent(name) + '=' + encodeURIComponent(value);

		queryParams.push(param);
	}

	return queryParams.join('&');
};
