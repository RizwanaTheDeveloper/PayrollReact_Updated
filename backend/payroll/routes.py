from flask import Blueprint, request, jsonify

from employees.service import get_employee
from payslips.service import (
    build_payslip_view,
    serialize_payslip
)

from datetime import date


bp = Blueprint(
    "payroll",
    __name__,
    url_prefix="/api"
)


@bp.get("/payslip/<code>")
def payslip(code):

    e = get_employee(code)

    if not e:
        return jsonify(
            error="Employee not found."
        ), 404

    today = date.today()

    month = (
        request.args.get("month", type=int)
        or today.month
    )

    year = (
        request.args.get("year", type=int)
        or today.year
    )

    if not 1 <= month <= 12:
        return jsonify(
            error="Month must be between 1 and 12."
        ), 400

    view = build_payslip_view(
        e,
        month,
        year
    )

    if view is None:
        return jsonify(
            error=(
                "No payslip is on record for "
                f"{date(year, month, 1).strftime('%B %Y')}."
            )
        ), 404

    return jsonify(
        serialize_payslip(
            view,
            "5Gen Educon Private Limited"
        )
    )