const { jsPDF } = require('jspdf');

const doc = new jsPDF();
doc.text("Test Link", 10, 10);
doc.link(10, 10, 20, 10, { url: "https://www.google.com", target: "_blank", newWindow: true });

const output = doc.output();
console.log(output.substring(output.indexOf('/URI'), output.indexOf('>>', output.indexOf('/URI')) + 2));
