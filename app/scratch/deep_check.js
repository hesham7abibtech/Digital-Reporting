const { jsPDF } = require('jspdf');
require('jspdf-autotable');

// Mock data
const tasks = [
  { id: 'T1', title: 'Task 1', department: 'IT', status: 'IN_PROGRESS', actualStartDate: '2026-04-11', actualEndDate: null, links: [{ label: 'Link 1', url: 'https://google.com' }] }
];

const metadata = { projectName: 'Test', reportTitle: 'Title', reportSubtitle: 'Subtitle' };

function formatReportDate(dateStr) { return dateStr || '-'; }
function ensureAbsoluteUrl(url) { return url; }
function getTaskLinks(t) { return t.links; }

async function test_Generation() {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Simple reproduction of the table logic
  const tableData = tasks.map(t => [t.id, t.title, t.department, t.status, t.actualStartDate, t.actualEndDate, 'Link 1']);

  const { default: autoTable } = require('jspdf-autotable');
  
  autoTable(doc, {
    startY: 30,
    head: [['UID', 'ASSET TITLE', 'DEPT', 'STATUS', 'START', 'FINISH', 'DELIVERABLES LINKS']],
    body: tableData,
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const taskLinks = [{ label: 'Link 1', url: 'https://google.com' }];
        let currentX = data.cell.x + (data.cell.width - 20) / 2;
        taskLinks.forEach((link) => {
          doc.link(currentX, data.cell.y, 20, data.cell.height, { url: link.url, target: '_blank' });
        });
      }
    }
  });

  const raw = doc.output();
  const patched = raw.replace(/\/S \/URI \/URI \((.*?)\) >>/g, '/S /URI /URI ($1) /NewWindow true >>');
  
  console.log("Original matched?", raw.match(/\/S \/URI \/URI \((.*?)\) >>/));
  console.log("Patched contains NewWindow?", patched.includes('/NewWindow true'));
  
  if (patched.includes('/NewWindow true')) {
     const idx = patched.indexOf('/NewWindow true');
     console.log("Context:", patched.substring(idx - 50, idx + 50));
  }
}

test_Generation();
