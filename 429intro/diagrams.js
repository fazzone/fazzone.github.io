//Recursively process all DOM nodes, searching for IDs that we've hooked
function processDOM(node) {
	var cs = node.childNodes;
	if (cs != undefined)
		for (var i = 0; i < cs.length; i++)
			processDOM(cs[i]);
	writeHTML(node);
}

var hooks = {
	"bcd_table": bcdTable
}

function writeHTML(node) {
	if (hooks[node.id] != undefined)
		node.innerHTML = hooks[node.id]();
}

function fillPre(chr, len, str) {
	while (str.length < len)
		str = chr+str;
	return str;
}

//generate the decimal digit -> binary table
function bcdTable() {
	var s = "<tr><td>Decimal digit</td><td>Binary representation</td></tr>";
	for (var i=0; i<10; i++)
		s += "\n<tr><td>"+i+"</td><td>"+fillPre('0', 4, i.toString(2))+"</td></tr>";
	return s;
}

function redrawBCDDemo(e) {
	var n = parseInt(document.getElementById("bcddemoinput").value);
	if (n != n) { //NaN
		document.getElementById("bcddemotable").innerHTML = "";
		return;
	}
	var decString = n.toString();
	var s = "<tr>";
	for (var i=0; i<decString.length; i++)
		s += "<td>"+decString[i]+"</td>";
	s += "</tr><tr>";
	for (var i=0; i<decString.length; i++)
		s += "<td>"+parseInt(decString[i]).toString(2)+"</td>";
	s += "</tr>";
	document.getElementById("bcddemotable").innerHTML = s;
}
