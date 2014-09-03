var tileView;
var toolMenu;
var optionsMenu;
var colorMenu;
var textEditor;

window.onload = function() {
	//make canvas
	var canvas = document.getElementById('canvas1');
    //make on screen controls
    toolMenu = new ToolMenu();
    optionsMenu = new OptionsMenu();
	colorMenu = new ColorMenu();
    textEditor = new TextEditor();
    //make tileView
	tileView = new TileView(canvas,toolMenu,optionsMenu,colorMenu,textEditor);
    tileView.create();

	//create loop
    setInterval(mainLoop, 1000/60);
    //setup key controls
    window.addEventListener("keydown",tileView.keyboardControls.onKeyDown,true);
    window.addEventListener("keyup",tileView.keyboardControls.onKeyUp,true);
    //setup mouse controls
    canvas.onmousedown = tileView.mouseControls.onmousedown;
    canvas.onmouseup = tileView.mouseControls.onmouseup;
    canvas.onmousemove = tileView.mouseControls.onmousemove;
    window.addEventListener("mousewheel",tileView.mouseControls.onmousewheel,true);
    window.addEventListener("DOMMouseScroll",tileView.mouseControls.onmousewheel,true);

    httpGet("Users/Me");
}
function setTileRes(id){
    tileView.tileLoader.setTileRes(id);
}
function setTool(id){
    tileView.setTool(id);
}
function optionChosen(id){
    tileView.optionChosen(id);
    if(id==COLOR_OPTION){
        colorMenu.show();
    }
}
function setColor(colorName){
    var csv = colorName.slice(5,colorName.length-1);
    var vals = csv.split(",");
    var color = new Color(parseFloat(vals[0])/255,parseFloat(vals[1])/255,parseFloat(vals[2])/255,parseFloat(vals[3]));
    tileView.setColor(color);
    optionsMenu.setColor(color);
    colorMenu.hide();
}
function mainLoop(){
    tileView.mainLoop();
}