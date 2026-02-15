export const generatePrescriptionHTML = (patient, medicines, diagnosis, settings = {}) => {
  const d = new Date();
  
  // 1. Generate Date: DD-MM-YYYY
  const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  
  // 2. Generate Time: 12-hour format with AM/PM
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert hour '0' to '12'
  const timeStr = `${hours}:${minutes} ${ampm}`;

  // Combine them (e.g., "15-02-2026, 10:30 AM")
  const dateTimeDisplay = `${dateStr}, ${timeStr}`;
  
  const isA5 = settings.paperSize === 'A5';
  
  const scale = {
    padding: isA5 ? '10mm' : '15mm',
    h1: isA5 ? '15pt' : '18pt',          
    h2: isA5 ? '11pt' : '13pt',          
    body: isA5 ? '8pt' : '9pt',          
    pDetails: isA5 ? '10pt' : '11pt',    
    content: isA5 ? '9pt' : '10pt',     
    tableHeader: isA5 ? '6pt' : '8pt',   
    rowPadding: isA5 ? '6px' : '10px'    
  };

  const docName = settings.doctorName || "Dr. SHANTO T.R.";
  const docQual = settings.qualification || "M.B.B.S., MD (Gen. Med.)"; 
  const docSpec = settings.speciality || "Consultant Physician"; 
  const docReg = settings.regNumber || "26315"; 
  const clinicName = settings.clinicName || "Dr. SHANTO'S CLINIC";
  const address = settings.address || "PERINJANAM, THRISSUR";
  const phone = settings.phone || "9495280251";

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
          line-height: 1.3;
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
        .clinic-header h1 {
          margin: 0;
          font-size: ${scale.h1};
          font-weight: 800; 
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 8px;
          border-bottom: 2pt solid #000;
          position: relative;
          margin-bottom: 15px;
        }
        .header-content::after {
          content: "";
          position: absolute;
          bottom: -4pt;
          left: 0; right: 0;
          border-bottom: 0.5pt solid #000;
        }

        .doc-details { width: 60%; }
        .doc-details h2 { 
          margin: 0; 
          font-size: ${scale.h2}; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: 1px;
        }
        .doc-details p { 
          margin: 2px 0; 
          font-size: ${scale.body}; 
          font-weight: 600; 
        }

        .consultation-timings { 
          width: 38%; 
          text-align: right; 
          font-size: ${scale.body}; 
          line-height: 1.4;
          font-weight: 600;
        }

        .patient-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
        .p-details { font-size: ${scale.pDetails}; margin: 0; }
        .p-date { font-size: ${scale.content}; text-align: right; }

        .diagnosis-section { margin-bottom: 10px; font-size: ${scale.content}; }
        .rx-symbol { font-size: 17pt; font-weight: 700; font-family: "Times New Roman", serif; margin-bottom: 5px; }

        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 6px 4px; border-bottom: 1pt solid #000; font-size: ${scale.tableHeader}; text-transform: uppercase; }
        td { padding: ${scale.rowPadding} 4px; font-size: ${scale.content}; vertical-align: top; }
        .med-name { font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="clinic-header">
        <h1>${clinicName}, ${address.split(',')[0]}</h1>
      </div>

      <div class="header-content">
        <div class="doc-details">
          <h2>${docName}</h2>
          <p>${docQual}</p>
          <p>${docSpec}${docReg ? ', Reg. No: ' + docReg : ''}</p>
          <p>Mob. ${phone}</p>
        </div>
        <div class="consultation-timings">
          പരിശോധന സമയം:<br>
          രാവിലെ 8.00 - 11.30<br>
          വൈകിട്ട് 1.30 - 5.00<br>
          ഞായർ മുടക്കം
        </div>
      </div>

      <div class="patient-info">
        <div class="p-details"><b>${patient.name}</b> &nbsp;&nbsp;&nbsp; (${patient.age} / ${patient.gender})</div>
        <div class="p-date"><b>Date:</b> ${dateTimeDisplay}</div>
      </div>

      <div class="diagnosis-section"><b>DIAGNOSIS:</b> ${diagnosis}</div>
      <div class="rx-symbol">Rx</div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 40%">Medicine</th>
            <th style="width: 15%">Dosage</th>
            <th style="width: 15%">Duration</th>
            <th style="width: 25%">Instruction</th>
          </tr>
        </thead>
        <tbody>
          ${medicines.map((med, index) => `
            <tr>
              <td>${index + 1}.</td>
              <td class="med-name">${med.name}</td>
              <td>${med.dosage}</td>
              <td>${med.duration}</td>
              <td>${med.instruction}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};