// server/src/utils/payslipPdf.js

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.jpeg');
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const num = (v) => Number(v) || 0;

const pad = (n) => String(n).padStart(2, '0');

const inr = (n) =>
  num(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const mask = (s) =>
  s
    ? 'X'.repeat(Math.max(String(s).length - 4, 0)) +
      String(s).slice(-4)
    : '-';

const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  v === '';

const fmtDate = (v) => {
  if (!v) return '-';

  const s =
    v instanceof Date
      ? v.toLocaleDateString('en-CA')
      : String(v).slice(0, 10);

  const [y, m, d] = s.split('-');

  if (!y || !m || !d) return '-';

  return `${d} ${MONTHS[Number(m) - 1].slice(0, 3)} ${y}`;
};


/* ---------- amount in words (Indian system) ---------- */

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen'
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety'
];

const twoDigits = (n) =>
  n < 20
    ? ONES[n]
    : TENS[Math.floor(n / 10)] +
      (n % 10 ? ` ${ONES[n % 10]}` : '');

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;

  return [
    h ? `${ONES[h]} Hundred` : '',
    r ? twoDigits(r) : ''
  ]
    .filter(Boolean)
    .join(' ');
};

const inWords = (value) => {
  let n = Math.floor(value);

  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 1e7);
  n %= 1e7;

  const lakh = Math.floor(n / 1e5);
  n %= 1e5;

  const thousand = Math.floor(n / 1e3);
  n %= 1e3;

  return [
    crore ? `${threeDigits(crore)} Crore` : '',
    lakh ? `${twoDigits(lakh)} Lakh` : '',
    thousand ? `${twoDigits(thousand)} Thousand` : '',
    n ? threeDigits(n) : ''
  ]
    .filter(Boolean)
    .join(' ');
};

const netWords = (amount) => {
  const paise = Math.round(num(amount) * 100);

  const rupees = Math.floor(paise / 100);

  const ps = paise % 100;

  return `Rupees ${inWords(rupees)}${
    ps ? ` and ${twoDigits(ps)} Paise` : ''
  } Only`;
};


/* ---------- PDF ---------- */

