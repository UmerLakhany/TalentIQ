/**
 * Response envelope shared with the recruiter panel (see TalentIQ-recruiter_panel/src/services/api.ts).
 *   success: { success: true,  message, data }
 *   failure: { success: false, statusCode, message, errors? }
 */
class APIResponse {
  static success(message: string, data: any = null) {
    return { success: true, message, data };
  }

  static error(message: string, statusCode: number, errors?: string[]) {
    return {
      success: false,
      statusCode,
      message,
      ...(errors && errors.length > 0 && { errors }),
    };
  }
}

export default APIResponse;
