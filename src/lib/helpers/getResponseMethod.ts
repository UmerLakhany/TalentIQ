/** Default HTTP status for a successful response to the given method. */
const getResponseMethod = (method: string): number => (method === 'POST' ? 201 : 200);

export default getResponseMethod;
