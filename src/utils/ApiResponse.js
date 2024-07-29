class ApiResponse {
    constructor(statusCode, message, data) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
    }
}

export default ApiResponse;