module.exports = (res, p) => {
  const month = Number(p.month);
  const year = Number(p.year);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40
  });

  res.setHeader(
    'Content-Type',
    'application/pdf'
  );

  res.setHeader(
    'Content-Disposition',
    `attachment; filename=payslip-${
      p.emp_code || p.employee_id
    }-${year}-${pad(month)}.pdf`
  );

  doc.pipe(res);

  const pageW = doc.page.width;

  const left = 40;

  const contentW = pageW - left * 2;

  let y = 30;


  /* ---------- table cell helper ---------- */

  const cell = (
    x,
    cy,
    w,
    h,
    text,
    o = {}
  ) => {
    if (o.fill) {
      doc
        .rect(x, cy, w, h)
        .fill(o.fill);
    }

    doc
      .rect(x, cy, w, h)
      .lineWidth(0.5)
      .strokeColor('#cbd5e1')
      .stroke();

    const size = o.size || 9.5;

    doc
      .fillColor(o.color || '#0f172a')
      .font(
        o.bold
          ? 'Helvetica-Bold'
          : 'Helvetica'
      )
      .fontSize(size)
      .text(
        String(text ?? ''),
        x + 8,
        cy + (h - size) / 2 - 1,
        {
          width: w - 16,
          height: h - 6,
          ellipsis: true,
          align: o.align || 'left'
        }
      );
  };


  /* ---------- 1. Logo ---------- */

  let logoDrawn = false;

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(
        LOGO_PATH,
        (pageW - 200) / 2,
        y,
        {
          fit: [200, 60],
          align: 'center',
          valign: 'center'
        }
      );

      logoDrawn = true;

      y += 68;
    } catch (e) {
      console.error(
        'Logo could not be loaded:',
        e.message
      );
    }
  }


  /* ---------- Company address ---------- */

  if (COMPANY_ADDRESS) {
    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        COMPANY_ADDRESS,
        left,
        y,
        {
          width: contentW,
          align: 'center'
        }
      );

    y += 14;
  }

  y += 8;


  /* ---------- 2. Title band ---------- */

  const lastDay = new Date(
    year,
    month,
    0
  ).getDate();

  const mon = MONTHS[month - 1];

  doc
    .rect(left, y, contentW, 46)
    .fill('#4f46e5');

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(
      `Payslip for ${mon} ${year}`,
      left,
      y + 8,
      {
        width: contentW,
        align: 'center'
      }
    );

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      `Pay period: 01 ${mon.slice(
        0,
        3
      )} ${year} to ${pad(
        lastDay
      )} ${mon.slice(0, 3)} ${year}`,
      left,
      y + 27,
      {
        width: contentW,
        align: 'center'
      }
    );

  y += 46 + 14;


  /* ---------- 3. Employee details ---------- */

  const items = [
    ['Employee name', p.name],

    [
      'Employee ID',
      p.emp_code || p.employee_id
    ],

    [
      'Date of joining',
      fmtDate(p.joining_date)
    ]
  ];

  if (p.resignation_date) {
    items.push([
      'Date of resignation',
      fmtDate(p.resignation_date)
    ]);
  }

  items.push(
    ['PAN', p.pan],

    [
      'Bank account no.',
      mask(p.account_number)
    ],

    ['Bank name', p.bank_name],

    ['Gender', p.gender],

    ['Location', p.location],

    [
      'Date of birth',
      fmtDate(p.dob)
    ],

    ['UAN', p.uan],

    ['PF UAN', p.pf_uan],

    ['Month days', p.month_days],

    ['Net paid days', p.net_paid_days]
  );

  const cw = [
    100,
    157.5,
    100,
    157.5
  ];

  const rowH = 24;

  for (
    let i = 0;
    i < items.length;
    i += 2
  ) {
    let x = left;

    [
      items[i],
      items[i + 1] || ['', '']
    ].forEach(([k, v]) => {
      cell(
        x,
        y,
        cw[0],
        rowH,
        k,
        {
          fill: '#f1f5f9',
          color: '#475569',
          bold: true,
          size: 8.5
        }
      );

      x += cw[0];

      cell(
        x,
        y,
        cw[1],
        rowH,
        k === ''
          ? ''
          : isEmpty(v)
            ? '-'
            : v
      );

      x += cw[1];
    });

    y += rowH;
  }

  y += 16;


  /* ---------- 4. Earnings and deductions ---------- */

  const earnings = [
    ['Basic', p.basic],
    ['HRA', p.hra],
    [
      'Special allowance',
      p.special_allowance
    ],
    [
      'Travel allowance',
      p.travel_allowance
    ],
    [
      'Leave allowance',
      p.leave_allowance
    ],
    ['Bonus', p.bonus]
  ];

  const deducts = [
    [
      'Professional tax',
      p.professional_tax
    ],
    ['EPF', p.pf]
  ];

  const totalEarn =
    earnings.reduce(
      (s, [, v]) =>
        s + num(v),
      0
    );

  const totalDed =
    deducts.reduce(
      (s, [, v]) =>
        s + num(v),
      0
    );

  const net =
    totalEarn - totalDed;

  const tw = [
    170,
    87.5,
    170,
    87.5
  ];

  const head = {
    fill: '#eef2ff',
    color: '#312e81',
    bold: true
  };

  let x = left;

  [
    'Earnings',
    'Amount (INR)',
    'Deductions',
    'Amount (INR)'
  ].forEach((h, i) => {
    cell(
      x,
      y,
      tw[i],
      26,
      h,
      {
        ...head,
        align:
          i % 2
            ? 'right'
            : 'left'
      }
    );

    x += tw[i];
  });

  y += 26;

  const n = Math.max(
    earnings.length,
    deducts.length
  );

  for (let i = 0; i < n; i++) {
    const e = earnings[i];

    const d = deducts[i];

    cell(
      left,
      y,
      tw[0],
      rowH,
      e ? e[0] : ''
    );

    cell(
      left + tw[0],
      y,
      tw[1],
      rowH,
      e ? inr(e[1]) : '',
      {
        align: 'right'
      }
    );

    cell(
      left + tw[0] + tw[1],
      y,
      tw[2],
      rowH,
      d ? d[0] : ''
    );

    cell(
      left +
        tw[0] +
        tw[1] +
        tw[2],
      y,
      tw[3],
      rowH,
      d ? inr(d[1]) : '',
      {
        align: 'right'
      }
    );

    y += rowH;
  }


  /* ---------- Totals ---------- */

  const tot = {
    fill: '#f1f5f9',
    bold: true
  };

  cell(
    left,
    y,
    tw[0],
    26,
    'Total earnings',
    tot
  );

  cell(
    left + tw[0],
    y,
    tw[1],
    26,
    inr(totalEarn),
    {
      ...tot,
      align: 'right'
    }
  );

  cell(
    left + tw[0] + tw[1],
    y,
    tw[2],
    26,
    'Total deductions',
    tot
  );

  cell(
    left +
      tw[0] +
      tw[1] +
      tw[2],
    y,
    tw[3],
    26,
    inr(totalDed),
    {
      ...tot,
      align: 'right'
    }
  );

  y += 26 + 16;


  /* ---------- 5. Net pay ---------- */

  doc
    .roundedRect(
      left,
      y,
      contentW,
      46,
      6
    )
    .fill('#4f46e5');

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(
      'NET PAY',
      left + 16,
      y + 17
    );

  doc
    .fontSize(18)
    .text(
      `INR ${inr(net)}`,
      left + 16,
      y + 14,
      {
        width:
          contentW - 32,
        align: 'right'
      }
    );

  y += 46 + 8;


  /* ---------- Net pay in words ---------- */

  doc
    .rect(
      left,
      y,
      contentW,
      40
    )
    .lineWidth(0.5)
    .strokeColor('#cbd5e1')
    .stroke();

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text(
      'Net pay in words',
      left + 10,
      y + 7
    );

  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .fontSize(10)
    .text(
      netWords(net),
      left + 10,
      y + 20,
      {
        width: contentW - 20
      }
    );

  y += 40 + 20;


  /* ---------- 6. Footer ---------- */

  const currentYear =
    new Date().getFullYear();

  doc
    .fillColor('#94a3b8')
    .font('Helvetica')
    .fontSize(8)
    .text(
      `© ${currentYear} 5 Gen Educon Private Limited. All rights reserved.`,
      left,
      y,
      {
        width: contentW,
        align: 'center'
      }
    );

  doc.end();
};