var BluVueSheet = {};

var MAIN_LOOP_TIMEOUT = 1000 / 60;

var MIN_SCALE = 0.05;
var MAX_SCALE = 3;

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
var RULER_TOOL=11;
var MAIL_TOOL=12;
//change these to match the JSON ones
var NO_ANNOTATION=-1;
var LASSO_ANNOTATION=0;
var SQUARE_ANNOTATION=1;
var X_ANNOTATION=2;
var CIRCLE_ANNOTATION=3;
var CLOUD_ANNOTATION=5;
var POLYGON_ANNOTATION=13;
var TEXT_ANNOTATION=6;
var LINE_ANNOTATION=7;
var ARROW_ANNOTATION=4;
var PEN_ANNOTATION=8;
var HIGHLIGHTER_ANNOTATION=9;
var SCALE_ANNOTATION=11;
var MEASURE_ANNOTATION=10;

function toolToAnnotation(tool){
	switch(tool){
		case LASSO_TOOL:
			return LASSO_ANNOTATION;
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
		case RULER_TOOL:
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
var KM2 = 8;

BluVueSheet.Constants = {
    UnitNames: [
        ["IN", "FT", "FT IN", "YD", "MI", "CM", "M", "KM"],
        ["IN2", "FT2", "YD2", "AC", "MI2", "CM2", "M2", "HA", "KM2"]
    ],
    UnitDisplayNames: [
        ["IN", "FT", "FT,IN", "YD", "MI", "CM", "M", "KM"],
        ["IN<sup>2</sup>", "FT<sup>2</sup>", "YD<sup>2</sup>", "AC", "MI<sup>2</sup>", "CM<sup>2</sup>", "M<sup>2</sup>", "HA", "KM<sup>2</sup>"]
    ],
    Length: 0,
    Area: 1,
    OptionButtons: {
        Delete: { id: 0, className: "delete"},
        Color: { id: 1, className: "color" },
        Text: { id: 2, className: "text" },
        Area: { id: 3, className: "area" },
        UnitLength: { id: 4, className: "ruler" },
        UnitArea: { id: 5, className: "ruler" },
        Fill: { id: 6, className: "fill" },
        Master: { id: 7, className: "master" }
    }
};

var HANDLE_TOUCH_RADIUS = 30;
var BOUND_DIST = 15;
