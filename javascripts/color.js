//Our goal: to be able to create a color scheme of any number of colors (call this number N)
//such that the colors are maximally distinguishable (as different as possible).  It turns out
//that for stuff like this RGB really isn't a good color model.  RGB is really simple to implement,
//and it's closest to how monitor hardware works (each pixel consists of three "pel"s, one red,
//one green, one blue) -- but it's not particularly close to human perception of color.  The
//next-simplest color model (well, for some values of simple) is HSV, or Hue, Saturation, and Value.
//Where RGB essentially maps colors onto a cube (1 dimension for each additive primary color),
//HSV is a cylindrical coordinate system - hue is an angle (conventially given in degrees), 
//and then value is 'height' and saturation is 'radius'.  In order to draw a color wheel,
//we simply hold S and V constant and draw each pie-slice at angle theta with H = theta.


function toRadians(angdeg) {
	return Math.PI / 180 * angdeg;
}

//So to get N colors that are equally/maximally different from each other, all we need to do
//is pick points that equally divide the entire color wheel/spectrum.
function getSubdivColors(n, s, v) {
	var inc = 360 / n;
	var cs = new Array();
	for (var theta = 0; theta < 360; theta += inc)
		cs.push(colorString(toRGB(theta, s, v)));
	return cs;
}
//copied from http://yui.yahooapis.com/2.9.0/build/colorpicker/colorpicker.js
function toRGB(h, s, v) { 
    var r, g, b,
    i = Math.floor((h/60)%6),
    f = (h/60)-i,
    p = v*(1-s),
    q = v*(1-f*s),
    t = v*(1-(1-f)*s);

    switch (i) {
    	case 0: r=v; g=t; b=p; break;
    	case 1: r=q; g=v; b=p; break;
	    case 2: r=p; g=v; b=t; break;
	    case 3: r=p; g=q; b=v; break;
	    case 4: r=t; g=p; b=v; break;
	    case 5: r=v; g=p; b=q; break;
    }

	function stretch(n) {
        return Math.min(255, Math.round(n*256));
	}
	return [stretch(r), stretch(g), stretch(b)];
}

function colorString(c) {
	return "rgb("+c[0]+","+c[1]+","+c[2]+")";
}
