from flask import jsonify
from werkzeug.exceptions import HTTPException

from app.utils.exceptions import APIError


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(err):
        response = jsonify(err.to_dict())
        response.status_code = err.status_code
        return response

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        response = jsonify({"error": err.description or err.name})
        response.status_code = err.code
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_error(err):
        app.logger.exception("Unhandled exception")
        response = jsonify({"error": "Internal server error"})
        response.status_code = 500
        return response

    @app.errorhandler(404)
    def handle_404(err):
        response = jsonify({"error": "The requested resource was not found"})
        response.status_code = 404
        return response

    @app.errorhandler(405)
    def handle_405(err):
        response = jsonify({"error": "Method not allowed on this endpoint"})
        response.status_code = 405
        return response
