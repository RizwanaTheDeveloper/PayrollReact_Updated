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
import os

from employees.service import get_employee
from payroll.history import list_payslip_periods
from payslips.service import build_payslip_view


bp = Blueprint(
    "payslips_routes",
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

    print("PDF DEBUG: employee found:", bool(e), flush=True)
    print("PDF DEBUG: building payslip view for:", month, year, flush=True)

    view = build_payslip_view(
        e,
        month,
        year
    )

    print("PDF DEBUG: payslip view exists:", bool(view), flush=True)

    if not view:
        abort(404)

    return render_template(
        "payroll.html",
        **view,
        company_name="5Gen Educon Private Limited",
    )


def _generate_pdf(html):
    print("========== PDF DEBUG: _generate_pdf START =========", flush=True)
    print("PDF DEBUG: current working directory:", os.getcwd(), flush=True)
    print("PDF DEBUG: HTML length:", len(html), flush=True)
    """
    Generate a PDF using Playwright's Async API.

    Playwright is executed inside a separate thread so that
    it does not conflict with an existing asyncio event loop.
    """

    result = {
        "pdf": None,
        "error": None,
    }

    def worker():

        async def generate():
            print("PDF DEBUG: entering Playwright async generate()", flush=True)

            from playwright.async_api import async_playwright

            async with async_playwright() as p:

                print("PDF DEBUG: launching Chromium...", flush=True)

                browser = await p.chromium.launch(
                    headless=True
                )

                try:

                    print("PDF DEBUG: Chromium launched successfully", flush=True)

                    page = await browser.new_page(
                        viewport={
                            "width": 1200,
                            "height": 1600,
                        },
                        device_scale_factor=1,
                    )

                    print("PDF DEBUG: new page created", flush=True)
                    print("PDF DEBUG: calling page.set_content()", flush=True)

                    await page.set_content(
                        html,
                        wait_until="networkidle",
                    )

                    print("PDF DEBUG: page.set_content() completed", flush=True)
                    print("PDF DEBUG: calling page.emulate_media()", flush=True)

                    await page.emulate_media(
                        media="print"
                    )

                    print("PDF DEBUG: page.emulate_media() completed", flush=True)
                    print("PDF DEBUG: calling page.pdf()", flush=True)

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

                    print("PDF DEBUG: page.pdf() completed. PDF bytes:", len(pdf), flush=True)
                    return pdf

                finally:

                    await browser.close()

        try:
            print("PDF DEBUG: starting worker thread", flush=True)

            result["pdf"] = asyncio.run(
                generate()
            )

        except Exception as exc:
            print("PDF DEBUG ERROR:", repr(exc), flush=True)
            import traceback
            traceback.print_exc()
            result["error"] = exc

    thread = threading.Thread(
        target=worker
    )

    print("PDF DEBUG: starting PDF worker thread", flush=True)
    thread.start()
    thread.join()
    print("PDF DEBUG: worker thread finished", flush=True)

    if result["error"]:
        print("PDF DEBUG: raising worker error:", repr(result["error"]), flush=True)
        raise result["error"]

    if not result["pdf"]:
        print("PDF DEBUG: PDF result is empty", flush=True)
        raise RuntimeError(
            "PDF generation returned empty data."
        )

    print("========== PDF DEBUG: _generate_pdf SUCCESS =========", flush=True)
    return result["pdf"]


@bp.get("/download-payslip/<code>")
def download(code):

    print("========== PDF DEBUG: DOWNLOAD START =========", flush=True)
    print("PDF DEBUG: requested employee code:", code, flush=True)
    print("PDF DEBUG: request path:", request.path, flush=True)
    print("PDF DEBUG: request full URL:", request.url, flush=True)

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

        print("PDF DEBUG: rendering payroll.html", flush=True)

        html = render_template(
            "payroll.html",
            **view,
            company_name="5Gen Educon Private Limited",
        )

        print("PDF DEBUG: payroll.html rendered. HTML length:", len(html), flush=True)
        print("PDF DEBUG: calling _generate_pdf()", flush=True)

        pdf = _generate_pdf(html)

        print("PDF DEBUG: sending PDF. Bytes:", len(pdf), flush=True)

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
