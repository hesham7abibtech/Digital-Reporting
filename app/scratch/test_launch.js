const { jsPDF } = require('jspdf');

const doc = new jsPDF();
doc.text("Test Launch", 10, 10);

// doc.link creates a /URI action. We will replace it with a /Launch action.
doc.link(10, 10, 20, 10, { url: 'https://google.com' });

const raw = doc.output();
// Replace /URI action with /Launch action
// Original: /A <</S /URI /URI (https://google.com) >>
// Targeted: /A <</S /Launch /F << /Type /FileSpec /F (https://google.com) >> /NewWindow true >>

const patched = raw.replace(
  /\/A <<\/S \/URI \/URI \((.*?)\) >>/g, 
  '/A <</S /Launch /F << /Type /FileSpec /F ($1) >> /NewWindow true >>'
);

console.log("Patched output snippet:");
const idx = patched.indexOf('/Launch');
if (idx > -1) {
    console.log(patched.substring(idx - 20, idx + 80));
} else {
    console.log("Not found");
}
