m_params = undefined;

function drawParams() {
	//Square colors shamelessly stolen from how Wikipedia draws chessboards
	 this.color_whiteSquare = "#FFCE9E";
	 this.color_blackSquare = "#D18B47";
	 this.color_annotation = "#000000";
	 //what fraction of the width/height are we going to inset annotations by? (to center them)
	 this.annotation_inset = 1/3;
}

//draw a square in the right place in the right color
function drawSquare(ctx, params, row, col) {
	ctx.fillStyle = (row % 2 == col % 2) ? params.color_whiteSquare : params.color_blackSquare;
	ctx.fillRect(col * params.sqwidth, row * params.sqheight, params.sqwidth, params.sqheight);	
	drawCircle(ctx, params, row, col);
	drawCross(ctx, params, row, col);
}



//put an X on a given square
function drawCross(ctx, params, row, col) {
	ctx.save();
	
	ctx.scale(params.sqwidth, params.sqheight);
	ctx.strokeStyle = params.color_annotation;	
	ctx.lineWidth = 0.1;	//made up

	var ins = params.annotation_inset;	
	ctx.beginPath();
	ctx.moveTo(col + ins, row + ins);			//top left
	ctx.lineTo(col + 1 - ins, row + 1 - ins);	//bottom right
	ctx.moveTo(col + ins, row + 1 - ins);		//bottom left;
	ctx.lineTo(col + 1 - ins, row + ins);		//top right
	ctx.closePath();
	
	ctx.stroke();
	ctx.restore();
}

function drawCircle(ctx, params, row, col) {
	ctx.save();
	
	ctx.scale(params.sqwidth, params.sqheight);
	ctx.fillStyle = "white";

	var ins = params.annotation_inset;	
	ctx.beginPath();
	ctx.arc(col + 1/2, row + 1/2, 1/2 - ins, 0, 2*Math.PI, true);
	ctx.closePath();
	
	ctx.fill();
	ctx.restore();
}

function drawBoard(ctx, params) {
	for (var r = 0; r < 8; r++)
		for (var c = 0; c < 8; c++)
			drawSquare(ctx, params, r, c);
}

function init() {
	var cvs = document.getElementById("cvs");
	var params = new drawParams();
	params.sqheight = cvs.height / 8;
	params.sqwidth = cvs.width / 8;
	m_params = params;
	
	var ctx = cvs.getContext('2d');
	m_ctx = ctx;
	drawBoard(ctx, params);
}
