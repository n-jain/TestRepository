BluVueSheet.Sheet = function() {
    this.tileView = null;

    this.optionsMenu = null;
    this.floatingOptionsMenu = null;
    this.textEditor = null;

    this.closeSheetButton = null;
    this.userInterface = null;
    this.disposed = false;
    this.canvas = null;

    this.userId = null;
    this.projectId = null;
    this.sheetId = null;
    this.mainLoopTimeout = null;

    var t = this;

    this.setLoaded = function () {
        t.userInterface.style.display = "block";
    }

    this.setLoading = function () {
        t.userInterface.style.display = "none";
    }

    this.loadSheet = function (sheet, scope, elem) {
        this.sheetId = sheet.sheetId;
        this.projectId = sheet.projectId;
        this.userId = sheet.userId;
        
        //make on screen controls
        this.userInterface = document.createElement("div");

        this.optionsMenu = new BluVueSheet.OptionsMenu(this, scope);
        this.floatingOptionsMenu = new BluVueSheet.FloatingOptionsMenu(this, scope);
        this.textEditor = new BluVueSheet.TextEditor(this.textUpdate, this.setTextSize);

        this.optionsMenu.appendTo(this.userInterface);
        this.floatingOptionsMenu.appendTo(this.userInterface);
        this.userInterface.appendChild(this.textEditor.textEditorElement);
        elem.append(this.userInterface);
        
        this.canvas = elem.find('canvas')[0];

        this.setLoading();

        //make tileView
        this.tileView = new BluVueSheet.TileView(this, this.canvas, scope, this.setLoading, this.setLoaded, scope.deselectTool);
        this.tileView.create(sheet);
        this.tileView.render();

        //create loop
        var mainLoop = function () {
            t.tileView.mainLoopKeyboardControls();
            t.mainLoopTimeout = setTimeout(mainLoop, MAIN_LOOP_TIMEOUT);
        }

        this.mainLoopTimeout = setTimeout(mainLoop, MAIN_LOOP_TIMEOUT);

        //setup key controls
        window.addEventListener("keydown", this.tileView.keyboardControls.onKeyDown, true);
        window.addEventListener("keyup", this.tileView.keyboardControls.onKeyUp, true);
        //setup mouse controls

        this.canvas.onmousedown = this.tileView.mouseControls.onmousedown;
        this.canvas.onmouseup = this.tileView.mouseControls.onmouseup;
        this.canvas.onmousemove = this.tileView.mouseControls.onmousemove;
        this.canvas.onclick = this.tileView.mouseControls.onclick;
        this.canvas.ondblclick = this.tileView.mouseControls.ondblclick;
        

        this.canvas.addEventListener("touchstart", this.tileView.mouseControls.ontouchstart, true);
        this.canvas.addEventListener("touchmove", this.tileView.mouseControls.ontouchmove, true);
        this.canvas.addEventListener("touchend", this.tileView.mouseControls.ontouchend, true);
        this.canvas.addEventListener("touchcancel", this.tileView.mouseControls.ontouchcancel, true);
        this.canvas.addEventListener("mousewheel", this.tileView.mouseControls.onmousewheel, true);
        this.canvas.addEventListener("DOMMouseScroll", this.tileView.mouseControls.onmousewheel, true);
    };

    this.dispose = function () {
        if (t.disposed) { return; }
        clearTimeout(t.mainLoopTimeout);
        t.tileView.dispose();
        t.userInterface.parentElement.removeChild(t.userInterface);

        t.canvas.onmousedown = null;
        t.canvas.onmouseup = null;
        t.canvas.onmousemove = null;
        t.canvas.onclick = null;
        t.canvas.ondblclick = null;

        this.canvas.removeEventListener("keydown", t.tileView.keyboardControls.onKeyDown, true);
        this.canvas.removeEventListener("keyup", t.tileView.keyboardControls.onKeyUp, true);
        this.canvas.removeEventListener("mousewheel", t.tileView.mouseControls.onmousewheel, true);
        this.canvas.removeEventListener("DOMMouseScroll", t.tileView.mouseControls.onmousewheel, true);
        this.canvas.removeEventListener("touchstart", this.tileView.mouseControls.ontouchstart, true);
        this.canvas.removeEventListener("touchmove", this.tileView.mouseControls.ontouchmove, true);
        this.canvas.removeEventListener("touchend", this.tileView.mouseControls.ontouchend, true);
        this.canvas.removeEventListener("touchcancel", this.tileView.mouseControls.ontouchcancel, true);
        t.disposed = true;
    };

    this.resetZoom = function() {
        t.tileView.fitToScreen();
    }

    this.setTool = function (tool) {
        t.tileView.setTool(tool);
    };

    this.hideOptionMenus = function() {
        t.optionsMenu.hideAllMenus();
    }

    this.convertToUnit = function(type, subType) {
        t.tileView.convertToUnit(type, subType);
        t.optionsMenu.lengthUnitConverter.hide();
        t.optionsMenu.areaUnitConverter.hide();
    }

    this.setColor = function (colorName) {
        var color = colorFromString(colorName);
        t.tileView.setColor(color);
        t.optionsMenu.setColor(color);
        t.optionsMenu.colorMenu.hide();
    };

    this.textUpdate = function (text) {
        t.tileView.annotationManager.textUpdate(text);
    };

    this.setTextSize = function (textSize) {
        console.log(textSize);
        t.tileView.annotationManager.setTextSize(textSize);
        t.tileView.textSize = textSize;
    };
}

