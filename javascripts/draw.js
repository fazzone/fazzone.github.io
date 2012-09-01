
function calculateDefaultParams(classes) {
    //defaults
	var drawParams = {
		colWidth: 256,	//one day == one col
		rowHeight: 128,	//one hour == one row
		edgeBufPx: 50,
		
		lineWidth: 2,
		
		controlDivEdgeBuf: 10,
		
		textFont: "16pt Sans",
		lineSpacing: 18,
		textColor: "black",
		
		colors: ["rgb(0,191,255)", "green", "yellow", "rgb(205,85,0)", "rgb(218,112,214)"]
	};
	
	//let's conclasses the viewing window so that we have some buffer on each size	
	var minH = 25, maxH = -1;
	for (var i = 0; i < classes.length; i++)
		for (var j = 0; j < classes[i].sessions.length; j++) {
			minH = Math.min(getHours24(classes[i].sessions[j].time.begin), minH);
			maxH = Math.max(getHours24(classes[i].sessions[j].time.end), maxH);
		}
	drawParams.startHour = minH - 1;
	drawParams.endHour = maxH + 1;

	//1 + the actual value here because we need the extra row/col for the grid labels
    drawParams.colWidth = (window.innerWidth - drawParams.edgeBufPx) / (1 + 5);
    drawParams.rowHeight = (window.innerHeight - drawParams.edgeBufPx) / (1 + drawParams.endHour - drawParams.startHour);
	return drawParams;
}

//drawing stuff
function translate(r, xi, yi) {
    return new Rectangle(r.x+xi, r.y+yi, r.width, r.height);
}

function draw(classes) {
	var dpar = calculateDefaultParams(classes);
    
	var cdiv = document.getElementById("controldiv");
	var e = dpar.controlDivEdgeBuf;
	var cdrect = centerRect(new Rectangle(0, 0, dpar.colWidth, dpar.rowHeight), dpar.controlDivEdgeBuf);
	cdiv.style.width = cdrect.width + "px";
	cdiv.style.height = cdrect.height + "px";
	cdiv.style.left = cdrect.x + "px";
	cdiv.style.top = cdrect.y + "px";

	canvas = document.getElementById("schc");
    c = canvas.getContext('2d');
    c.strokeStyle = "black";
	c.lineWidth = dpar.lineWidth;
    drawLabels(c, dpar);
    c.translate(dpar.colWidth, dpar.rowHeight);
    drawGrid(c, dpar);
	
	c.font = "10pt Sans";
	for (var i=0;  i <classes.length; i++) {
		drawClassRects(c, classes[i], dpar.colors[i], dpar);
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
			drawCenteredText(ctx, cl.name+"\n"+cl.title+"\n"+s.building+" "+s.room, rect, dpar);
			//drawCenteredText(ctx, cl.name+"\n"+s.building+" "+s.room, rect, dpar);
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
    for (var day = 0; day < 5; day++)
		for (var hour = d.startHour; hour < d.endHour; hour++)
			ctx.strokeRect(day*d.colWidth, (hour - d.startHour)*d.rowHeight, d.colWidth, d.rowHeight);
}

//timespan -> rectangle (x = 0)
function getTSRect(ts, d) {
	function timeToPixels(t) {
		return ((getHours24(t) - d.startHour) + t.minutes / 60) * d.rowHeight;
	}
	var topY = timeToPixels(ts.begin), botY = timeToPixels(ts.end);
	return new Rectangle(0, topY, d.colWidth, botY - topY);
}

function centerRect(rect, lineW) {
	return new Rectangle(rect.x + lineW/2, rect.y + lineW/2, rect.width - lineW, rect.height - lineW);
}

function fillRect(ctx, rect, color) {
	ctx.fillStyle = color;
	var r = centerRect(rect, ctx.lineWidth);
	ctx.fillRect(r.x, r.y, r.width, r.height);
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
