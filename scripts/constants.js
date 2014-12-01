var BluVueSheet = {};

var MAIN_LOOP_TIMEOUT = 1000 / 60;

var MIN_SCALE = 0.05;
var MAX_SCALE = 3;

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
var SCALE_ANNOTATION=10;
var MEASURE_ANNOTATION=11;

function toolToAnnotation(tool){
	switch(tool){
		case BluVueSheet.Constants.Tools.Lasso:
			return LASSO_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Square:
			return SQUARE_ANNOTATION;
	    case BluVueSheet.Constants.Tools.X:
			return X_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Circle:
			return CIRCLE_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Cloud:
			return CLOUD_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Polygon:
			return POLYGON_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Text:
			return TEXT_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Line:
			return LINE_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Arrow:
			return ARROW_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Pen:
			return PEN_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Highlighter:
			return HIGHLIGHTER_ANNOTATION;
	    case BluVueSheet.Constants.Tools.Ruler:
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
        ["IN", "FT", "FTIN", "YD", "MI", "CM", "M", "KM"],
        ["IN2", "FT2", "YD2", "AC", "MI2", "CM2", "M2", "HA", "KM2"]
    ],
    UnitDisplayNames: [
        ["IN", "FT", "FT,IN", "YD", "MI", "CM", "M", "KM"],
        ["IN<sup>2</sup>", "FT<sup>2</sup>", "YD<sup>2</sup>", "AC", "MI<sup>2</sup>", "CM<sup>2</sup>", "M<sup>2</sup>", "HA", "KM<sup>2</sup>"]
    ],
    Length: 0,
    Area: 1,
    HeaderHeight: 42,
    FooterHeight: 66,
    OptionButtons: {
        Delete: { id: 0, className: "delete"},
        Color: { id: 1, className: "color" },
        Text: { id: 2, className: "text" },
        Area: { id: 3, className: "area" },
        UnitLength: { id: 4, className: "ruler" },
        UnitArea: { id: 5, className: "ruler" },
        Fill: { id: 6, className: "fill" },
        Master: { id: 7, className: "master" }
    },
    Tools: {
        Lasso: { id: 0, name: "lasso" },
        Square: { id: 1, name: "square" },
        X: { id: 2, name: "x" },
        Circle: { id: 3, name: "circle" },
        Cloud: { id: 4, name: "cloud" },
        Polygon: { id: 5, name: "polygon" },
        Text: { id: 6, name: "text" },
        Line: { id: 7, name: "line" },
        Arrow: { id: 8, name: "arrow" },
        Pen: { id: 9, name: "pen" },
        Highlighter: { id: 10, name: "highlighter" },
        Ruler: { id: 11, name: "ruler" }
    }
};

var HANDLE_TOUCH_RADIUS = 30;
var BOUND_DIST = 15;
