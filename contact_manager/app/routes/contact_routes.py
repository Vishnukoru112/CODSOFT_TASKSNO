from flask import Blueprint, jsonify, request
from marshmallow import ValidationError as MarshmallowValidationError
from sqlalchemy import or_

from app.extensions import db
from app.models.contact import Contact
from app.schemas.contact_schema import get_create_schema, get_update_schema
from app.utils.exceptions import DuplicateContactError, NotFoundError, ValidationError
from app.utils.pagination import get_pagination_params, paginated_response

contacts_bp = Blueprint("contacts", __name__, url_prefix="/api/contacts")

SORTABLE_FIELDS = {"name", "email", "phone_number", "company", "created_at", "updated_at"}


def _get_contact_or_404(contact_id):
    contact = db.session.get(Contact, contact_id)
    if contact is None:
        raise NotFoundError(f"Contact with id {contact_id} not found")
    return contact


def _check_duplicate(email, phone_number, exclude_id=None):
    query = Contact.query.filter(
        or_(Contact.email == email, Contact.phone_number == phone_number)
    )
    if exclude_id is not None:
        query = query.filter(Contact.id != exclude_id)
    existing = query.first()
    if existing:
        field = "email" if existing.email == email else "phone_number"
        raise DuplicateContactError(f"A contact with this {field} already exists")


@contacts_bp.route("", methods=["POST"])
def create_contact():
    payload = request.get_json(silent=True)
    if payload is None:
        raise ValidationError("Request body must be valid JSON")

    schema = get_create_schema()
    try:
        data = schema.load(payload)
    except MarshmallowValidationError as err:
        raise ValidationError("Validation failed", errors=err.messages)

    _check_duplicate(data["email"], data["phone_number"])

    contact = Contact(
        name=data["name"].strip(),
        email=data["email"].strip().lower(),
        phone_number=data["phone_number"].strip(),
        address=data.get("address"),
        company=data.get("company"),
    )
    db.session.add(contact)
    db.session.commit()

    return jsonify(contact.to_dict()), 201


@contacts_bp.route("", methods=["GET"])
def list_contacts():
    page, page_size = get_pagination_params(request.args)

    sort_by = request.args.get("sort_by", "created_at")
    sort_dir = request.args.get("sort_dir", "asc").lower()

    if sort_by not in SORTABLE_FIELDS:
        raise ValidationError(
            "Invalid sort field", errors={"sort_by": f"must be one of {sorted(SORTABLE_FIELDS)}"}
        )
    if sort_dir not in {"asc", "desc"}:
        raise ValidationError("Invalid sort direction", errors={"sort_dir": "must be 'asc' or 'desc'"})

    column = getattr(Contact, sort_by)
    order = column.desc() if sort_dir == "desc" else column.asc()

    query = Contact.query.order_by(order)

    result = paginated_response(query, page, page_size, lambda c: c.to_dict())
    return jsonify(result), 200


@contacts_bp.route("/search", methods=["GET"])
def search_contacts():
    term = request.args.get("q", "").strip()
    if not term:
        raise ValidationError("Query parameter 'q' is required", errors={"q": "must not be empty"})

    page, page_size = get_pagination_params(request.args)

    like_term = f"%{term}%"
    query = Contact.query.filter(
        or_(
            Contact.name.ilike(like_term),
            Contact.email.ilike(like_term),
            Contact.phone_number.ilike(like_term),
        )
    ).order_by(Contact.name.asc())

    result = paginated_response(query, page, page_size, lambda c: c.to_dict())
    return jsonify(result), 200


@contacts_bp.route("/<int:contact_id>", methods=["GET"])
def get_contact(contact_id):
    contact = _get_contact_or_404(contact_id)
    return jsonify(contact.to_dict()), 200


@contacts_bp.route("/<int:contact_id>", methods=["PUT", "PATCH"])
def update_contact(contact_id):
    contact = _get_contact_or_404(contact_id)

    payload = request.get_json(silent=True)
    if payload is None:
        raise ValidationError("Request body must be valid JSON")

    schema = get_update_schema()
    try:
        data = schema.load(payload)
    except MarshmallowValidationError as err:
        raise ValidationError("Validation failed", errors=err.messages)

    if not data:
        raise ValidationError("At least one field must be provided to update")

    new_email = data.get("email", contact.email)
    new_phone = data.get("phone_number", contact.phone_number)
    _check_duplicate(new_email, new_phone, exclude_id=contact.id)

    for field in ("name", "email", "phone_number", "address", "company"):
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip()
                if field == "email":
                    value = value.lower()
            setattr(contact, field, value)

    db.session.commit()
    return jsonify(contact.to_dict()), 200


@contacts_bp.route("/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    contact = _get_contact_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": f"Contact {contact_id} deleted successfully"}), 200
