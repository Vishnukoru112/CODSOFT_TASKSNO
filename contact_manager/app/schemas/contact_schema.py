import re

from marshmallow import Schema, ValidationError as MarshmallowValidationError, fields, validate, validates

PHONE_REGEX = re.compile(r"^\+?[0-9\s\-()]{7,20}$")


class ContactSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String(
        required=True, validate=validate.Length(min=1, max=120, error="Name must be 1-120 characters")
    )
    email = fields.Email(required=True, error_messages={"invalid": "Invalid email address"})
    phone_number = fields.String(required=True)
    address = fields.String(required=False, allow_none=True, validate=validate.Length(max=255))
    company = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))
    created_at = fields.String(dump_only=True)
    updated_at = fields.String(dump_only=True)

    @validates("phone_number")
    def validate_phone_number(self, value, **kwargs):
        if not PHONE_REGEX.match(value.strip()):
            raise MarshmallowValidationError(
                "Phone number must be 7-20 characters and may include digits, spaces, "
                "hyphens, parentheses, and an optional leading +"
            )

    @validates("name")
    def validate_name_not_blank(self, value, **kwargs):
        if not value.strip():
            raise MarshmallowValidationError("Name cannot be blank")


class ContactUpdateSchema(ContactSchema):
    """Same field rules as ContactSchema, but nothing is required (partial update)."""

    class Meta:
        pass


def get_create_schema():
    return ContactSchema()


def get_update_schema():
    return ContactUpdateSchema(partial=True)
