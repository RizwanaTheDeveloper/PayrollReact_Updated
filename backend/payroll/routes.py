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
import asyncio
import threading

from employees.service import get_employee
from payroll.history import list_payslip_periods
from payslips.service import build_payslip_view, serialize_payslip


bp = Blueprint(
    "payroll_routes",
    __name__
)


@bp.get("/api/payslip/<code>")
def api_payslip(code):

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

    return jsonify(
        serialize_payslip(
            view,
            company_name="5Gen Educon Private Limited"
        )
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


def _generate_pdf(html):
    """
    Generate PDF using Playwright Async API.

    Runs Playwright inside a separate thread so it does not
    conflict with an existing asyncio event loop.
    """

    result = {
        "pdf": None,
        "error": None,
    }

    def worker():
        async def generate():
            from playwright.async_api import async_playwright

            async with async_playwright() as p:

                browser = await p.chromium.launch(
                    channel="chromium",
                    headless=True
                )

                page = await browser.new_page(
                    viewport={
                        "width": 1200,
                        "height": 1600,
                    },
                    device_scale_factor=1,
                )

                await page.set_content(
                    html,
                    wait_until="domcontentloaded",
                )

                await page.emulate_media(
                    media="print"
                )

                pdf = await page.pdf(
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

                await browser.close()

                return pdf

        try:
            result["pdf"] = asyncio.run(generate())

        except Exception as exc:
            result["error"] = exc

    thread = threading.Thread(
        target=worker
    )

    thread.start()
    thread.join()

    if result["error"]:
        raise result["error"]

    return result["pdf"]


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

        html = render_template(
            "payroll.html",
            **view,
            company_name="5Gen Educon Private Limited",
        )

        pdf = _generate_pdf(html)

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
