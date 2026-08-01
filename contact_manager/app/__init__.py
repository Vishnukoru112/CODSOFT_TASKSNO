import os

from flask import Flask, jsonify

from app.extensions import db
from config import config_by_name


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name[config_name])

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)

    from app.routes.contact_routes import contacts_bp
    app.register_blueprint(contacts_bp)

    from app.utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok"}), 200

    with app.app_context():
        db.create_all()

    return app
