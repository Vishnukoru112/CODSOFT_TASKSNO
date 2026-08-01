from flask import current_app

from app.utils.exceptions import ValidationError


def get_pagination_params(request_args):
    """Parse and validate `page` and `page_size` query params."""
    default_page = current_app.config["DEFAULT_PAGE"]
    default_page_size = current_app.config["DEFAULT_PAGE_SIZE"]
    max_page_size = current_app.config["MAX_PAGE_SIZE"]

    page_raw = request_args.get("page", default_page)
    page_size_raw = request_args.get("page_size", default_page_size)

    try:
        page = int(page_raw)
        page_size = int(page_size_raw)
    except (TypeError, ValueError):
        raise ValidationError(
            "Invalid pagination parameters",
            errors={"page": "must be an integer", "page_size": "must be an integer"},
        )

    if page < 1:
        raise ValidationError("Invalid pagination parameters", errors={"page": "must be >= 1"})
    if page_size < 1 or page_size > max_page_size:
        raise ValidationError(
            "Invalid pagination parameters",
            errors={"page_size": f"must be between 1 and {max_page_size}"},
        )

    return page, page_size


def paginated_response(query, page, page_size, serialize_fn):
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0

    return {
        "items": [serialize_fn(item) for item in items],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }
