import re
from datetime import datetime

PAN_PATTERN = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]$')

def parse_employee_payload(form):
    full_name = str(form.get('full_name') or '').strip()
    department = str(form.get('department') or '').strip()
    designation = str(form.get('designation') or '').strip()
    joining_date_raw = str(form.get('joining_date') or '').strip()
    ctc_raw = form.get('ctc')
    pan = str(form.get('pan') or '').strip().upper()
    pf_uan = str(form.get('pf_uan') or '').strip()
    account_number = str(form.get('account_number') or '').strip()
    ifsc_code = str(form.get('ifsc_code') or '').strip().upper()
    regime_opted = str(form.get('regime_opted') or 'New').strip()
    working_days_raw = str(form.get('working_days') or '').strip()

    if not full_name or ctc_raw in (None, '') or not joining_date_raw or not working_days_raw:
        return None, 'Full Name, Joining Date, CTC, and Working Days are required.'
    try:
        ctc = float(ctc_raw)
    except (TypeError, ValueError):
        return None, 'CTC must be a valid number.'
    if ctc <= 0:
        return None, 'CTC must be greater than zero.'
    try:
        joining_date = datetime.strptime(joining_date_raw, '%Y-%m-%d').date()
    except ValueError:
        return None, 'Joining Date must be a valid date (YYYY-MM-DD).'
    try:
        working_days = int(working_days_raw)
    except ValueError:
        return None, 'Working Days must be a whole number.'
    if working_days < 0 or working_days > 31:
        return None, 'Working Days must be between 0 and 31.'
    if pan and not PAN_PATTERN.fullmatch(pan):
        return None, 'PAN must be in the standard format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).'
    if pf_uan and not pf_uan.isdigit():
        return None, 'PF UAN must contain digits only.'
    if account_number and not account_number.isdigit():
        return None, 'Account Number must contain digits only, no letters or symbols.'
    if regime_opted not in ('New', 'Old'):
        regime_opted = 'New'
    return {
        'full_name': full_name,
        'department': department or None,
        'designation': designation or None,
        'joining_date': joining_date,
        'ctc': ctc,
        'pan': pan or None,
        'pf_uan': pf_uan or None,
        'account_number': account_number or None,
        'ifsc_code': ifsc_code or None,
        'regime_opted': regime_opted,
        'working_days': working_days,
    }, None
