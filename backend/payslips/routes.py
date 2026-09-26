from flask import (
    Blueprint,
    request,
    jsonify,
    send_file,
    render_template,
    abort,
)

from io import BytesIO
from datetime import date

from employees.service import get_employee
from payroll.history import list_payslip_periods
from payslips.service import build_payslip_view


bp = Blueprint(
    "payslips",
    __name__
)


@bp.get("/api/payslip-history/<code>")
def history(code):

    e = get_employee(code)

    if not e:
        return jsonify(
            error="Employee not found."
        ), 404

    today = date.today()

    periods = list_payslip_periods(code)

    if not any(
        p["month"] == today.month
        and p["year"] == today.year
        for p in periods
    ):
        periods.insert(
            0,
            {
                "month": today.month,
                "year": today.year,
                "monthly_tds": None,
                "has_snapshot": True,
                "label": today.strftime("%B %Y"),
            }
        )

    return jsonify(
        employee={
            "EmployeeCode": e.EmployeeCode,
            "FullName": e.FullName,
        },
        periods=periods,
    )


@bp.get("/generate-payroll/<code>")
def html_payslip(code):

    e = get_employee(code)

    if not e:
        abort(404)

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
        abort(400)

    view = build_payslip_view(
        e,
        month,
        year
    )

    if not view:
        abort(404)

    return render_template(
        "payroll.html",
        **view,
        company_name="5Gen Educon Private Limited",
    )


@bp.get("/download-payslip/<code>")
def download(code):

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

    if not view:
        return jsonify(
            error=(
                "No payslip is on record for "
                f"{date(year, month, 1).strftime('%B %Y')}."
            )
        ), 404

    try:

        from playwright.sync_api import sync_playwright

        html = render_template(
            "payroll.html",
            **view,
            company_name="5Gen Educon Private Limited",
        )

        with sync_playwright() as p:

            browser = p.chromium.launch(
                headless=True
            )

            page = browser.new_page(
                viewport={
                    "width": 1200,
                    "height": 1600,
                },
                device_scale_factor=1,
            )

            page.set_content(
                html,
                wait_until="networkidle",
            )

            page.emulate_media(
                media="print"
            )

            pdf = page.pdf(
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                margin={
                    "top": "0",
                    "right": "0",
                    "bottom": "0",
                    "left": "0",
                },
            )

            browser.close()

        return send_file(
            BytesIO(pdf),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=(
                f"Payslip-{code}-"
                f"{date(year, month, 1).strftime('%b-%Y')}.pdf"
            ),
        )

    except Exception as exc:

        import traceback

        traceback.print_exc()

        return jsonify(
            error=f"Unable to generate PDF: {exc}"
        ), 500