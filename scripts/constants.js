var NO_TOOL=-1; 
var LASSO_TOOL=0;
var SQUARE_TOOL=1;
var X_TOOL=2;
var CIRCLE_TOOL=3;
var CLOUD_TOOL=4;
var POLYGON_TOOL=5;
var TEXT_TOOL=6;
var LINE_TOOL=7;
var ARROW_TOOL=8;
var PEN_TOOL=9;
var HIGHLIGHTER_TOOL=10;
var SCALE_TOOL=11;
var MAIL_TOOL=12;

var NO_ANNOTATION=-1;
var SQUARE_ANNOTATION=1;
var X_ANNOTATION=2;
var CIRCLE_ANNOTATION=3;
var CLOUD_ANNOTATION=4;
var POLYGON_ANNOTATION=5;
var TEXT_ANNOTATION=6;
var LINE_ANNOTATION=7;
var ARROW_ANNOTATION=8;
var PEN_ANNOTATION=9;
var HIGHLIGHTER_ANNOTATION=10;
var SCALE_ANNOTATION=11;
var MEASURE_ANNOTATION=12;

function toolToAnnotation(tool){
	switch(tool){
		case SQUARE_TOOL:
			return SQUARE_ANNOTATION;
		case X_TOOL:
			return X_ANNOTATION;
		case CIRCLE_TOOL:
			return CIRCLE_ANNOTATION;
		case CLOUD_TOOL:
			return CLOUD_ANNOTATION;
		case POLYGON_TOOL:
			return POLYGON_ANNOTATION;
		case TEXT_TOOL:
			return TEXT_ANNOTATION;
		case LINE_TOOL:
			return LINE_ANNOTATION;
		case ARROW_TOOL:
			return ARROW_ANNOTATION;
		case PEN_TOOL:
			return PEN_ANNOTATION;
		case HIGHLIGHTER_TOOL:
			return HIGHLIGHTER_ANNOTATION;
		case SCALE_TOOL:
			return SCALE_ANNOTATION;
	}
	return NO_ANNOTATION;
}

var LINE_WIDTH = 2;
var LINE_WIDTH_HIGHLIGHTER = 23;

//MEASUREMENT
//LENGTH
var IN=0;
var FT=1;
var FT_IN=2;
var YD=3;
var MI=4;
var CM=5;
var M=6;
var KM=7;
	
//AREA
var IN2=0;
var FT2=1;
var YD2=2;
var AC=3;
var MI2=4;
var CM2=5;
var M2=6;
var HA=7;
var KM2=8;

//TYPES
var LENGTH = 0;
var AREA = 1;

var unitNames = [["IN","FT","FT IN","YD","MI","CM","M","KM"],
				["IN2","FT2","YD2","AC","MI2","CM2","M2","HA","KM2"]];