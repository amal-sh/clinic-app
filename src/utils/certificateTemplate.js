export const generateCertificateHTML = (patient, diagnosis, startDate, endDate, issueDate, residencyWork, settings = {}) => {
  const formatDateFull = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // 1. IS/WAS LOGIC based on Date Comparison
  const issueDt = new Date(issueDate);
  const endDt = new Date(endDate);
  const isPast = issueDt > endDt;
  const verb = isPast ? "was" : "is";

  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const d = new Date(issueDate);
  const formattedIssueDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  
  const startStr = formatDateFull(startDate);
  const endStr = formatDateFull(endDate);

  const isA5 = settings.paperSize === 'A5';
  
  const scale = {
    padding: isA5 ? '10mm' : '15mm',
    h1: isA5 ? '15pt' : '18pt',
    h2: isA5 ? '11pt' : '13pt',
    body: isA5 ? '8pt' : '9pt',
    title: isA5 ? '13pt' : '15pt',
    content: isA5 ? '11pt' : '13pt' 
  };

  const prefix = patient.gender === 'Male' ? 'Mr.' : (patient.gender === 'Female' ? 'Mrs.' : 'Mr./Mrs.');
  const pronoun = patient.gender === 'Male' ? 'He' : (patient.gender === 'Female' ? 'She' : 'He/She');

  const docName = settings.doctorName || "Dr. SHANTO T.R.";
  const docReg = settings.regNumber || "26315"; 
  const clinicName = settings.clinicName || "Dr. SHANTO'S CLINIC";
  const address = settings.address || "PERINJANAM, THRISSUR";
  const phone = settings.phone || "9495280251";
  const place = address ? address.split(',')[0] : "City";

  // Omit residency if input is empty
  const residencyPart = residencyWork.trim() ? ` residing/working at <strong>${residencyWork}</strong>` : '';

  return `
    <html>
    <head>
      <style>
        @page { size: ${isA5 ? 'A5' : 'A4'}; margin: 0; }
        body { 
          font-family: "Helvetica", "Arial", sans-serif; 
          padding: ${scale.padding}; 
          color: #000; 
          margin: 0;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
        }
        b, strong { font-weight: 700; }

        .clinic-header {
          text-align: center;
          padding-bottom: 5px;
          margin-bottom: 12px;
          position: relative;
          border-bottom: 2pt solid #000;
        }
        .clinic-header::after {
          content: "";
          position: absolute;
          bottom: -4pt;
          left: 0; right: 0;
          border-bottom: 0.5pt solid #000;
        }
        .clinic-header h1 { margin: 0; font-size: ${scale.h1}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 8px;
          border-bottom: 2pt solid #000;
          position: relative;
          margin-bottom: 20px;
        }
        .header-content::after {
          content: "";
          position: absolute;
          bottom: -4pt;
          left: 0; right: 0;
          border-bottom: 0.5pt solid #000;
        }

        .doc-details { width: 60%; }
        .doc-details h2 { margin: 0; font-size: ${scale.h2}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .doc-details p { margin: 2px 0; font-size: ${scale.body}; font-weight: 600; }

        .consultation-timings { width: 38%; text-align: right; font-size: ${scale.body}; font-weight: 600; line-height: 1.4; }

        .title { 
          text-align: center; 
          font-size: ${scale.title}; 
          font-weight: 800; 
          margin: 30px 0; 
          text-decoration: underline;
          text-transform: uppercase;
        }

        .content { font-size: ${scale.content}; text-align: justify; line-height: 2; }

        .footer { 
          margin-top: 50px; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
        }
        .date-place { font-size: ${scale.content}; line-height: 1.6; }
        .signature-area { text-align: center; font-size: ${scale.content}; width: 180px; }
      </style>
    </head>
    <body>
      <div class="clinic-header">
        <h1>${clinicName}, ${address.split(',')[0]}</h1>
      </div>

      <div class="header-content">
        <div class="doc-details">
          <h2>${docName}</h2>
          <p>${settings.qualification || ''}</p>
          <p>${settings.speciality || ''}${docReg ? ', Reg. No: ' + docReg : ''}</p>
          <p>Contact No: ${phone}</p>
        </div>
        <div class="consultation-timings">
          പരിശോധന സമയം:<br>
          രാവിലെ 8.00 - 11.30<br>
          വൈകിട്ട് 1.30 - 5.00<br>
          ഞായർ മുടക്കം
        </div>
      </div>

      <div class="title">Medical Certificate</div>

      <div class="content">
        <p>
          This is to certify that <strong>${prefix} ${patient.name}</strong>${residencyPart} ${verb} under my treatment for 
          <strong>${diagnosis}</strong>. ${pronoun} ${verb} advised to take rest from 
          <strong>${startStr}</strong> to <strong>${endStr}</strong> 
          (<strong>${diffDays}</strong> days).
        </p>
      </div>

      <div class="footer">
        <div class="date-place">
          <b>Place:</b> ${place}<br>
          <b>Date:</b> ${formattedIssueDate}
        </div>
        <div class="signature-area">
          <br><br>
          <b>${docName}</b><br>
          Reg. No: ${docReg}
        </div>
      </div>
    </body>
    </html>
  `;
};