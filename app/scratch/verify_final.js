const { jsPDF } = require('jspdf');

function exportToPDF_Test() {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
  doc.text('Test Link', 14, 20);
  
  // Simulate doc.link from autoTable
  doc.link(14, 20, 50, 10, { url: 'https://test.com', target: '_blank' });

  // ─── GENERATION & DEEP PATCHING ───
  const rawOutput = doc.output();
  const patchedOutput = rawOutput.replace(
    /\/S \/URI \/URI \((.*?)\) >>/g, 
    '/S /URI /URI ($1) /NewWindow true >>'
  );

  return patchedOutput;
}

const finalPdf = exportToPDF_Test();
if (finalPdf.includes('/NewWindow true')) {
  console.log("SUCCESS: /NewWindow true found in patched output.");
  // Check if it appears in the right place
  const uriIdx = finalPdf.indexOf('/URI (https://test.com)');
  const snippet = finalPdf.substring(uriIdx, uriIdx + 100);
  console.log("Snippet:", snippet);
} else {
  console.log("FAILURE: /NewWindow true NOT found.");
}
