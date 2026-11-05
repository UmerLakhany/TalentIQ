/**
 * JSON schema in the OpenAPI subset understood by the LLM providers
 * (types: OBJECT, ARRAY, STRING, NUMBER, INTEGER, BOOLEAN).
 */
export interface JsonSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN';
  description?: string;
  enum?: string[];
  nullable?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
}

export interface JsonRequest {
  /** Instructions and rules for the model. */
  system: string;
  /** The task input (job + CV text). */
  user: string;
  /** Shape the reply must follow. */
  schema: JsonSchema;
}

export interface JsonResponse {
  /** Parsed JSON reply. */
  data: unknown;
  /** The model that actually answered (may be a fallback), e.g. "gemini:gemini-3.5-flash". */
  model: string;
}

/** An LLM that returns structured JSON. Add a new provider by implementing this interface. */
export interface LlmProvider {
  readonly name: string;
  /** Returns the parsed JSON reply. Throws AnalysisError (retryable or not) on failure. */
  generateJson(request: JsonRequest): Promise<JsonResponse>;
}
