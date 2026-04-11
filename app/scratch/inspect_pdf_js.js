const { jsPDF } = require('jspdf');

const doc = new jsPDF();
doc.text("Test Link", 10, 10);
doc.link(10, 10, 20, 10, { url: "javascript:app.launchURL('https://www.google.com', true);" });

const output = doc.output();
console.log(output.substring(output.indexOf('/URI'), output.indexOf('>>', output.indexOf('/URI')) + 2));
