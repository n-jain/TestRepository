angular.module("bluvueSheet", []);

angular.module("bluvueSheet").directive("bvSheet", [
    function sheetDirective() {
        'use strict';

        return {
            scope: {
                sheet: "=",
                userId: "="
            },
            restrict: "E",
            replace: true,
            transclude: false,
            templateUrl: "sheet.html",
            link: function bvSheetLink(scope) {
                // sheet object
                /* {
                 * id: 'guid',
                 * projectId: 'guid',
                 * slicesUrl: '',
                 * previewUrl: '',
                 * annotations: []
                 * }
                 */

                // annotation object
                /*
                 * {
                 * id: 'guid',
                 * userId: 'guid',
                 * data: 'json string'
                 * type: int
                 * }
                 */

                loadSheet(scope.sheet.slicesUrl, scope.sheet.previewUrl, scope.sheet.sheetId, scope.sheet.projectId, scope.userId);
            }
        }
    }
]);

var tileView;
var toolMenu;
var optionsMenu;
var colorMenu;
var textEditor;

var userId;
var projectId;
var sheetId;

function loadSheet(slicePath,previewPath,sheet,project,user){
    sheetId=sheet;
    projectId=project;
    userId=user;
    //make on screen controls
    toolMenu = new ToolMenu();
    optionsMenu = new OptionsMenu();
    colorMenu = new ColorMenu();
    textEditor = new TextEditor();
    
    var canvas = document.getElementById('canvas1');
    //make tileView
    tileView = new TileView(canvas,toolMenu,optionsMenu,colorMenu,textEditor);
    tileView.create(slicePath,previewPath);

    //create loop
    setInterval(mainLoop, 1000/60);
    //setup key controls
    window.addEventListener("keydown",tileView.keyboardControls.onKeyDown,true);
    window.addEventListener("keyup",tileView.keyboardControls.onKeyUp,true);
    //setup mouse controls
    canvas.onmousedown = tileView.mouseControls.onmousedown;
    canvas.onmouseup = tileView.mouseControls.onmouseup;
    canvas.onmousemove = tileView.mouseControls.onmousemove;
    canvas.onclick = tileView.mouseControls.onclick;
    canvas.ondblclick = tileView.mouseControls.ondblclick;

    window.addEventListener("mousewheel",tileView.mouseControls.onmousewheel,true);
    window.addEventListener("DOMMouseScroll",tileView.mouseControls.onmousewheel,true);    
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
function textUpdate(text){
    tileView.annotationManager.textUpdate(text);
}
function setTextSize(textSize){
    tileView.annotationManager.setTextSize(textSize);
    tileView.textSize=textSize;
}
function mainLoop(){
    tileView.mainLoop();
}