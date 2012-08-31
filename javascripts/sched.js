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

//pass in a <tr> DOM object; get an array of Session objects
function parseClass(tr) {
    var cells = tr.getElementsByTagName("td");
    if (cells.length < 7)
		return null;
    //First the easy ones
    var uniqueID = cells[0].innerHTML.trim();
    var course   = cells[1].innerHTML.trim();
    var title    = cells[2].innerHTML.trim();
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
    
    var sessions = new Array(Math.min(buildings.length, rooms.length, days.length, times.length));
    for (var s = 0; s < sessions.length; s++)
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

var drawParams = {
    colWidth: 256,	//one day == one col
    rowHeight: 128,	//one hour == one row
    edgeBufPx: 50,
	

    textFont: "16pt Sans",
	lineSpacing: 18,
	textColor: "black",

	colors: ["red", "green", "blue", "yellow", "purple", "orange", "cyan"]
//    ,startHour: 6,	//24-hour clock hours
//    endHour: 20		
};

function calculateDefaultParams(struct) {
    //let's construct the viewing window so that we have some buffer on each size
	
	var minH = 25, maxH = -1;
	for (var i = 0; i < struct.length; i++)
		for (var j = 0; j < struct[i].sessions.length; j++) {
			minH = Math.min(getHours24(struct[i].sessions[j].time.begin), minH);
			maxH = Math.max(getHours24(struct[i].sessions[j].time.end), maxH);
		}
	drawParams.startHour = minH - 1;
	drawParams.endHour = maxH + 1;

	//1 + the actual value here because we need the extra row/col for the grid labels
    drawParams.colWidth = (window.innerWidth - drawParams.edgeBufPx) / (1 + 5);
    drawParams.rowHeight = (window.innerHeight - drawParams.edgeBufPx) / (1 + drawParams.endHour - drawParams.startHour);
	
}

//drawing stuff
function translate(r, xi, yi) {
    return new Rectangle(r.x+xi, r.y+yi, r.width, r.height);
}

function draw(struct) {
    calculateDefaultParams(struct);
    canvas = document.getElementById("schc");
    c = canvas.getContext('2d');
    c.strokeStyle = "black";
	c.lineWidth = 2;
    drawLabels(c, drawParams);
    c.translate(drawParams.colWidth, drawParams.rowHeight);
    drawGrid(c, drawParams);
	
	c.font = "10pt Sans";
	for (var i=0;  i <struct.length; i++) {
		drawClassRects(c, struct[i], drawParams.colors[i], drawParams);
	}
}

function drawClassRects(ctx, cl, color, dpar) {
	for (var i = 0; i < cl.sessions.length; i++) {
		var s = cl.sessions[i];
		for (var j = 0; j < s.days.length; j++) {
			var d = s.days[j];
			var rect = translate(getTSRect(s.time, dpar), dpar.colWidth * dayOrdinal(d), 0);
			fillRect(ctx, rect, color);
			ctx.fillStyle = dpar.textColor;
			//drawCenteredText(ctx, cl.name+"\n"+cl.title+"\n"+s.building+" "+s.room, rect);
			drawCenteredText(ctx, cl.name+"\n"+s.building+" "+s.room, rect, dpar);
		}
	}
}

function drawLabels(ctx, d) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = d.textFont;
    
    function hourSpanAt(h) {
		return new Timespan(createTime24(h, 0), createTime24(1+h, 0));
    }
    for (var day = 0; day < 5; day++) {
		var baseX = (day+1)*d.colWidth;
		ctx.strokeRect(baseX, 0, d.colWidth, d.rowHeight);	
		ctx.fillText(dayNames[day], baseX + d.colWidth/2, d.rowHeight/2);
    }
    for (var hour = d.startHour; hour < d.endHour; hour++) {
		var baseY = (1 + hour-d.startHour)*d.rowHeight;
		ctx.strokeRect(0, baseY, d.colWidth, d.rowHeight);
		ctx.fillText(showTimespan(hourSpanAt(hour)), d.colWidth/2, baseY + d.rowHeight/2);
    }
}

//expect the ctx to already have been translated the appropriate amount
function drawGrid(ctx, d) {
	console.log("d", d);
    for (var day = 0; day < 5; day++)
		for (var hour = d.startHour; hour < d.endHour; hour++) {
			console.log("sH", d.startHour);
			ctx.strokeRect(day*d.colWidth, (hour - d.startHour)*d.rowHeight, d.colWidth, d.rowHeight);
		}
}

//timespan -> rectangle (x = 0)
function getTSRect(ts, d) {
	function timeToPixels(t) {
		return ((getHours24(t) - d.startHour) + t.minutes / 60) * d.rowHeight;
	}
	var topY = timeToPixels(ts.begin), botY = timeToPixels(ts.end);
	return new Rectangle(0, topY, d.colWidth, botY - topY);
}

function fillRect(ctx, rect, color) {
	ctx.fillStyle = color;
	ctx.fillRect(rect.x + ctx.lineWidth/2, rect.y + ctx.lineWidth/2, rect.width - ctx.lineWidth, rect.height - ctx.lineWidth);
}

function drawCenteredText(ctx, str, rect, d) {
	var lines = str.split("\n"), nLines = lines.length;
	var base  = rect.y + rect.height / 2;
	var centerLineIdx = nLines / 2;
	centerLineIdx = (nLines % 2 == 0) ? centerLineIdx - 1/2 : Math.floor(centerLineIdx);

	var spacing = d.lineSpacing;
	for (var i = 0; i<nLines; i++) {
		ctx.fillText(lines[i], rect.x + rect.width/2, spacing*(i - centerLineIdx) + base);
	}
}
