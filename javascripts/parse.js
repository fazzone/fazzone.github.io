//objects/ctors, top-down
function Class(name, title, ss) {
    this.name = name;
    this.title = title;
    this.sessions = ss;
}

function Session(bldg, room, days, time) {
    this.building = bldg;
    this.room = room;
    this.days = days;
    this.time = time;
}

function Timespan(a, b) {
    this.begin = a;
    this.end = b;
}

function Time(hh, mm, pm) {
    this.hours = hh;
    this.minutes = mm;
    this.isPM = pm;
}

//not sure how I'd write this as a 'proper' ctor
function createTime24(h, m) {
    if (h == 0)
		return new Time(12, m, false);
    var pm = h >= 12;
    if (pm & h > 12)
		h -= 12;
    
    return new Time(h, m, pm);
}

function getHours24(t) {
	if (!t.isPM && t.hours == 12)
		return 0;
	if (t.isPM && t.hours < 12)
		return 12 + t.hours;
	return t.hours;
}

function Rectangle(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
}

//parsing and printing, bottom-up
//first times
function parseTime(str) {
    var t = str.trim().match(/(\d+):(\d\d)(am|pm)/);
    //Have to include the radix in the second parseInt because if we don't,
    //and try to parse something like "9:09am", it tries to parse "09" as
    //octal because of the leading zero -- and returns zero (not what we want)

    return new Time(parseInt(t[1]), parseInt(t[2], 10), (t[3] == "pm"));
}

function showTime(t) {
    function zeroPad(n) {
		return (n < 10 ? "0" : "") + n;
    }
    return t.hours + ":" + zeroPad(t.minutes) + (t.isPM ? "pm" : "am");
}

function showTimespan(t) {
    return showTime(t.begin) + " - " + showTime(t.end);
}

//timespans look like "1:00pm- 2:00pm"
function parseTimespan(str) {
    var times = str.split("-").map(parseTime);
    return new Timespan(times[0], times[1]);
}

var dayAbbrevs = ["M", "T", "W", "TH", "F"];
var dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

//now days
function parseDayAbbrev(str) {
    var sDays = new Array();
    while (str.length > 0)
		//iterate backwards to get Thursday first so we don't eat a T and get stuck in an infinite loop on 'H'
		for (var ai=dayAbbrevs.length - 1; ai >= 0; ai--)
			if (str.indexOf(dayAbbrevs[ai]) == 0) {
				sDays.push(dayNames[ai]);
				str = str.substring(dayAbbrevs[ai].length);
			}
    return sDays;
}

function dayOrdinal(d) {
	return dayNames.indexOf(d);
}

//misc
/*A huge security hole -- it would allow the admins of UT Direct (unlikely) to
sneak Javascript code (in <script> tags or whatever) into the schedule-table (unlikely) 
which could then be used to steal our data or something -- all of which comes from them,
so I see no reason to make this function "secure" */
function entityDecode(str) {
	var div = document.createElement('div');
	div.innerHTML = str;
	return div.textContent;
}


//pass in a <tr> DOM object; get an array of Session objects (or null, if the <tr>
//element passed in does not describe a valid class)
function parseClass(tr) {
    var cells = tr.getElementsByTagName("td");
    if (cells.length < 7)
		return null;
    //First the easy ones
    var uniqueID = cells[0].innerHTML.trim();
    var course   = cells[1].innerHTML.trim();
    var title    = entityDecode(cells[2].innerHTML.trim());	//for &amp;s and the like
    //Now things get tricky.  When a class has multiple locations,times etc
    //UTDirect gives up a table with <br>s in the <td>s -- so we'll have to
    //read those and do a sort of transpose to get what we want.
    
    //One other annoying/tricky bit is that since UTDirect has the building
    //names link to the building pages on the UT website, the building names
    //are enclosed in <a> tags (the bookmarklet javascript cuts the href
    //because it's just dead weight, but it leaves the tags because it's not
    //really a significant reduction in data size - so we've got to do that here
    var buildingsHTML = cells[3].innerHTML.split("<br>");
    function removeAnchor(s) {
		//s looks something like "<a> XXX </a>"
		return s.match(/>(\s*)(.*?)(\s*)</)[2];
    }

    //probably a better way to do this (map using a member function)
    //String.prototype.trim?
    //nm for non-member
    function nmTrim(s) {
		return s.trim();
    }

    var buildings = buildingsHTML.map(removeAnchor);    
    var rooms     = cells[4].innerHTML.split("<br>").map(nmTrim);
    var days      = cells[5].innerHTML.split("<br>").map(nmTrim);
    var times     = cells[6].innerHTML.split("<br>").map(nmTrim);
    
	//before we go further, we'll do a quick check that we have at least something
	//for each field (I have seen schedules with rows that have empty cells, so this
	//is necessary to make the script not break in that case)
	var fields = [buildings, rooms, days, times];
	var minLen = 1024;
	for (var i in fields)
		if (fields[i].length < 1 || fields[i][0].length == 0)
			return null;
		else minLen = Math.min(minLen, fields[i].length);
		
    var sessions = new Array(minLen);
    for (var s=0; s < minLen; s++)
		sessions[s] = new Session(buildings[s], rooms[s], parseDayAbbrev(days[s]), parseTimespan(times[s]));
    return new Class(course, title, sessions);
}

function getTableHTML() {
    //decode before substring because otherwise the < gets escaped
    //and we can't find it with substring
    var dd = decodeURIComponent(window.location);
    return dd.substring(dd.indexOf("<tbody")).replace(/\+/g, ' ');
}

function readClasses(htmlstr) {
    //create that DOM table so we can walk through it
    var tbl = document.createElement("table");
    tbl.innerHTML = htmlstr;
	
    var rows = tbl.getElementsByTagName("tr");
    var vs = new Array();
    for (var i = 0; i < rows.length; i++) {
		var v = parseClass(rows[i]);
		if (v)
			vs.push(v);
    }
    return vs;
}

