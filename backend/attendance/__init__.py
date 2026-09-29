from functools import wraps

from flask import jsonify, session


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = session.get("user")
        if not user:
            return jsonify(error="Authentication required."), 401
        if user.get("role") != "admin":
            return jsonify(error="Admin access required."), 403
        return view(*args, **kwargs)

    return wrapped