from datetime import date

from flask import Blueprint, jsonify, request

from auth.guards import admin_required
from attendance.service import ( # type: ignore
    delete_attendance,
    get_daily_attendance,
    save_daily_attendance,
    update_attendance,
)

bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


@bp.get("")
@admin_required
def list_attendance():
    try:
        day = date.fromisoformat(request.args.get("date", date.today().isoformat()))
    except ValueError:
        return jsonify(error="Date must use YYYY-MM-DD format."), 400

    return jsonify(date=day.isoformat(), records=get_daily_attendance(day))


@bp.post("")
@admin_required
def save_attendance():
    data = request.get_json(silent=True) or {}
    try:
        day = date.fromisoformat(data.get("date", ""))
        records = data.get("records", [])
        if not isinstance(records, list):
            return jsonify(error="records must be a list."), 400

        save_daily_attendance(day, records)
        return jsonify(ok=True)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except Exception:
        return jsonify(error="Could not save attendance. Check the employee codes and database."), 400


@bp.put("/<int:attendance_id>")
@admin_required
def edit_attendance(attendance_id):
    data = request.get_json(silent=True) or {}
    try:
        if not update_attendance(
            attendance_id,
            data.get("status"),
            data.get("notes", ""),
        ):
            return jsonify(error="Attendance record not found."), 404
        return jsonify(ok=True)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400


@bp.delete("/<int:attendance_id>")
@admin_required
def remove_attendance(attendance_id):
    if not delete_attendance(attendance_id):
        return jsonify(error="Attendance record not found."), 404
    return jsonify(ok=True)