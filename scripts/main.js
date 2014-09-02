var tileView;
var toolMenu;
var optionsMenu;

window.onload = function() {
	//make canvas
	var canvas = document.getElementById('canvas1');
    //make on screen controls
    toolMenu = new ToolMenu();
    optionsMenu = new OptionsMenu();
	//make tileView
	tileView = new TileView(canvas,toolMenu,optionsMenu);
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
}
function mainLoop(){
    tileView.mainLoop();
}