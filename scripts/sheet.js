var BluVueSheet = {};

BluVueSheet.Sheet = function() {
    this.tileView = null;
    this.toolMenu = null;
    this.optionsMenu = null;
    this.colorMenu = null;
    this.textEditor = null;
    this.closeSheetButton = null;

    this.userId = null;
    this.projectId = null;
    this.sheetId = null;
    this.mainLoopTimeout = null;

    var t = this;

    this.loadSheet = function (sheet, scope, elem) {
        var closeSheet = function () {
            t.dispose();
            scope.closeSheet();
        }

        this.sheetId = sheet.sheetId;
        this.projectId = sheet.projectId;
        this.userId = sheet.userId;
        //make on screen controls
        this.toolMenu = new BluVueSheet.ToolMenu(this.setTool);
        this.optionsMenu = new BluVueSheet.OptionsMenu(this.optionChosen);
        this.colorMenu = new BluVueSheet.ColorMenu(this.setColor);
        this.textEditor = new BluVueSheet.TextEditor(this.textUpdate, this.setTextSize);
        this.closeSheetButton = new BluVueSheet.CloseSheetButton(closeSheet);

        var canvas = elem.find('canvas')[0];
        elem.append(this.toolMenu.toolMenuElement);
        elem.append(this.optionsMenu.optionsMenuElement);
        elem.append(this.colorMenu.colorMenuElement);
        elem.append(this.textEditor.textEditorElement);
        elem.append(this.closeSheetButton.closeMenuElement);

        //make tileView
        this.tileView = new BluVueSheet.TileView(canvas, this.toolMenu, this.optionsMenu, this.colorMenu, this.textEditor, closeSheet, scope);
        this.tileView.create(sheet);

        //create loop
        var mainLoop = function () {
            t.tileView.mainLoop();
            t.mainLoopTimeout = setTimeout(mainLoop, MAIN_LOOP_TIMEOUT);
        }

        this.mainLoopTimeout = setTimeout(mainLoop, MAIN_LOOP_TIMEOUT);

        //setup key controls
        window.addEventListener("keydown", this.tileView.keyboardControls.onKeyDown, true);
        window.addEventListener("keyup", this.tileView.keyboardControls.onKeyUp, true);
        //setup mouse controls
        canvas.onmousedown = this.tileView.mouseControls.onmousedown;
        canvas.onmouseup = this.tileView.mouseControls.onmouseup;
        canvas.onmousemove = this.tileView.mouseControls.onmousemove;
        canvas.onclick = this.tileView.mouseControls.onclick;
        canvas.ondblclick = this.tileView.mouseControls.ondblclick;

        window.addEventListener("mousewheel", this.tileView.mouseControls.onmousewheel, true);
        window.addEventListener("DOMMouseScroll", this.tileView.mouseControls.onmousewheel, true);
    };

    this.dispose = function () {
        clearTimeout(t.mainLoopTimeout);
        window.removeEventListener("keydown", t.tileView.keyboardControls.onKeyDown, true);
        window.removeEventListener("keyup", t.tileView.keyboardControls.onKeyUp, true);
        window.removeEventListener("mousewheel", t.tileView.mouseControls.onmousewheel, true);
        window.removeEventListener("DOMMouseScroll", t.tileView.mouseControls.onmousewheel, true);
    };

    this.setTool = function (id) {
        t.tileView.setTool(id);
    };

    this.optionChosen = function (id) {
        t.tileView.optionChosen(id);
        if (id == COLOR_OPTION) {
            t.colorMenu.show();
        }
    };

    this.setColor = function (colorName) {
        var csv = colorName.slice(5, colorName.length - 1);
        var vals = csv.split(",");
        var color = new Color(parseFloat(vals[0]) / 255, parseFloat(vals[1]) / 255, parseFloat(vals[2]) / 255, parseFloat(vals[3]));
        t.tileView.setColor(color);
        t.optionsMenu.setColor(color);
        t.colorMenu.hide();
    };

    this.textUpdate = function (text) {
        t.tileView.annotationManager.textUpdate(text);
    };

    this.setTextSize = function (textSize) {
        t.tileView.annotationManager.setTextSize(textSize);
        t.tileView.textSize = textSize;
    };
}

