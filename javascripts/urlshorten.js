//Automatically pass the URL of the current page to a URL shortener.  This requires
//an unexpectedly large amount of wizardry

//escape only entities (&amp; etc), leave everything else untouched
function escapeEntities(str) {
	var regex = /(&.*?;)/g;
	var match = regex.exec(str);
	if (match == null)
		return str;
	return escapeEntities(str.replace(match[1], escape(match[1])));	
}

function shortenURL() {
	//is.gd is pretty cool
	window.location = "http://is.gd/create.php?url="+escapeEntities(window.location.href);
}
