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
        ["IN&sup2;", "FT&sup2;", "YD&sup2;", "AC", "MI&sup2;", "CM&sup2;", "M&sup2;", "HA", "KM&sup2;"]
    ],
    TextSizes: [32,64,128,256,512],
    Length: 0,
    Area: 1,
    HeaderHeight: 42,
    FooterHeight: 66,
    HideButton: {className: "hide"},
    OptionButtons: {
        Delete: { id: 0, className: "delete"},
        Color: { id: 1, className: "color" },
        Text: { id: 2, className: "text" },
        Area: { id: 3, className: "area" },
        UnitLength: { id: 4, className: "ruler" },
        UnitArea: { id: 5, className: "ruler" },
        Fill: { id: 6, className: "fill" },
        Master: { id: 7, className: "master" },
        Copy: {id: 8, className: "copy"},
        Perimeter: { id: 9, className: "ruler" }
    },
    Tools: {
        //menuId is the id of the menuButton it is part of
        //menuIndex is its index within that menu
        Lasso: { id: 0, name: "lasso", menuId: 0, menuIndex: 0, description:"Click and drag around annotations to select them.", heroImage:"images/update/icon_toolbars_lasso_white.png" },
        Square: { id: 1, name: "square", menuId: 1, menuIndex: 1, description:"Click and drag to place a rectangle on the drawing.", heroImage:"images/update/icon_toolbars_rectangle_white.png" },
        X: { id: 2, name: "x", menuId: 2, menuIndex: 2, description:"Click and drag to place an X on the drawing.", heroImage:"images/update/icon_toolbars_x_white.png" },
        Circle: { id: 3, name: "circle", menuId: 1, menuIndex: 0, description:"Click and drag to place an oval on the drawing.", heroImage:"images/update/icon_toolbars_circle_white.png" },
        Cloud: { id: 4, name: "cloud", menuId: 1, menuIndex: 2, description:"Click and drag to place a cloud on the drawing.", heroImage:"images/update/icon_toolbars_cloud_white.png" },
        Polygon: { id: 5, name: "polygon", menuId: 1, menuIndex: 3, description:"Click each corner of a polygon to place on the drawing. Double click to complete the polygon.", heroImage:"images/update/icon_toolbars_polygon_white.png" },
        Text: { id: 6, name: "text", menuId: 5, menuIndex: 0, description:"Click to place a text box. You can reposition the text by tapping it to select and then dragging it.", heroImage:"images/update/icon_toolbars_text_white.png" },
        Line: { id: 7, name: "line", menuId: 2, menuIndex: 0, description:"Click and drag to place a line on the drawing.", heroImage:"images/update/icon_toolbars_line_white.png" },
        Arrow: { id: 8, name: "arrow", menuId: 2, menuIndex: 1, description:"Click and drag to place an arrow on the drawing.", heroImage:"images/update/icon_toolbars_arrow_white.png" },
        Pen: { id: 9, name: "pen", menuId: 3, menuIndex: 0, description:"Click and drag to draw a line on the drawing.", heroImage:"images/update/icon_toolbars_pencil_white.png" },
        Highlighter: { id: 10, name: "highlighter", menuId: 3, menuIndex: 1, description:"Click and drag to highlight part of the drawing.", heroImage:"images/update/icon_toolbars_highlighter_white.png" },
        Ruler: { id: 11, name: "ruler", menuId: 4, menuIndex:0, description:"Click and drag to place a measured line on the drawing.", heroImage:"images/update/icon_toolbars_ruler_white.png" }
        //Freeform: { id: 12, name: "freeform", menuId: 1, menuIndex: 4, description:"Click and drag to draw a freeform shape on the drawing.", heroImage:"images/update/icon_toolbars_freeform_white.png" }
        //Calibration: { id: 13, name: "calibration", menuId: 4, menuIndex: 2, description:"Click and drag a scale that will be used for calculating area and perimeter for other annotations.", heroImage:"images/update/icon_toolbars_calibrate_white.png" }
    },
    ToolMenuButtons: {
       Lasso: { id: 0, name: "lasso-button" },
       ClosedAnnotations: { id: 1, name: "closed-annotations-button" },
       LineAnnotations: { id: 2, name: "line-annotations-button" },
       FreeAnnotations: { id: 3, name: "free-annotations-button" },
       MeasurementAnnotations: { id: 4, name: "measurement-annotations-button" },
       TextAnnotations: { id: 5, name: "text-button" },
       HideMenu: { id: 6, name: "hide-button" }
    },
    Colors: [
        { id: 0, className: "pink", color: new Color(0.898, 0, 0.273, 1), imageURL: "images/update/color_pink.png"},
        { id: 1, className: "blue", color: new Color(0.059, 0.391, 0.898, 1), imageURL: "images/update/color_blue.png"},
        { id: 2, className: "green", color: new Color(0.293, 0.648, 0, 1), imageURL: "images/update/color_green.png"},
        { id: 3, className: "yellow", color: new Color(0.773, 0.797, 0, 1), imageURL: "images/update/color_yellow.png"},
        { id: 4, className: "orange", color: new Color(0.840, 0.508, 0, 1), imageURL: "images/update/color_orange.png"},
        { id: 5, className: "purple", color: new Color(0.781, 0, 0.875, 1), imageURL: "images/update/color_purple.png"},
        { id: 6, className: "dark_purple", color: new Color(0.332, 0.117, 0.410, 1), imageURL: "images/update/color_dark_purple.png"},
        { id: 7, className: "aqua", color: new Color(0.086, 0.781, 0.809, 1), imageURL: "images/update/color_aqua.png"},
        { id: 8, className: "brown", color: new Color(0.469, 0.313, 0.156, 1), imageURL: "images/update/color_brown.png"}
    ],
    MoreMenu: [
        { id: 0, click: "edit_sheet_name", text: "Edit Sheet Name", imageURL: "images/update/icon_edit_name.png"},
        { id: 1, click: "edit_sheet_revision", text: "Change Revision", imageURL: "images/update/icon_edit_revision.png"},
        { id: 2, click: "rotate_sheet", text: "Rotate Sheet", imageURL: "images/update/icon_edit_rotate.png"},
        { id: 3, click: "share_sheet", text: "Share Sheet", imageURL: "images/update/icon_edit_share.png"},
    ]
};
//Define the items in the button menus
BluVueSheet.Constants.ToolMenuButtons.Lasso.buttons = [BluVueSheet.Constants.Tools.Lasso];
BluVueSheet.Constants.ToolMenuButtons.ClosedAnnotations.buttons = [BluVueSheet.Constants.Tools.Circle,
                                                                BluVueSheet.Constants.Tools.Square,
                                                                BluVueSheet.Constants.Tools.Cloud,
                                                                BluVueSheet.Constants.Tools.Polygon];
BluVueSheet.Constants.ToolMenuButtons.LineAnnotations.buttons = [BluVueSheet.Constants.Tools.Line,
                                                                BluVueSheet.Constants.Tools.Arrow,
                                                                BluVueSheet.Constants.Tools.X];
BluVueSheet.Constants.ToolMenuButtons.FreeAnnotations.buttons = [BluVueSheet.Constants.Tools.Pen,
                                                                 BluVueSheet.Constants.Tools.Highlighter];
BluVueSheet.Constants.ToolMenuButtons.MeasurementAnnotations.buttons = [BluVueSheet.Constants.Tools.Ruler];
BluVueSheet.Constants.ToolMenuButtons.TextAnnotations.buttons = [BluVueSheet.Constants.Tools.Text];
BluVueSheet.Constants.ToolMenuButtons.HideMenu.buttons = [BluVueSheet.Constants.HideButton];

var HANDLE_TOUCH_RADIUS = 30;
var BOUND_DIST = 20;
