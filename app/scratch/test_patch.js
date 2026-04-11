const { jsPDF } = require('jspdf');

const doc = new jsPDF();
doc.text("Test Link", 10, 10);
doc.link(10, 10, 20, 10, { url: "https://www.google.com" });

let output = doc.output();
console.log("Before:", output.substring(output.indexOf('/URI'), output.indexOf('>>', output.indexOf('/URI')) + 2));

// Patching the output
output = output.replace(/\/S \/URI \/URI \((.*?)\) /g, '/S /URI /URI ($1) /NewWindow true ');
console.log("After: ", output.substring(output.indexOf('/URI'), output.indexOf('>>', output.indexOf('/URI')) + 2));
