const { jsPDF } = require('jspdf');

const doc = new jsPDF();
doc.text("Link with parens", 10, 10);
// This URL has a parenthesis
const url = "https://example.com/path(with)parens";
doc.link(10, 10, 20, 10, { url: url });

const output = doc.output();
console.log("Full Link Object:");
const linkIdx = output.indexOf('/URI');
console.log(output.substring(linkIdx, output.indexOf('>>', linkIdx) + 5));

const patched = output.replace(/\/S \/URI \/URI \((.*?)\) >>/g, '/S /URI /URI ($1) /NewWindow true >>');
console.log("\nPatched result:");
const patchedIdx = patched.indexOf('/URI');
console.log(patched.substring(patchedIdx, patched.indexOf('>>', patchedIdx) + 5));
