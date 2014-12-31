BluVueSheet.OptionsMenu = function(sheet, scope) {
    var t = this;

    this.sheet = sheet;
    this.lengthUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Length, sheet.convertToUnit);
    this.areaUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Area, sheet.convertToUnit);
    this.textSizeMenu = document.getElementsByClassName("bluvue-sheet-textsize-menu")[0];
    this.colorMenu = new BluVueSheet.ColorMenu(sheet.setColor);

    this.optionsMenuElement = document.createElement("div");
    this.optionsMenuElement.className = 'bluvue-sheet-options-menu';

    var addButton = function(btnInfo) {
        var button = document.getElementById("button_" + btnInfo.id);
        if (button != null) {
            return;
        }

        button = document.createElement("div");
        button.className = "bv-options-image bv-options-" + btnInfo.className;
        button.id = "button_" + btnInfo.id;
        button.btnInfo = btnInfo;

        button.onclick = function () {
            function toggleMenu(menu){
                if(menu.visible()){
                    menu.hide(); return;
                }
                t.hideAllMenus();
                menu.show();
            }
            if (btnInfo.id === BluVueSheet.Constants.OptionButtons.Color.id) {
                toggleMenu(t.colorMenu)
            } else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitLength.id) {
                toggleMenu(t.lengthUnitConverter);
            } else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitArea.id) {
                toggleMenu(t.areaUnitConverter);
            } else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.Text.id){
                if(t.textSizeMenu.style.display=="block"){
                    t.textSizeMenu.style.display="none";
                    return;
                }
                t.hideAllMenus();
                t.textSizeMenu.style.display = "block";
            }

            t.sheet.tileView.optionChosen(this.btnInfo.id);
        };

        if (btnInfo.id === BluVueSheet.Constants.OptionButtons.Color.id) {
            var circle = document.createElement("div");
            circle.style.backgroundColor = BluVueSheet.ColorMenu.LastColor.toStyle();
            button.appendChild(circle);
        }

        t.optionsMenuElement.appendChild(button);
    }

    var removeButton = function(btnInfo) {
        var button = document.getElementById("button_" + btnInfo.id);
        if (button != null) {
            if(button.parentNode === t.optionsMenuElement)
                t.optionsMenuElement.removeChild(button);
        }
    }

    var setButtonSelected = function(btnInfo, isSelected) {
        //make button brighter
        var className = "bv-options-image bv-options-" + btnInfo.className;
        className = isSelected ? className + " selected" : className;
        var elem = document.getElementById("button_" + btnInfo.id);
        if (elem) {
            elem.className = className;
        }
    }

    this.deselectAllButtons = function() {
        var btns = document.getElementsByClassName("bv-options-image");
        for (var toolIndex = 0; toolIndex < btns.length; toolIndex++) {
            if (btns[toolIndex].className.indexOf("selected") > 0) {
                var btn = btns[toolIndex];
                btn.className = btn.className.substr(0, btn.className.indexOf(" selected"));
            }
        }
    }

    this.setColor = function(color) {
        function hash(c) {
            return Math.floor(c.red*255)+","+Math.floor(c.green*255)+","+Math.floor(c.blue*255);
        }
        function getColorIndex(c){
            var c1 = hash(c);
            for(var i=0; i<BluVueSheet.Constants.Colors.length; i++){
                if( c===BluVueSheet.Constants.Colors[i] || c1 == hash(BluVueSheet.Constants.Colors[i].color) ){
                    return i;
                }
            }
            return -1;
        }
        BluVueSheet.ColorMenu.LastColor = color;

        sheet.optionsMenu.colorMenu.setSelectedColor( getColorIndex( color ) );

        var btns = document.getElementsByClassName("bv-options-color");
        if (btns.length === 0) {
            return;
        }
        var btn = btns[0];
        btn.getElementsByTagName("div")[0].style.background = color.toStyle();
    }

    this.setSelectedOptionsForAnnotations = function(selectedAnnotations, tileView) {
        var userIsAdmin = scope.isAdmin;
        var keys = Object.keys(BluVueSheet.Constants.OptionButtons);
        for (var x = 0; x < keys.length; x++) {
            removeButton(BluVueSheet.Constants.OptionButtons[keys[x]]);
        }

        if (selectedAnnotations.length == 1) {
            var type = selectedAnnotations[0].type;
            this.setColor(selectedAnnotations[0].color);
        } else {
            this.setColor(tileView.color);
        }

        if (selectedAnnotations.length > 0) {
            var canFill = false;
            for (var i = 0; i < selectedAnnotations.length; i++) {
                if (selectedAnnotations[i].type != TEXT_ANNOTATION && selectedAnnotations[i].type != HIGHLIGHTER_ANNOTATION &&
                    selectedAnnotations[i].type != LINE_ANNOTATION && selectedAnnotations[i].type != ARROW_ANNOTATION &&
                    selectedAnnotations[i].type != MEASURE_ANNOTATION && selectedAnnotations[i].type != SCALE_ANNOTATION) {
                    canFill = true;
                    break;
                }
            }

            if (canFill) {
                var totalFilled = 0;
                addButton(BluVueSheet.Constants.OptionButtons.Fill);
                for (var j = 0; j < selectedAnnotations.length; j++) {
                    if (selectedAnnotations[j].fill)totalFilled++;
                }

                //highlight the fill button if all selected paths are filled
                setButtonSelected(BluVueSheet.Constants.OptionButtons.Fill, totalFilled == selectedAnnotations.length);
            }
        }

        if(tileView.getTool() === BluVueSheet.Constants.Tools.Text){
            addButton(BluVueSheet.Constants.OptionButtons.Text);
        }

        if(selectedAnnotations.length == 1){
            if(selectedAnnotations[0].type == TEXT_ANNOTATION){
                addButton(BluVueSheet.Constants.OptionButtons.Text)
            }
        }

        if (tileView.getTool() != BluVueSheet.Constants.Tools.Lasso && (tileView.getTool() !== null || selectedAnnotations.length > 0)) {
            addButton(BluVueSheet.Constants.OptionButtons.Color);
        }
    }

    this.hideAllMenus = function(){
        this.textSizeMenu.style.display = "none";
        this.colorMenu.hide();
    }

    this.appendTo = function(userInterface){
        userInterface.appendChild(this.optionsMenuElement);
        userInterface.appendChild(this.colorMenu.colorMenuElement);
    }
}

BluVueSheet.FloatingOptionsMenu = function (sheet, scope){
    var t = this;
    this.sheet = sheet;
    this.lengthUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Length, sheet.convertToUnit);
    this.areaUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Area, sheet.convertToUnit);

    this.floatingOptionsMenuElement = document.createElement("div");
    this.floatingOptionsMenuElement.className = 'bluvue-sheet-floating-options-menu';
    this.loc = null;
    this.width = 0;

    var addButton = function(btnInfo) {
        var button = document.getElementById("button_" + btnInfo.id);
        if (button != null) {
            return;
        }

        button = document.createElement("div");
        button.className = "bv-options-image bv-options-" + btnInfo.className;
        button.id = "button_" + btnInfo.id;
        button.btnInfo = btnInfo;

        button.onclick = function () {
            function toggleMenu(menu){
                if(menu.visible()){
                    menu.hide(); return;
                }
                t.hideAllMenus();
                menu.show();
            }
            if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitLength.id) {
                toggleMenu(t.lengthUnitConverter);
            } else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitArea.id) {
                toggleMenu(t.areaUnitConverter);
            }
            t.sheet.tileView.optionChosen(this.btnInfo.id);
        };
        t.floatingOptionsMenuElement.appendChild(button);
        t.width+=50+20;
    }

    var removeButton = function(btnInfo) {
        var button = document.getElementById("button_" + btnInfo.id);
        if (button != null) {
            if(button.parentNode === t.floatingOptionsMenuElement){
                t.floatingOptionsMenuElement.removeChild(button);
                t.width-=50;
            }
        }
    }

    var setButtonSelected = function(btnInfo, isSelected) {
        //make button brighter
        var className = "bv-options-image bv-options-" + btnInfo.className;
        className = isSelected ? className + " selected" : className;
        var elem = document.getElementById("button_" + btnInfo.id);
        if (elem) {
            elem.className = className;
        }
    }

    this.setSelectedOptionsForAnnotations = function(selectedAnnotations, tileView) {
        var userIsAdmin = scope.isAdmin;
        var keys = Object.keys(BluVueSheet.Constants.OptionButtons);
        for (var x = 0; x < keys.length; x++) {
            removeButton(BluVueSheet.Constants.OptionButtons[keys[x]]);
        }
        this.width = 0;

        if (selectedAnnotations.length > 0)
            addButton(BluVueSheet.Constants.OptionButtons.Delete);
        if (selectedAnnotations.length == 1) {
            addButton(BluVueSheet.Constants.OptionButtons.Copy);

            /* // Removed per BWA-963, though the userIsAdmin flag is worth looking into
            if (userIsAdmin) {
                addButton(BluVueSheet.Constants.OptionButtons.Master);
                var master = false;
                for (var j = 0; j < selectedAnnotations.length; j++) {
                    if (selectedAnnotations[j].userId === null ||
                        selectedAnnotations[j].userId === undefined) {
                        master = true;
                    }
                }

                setButtonSelected(BluVueSheet.Constants.OptionButtons.Master, master);
            }
            */
        }

        if (selectedAnnotations.length == 1) {
            var type = selectedAnnotations[0].type;
            if (type == MEASURE_ANNOTATION)
                addButton(BluVueSheet.Constants.OptionButtons.UnitLength);
            if ((type == SQUARE_ANNOTATION || type == POLYGON_ANNOTATION || type == PEN_ANNOTATION) && tileView.annotationManager.scaleAnnotation != null) {
                if (selectedAnnotations[0].areaMeasured) {
                    addButton(BluVueSheet.Constants.OptionButtons.UnitArea);
                }

                setButtonSelected(BluVueSheet.Constants.OptionButtons.Area, selectedAnnotations[0].areaMeasured);
                addButton(BluVueSheet.Constants.OptionButtons.Area);
            }
        }
    }

    this.show = function(loc){
        this.setLoc(loc);
        this.floatingOptionsMenuElement.style.display = "block";
    }

    this.hide = function(){
        this.floatingOptionsMenuElement.style.display = 'none';
    }

    this.getWidth = function(){
        return this.width;
    }

    this.getHeight = function(){
        return this.floatingOptionsMenuElement.offsetWidth;
    }

    this.setLoc = function(loc){
        this.loc = loc;
        this.floatingOptionsMenuElement.style.left = loc.x + "px";
        this.floatingOptionsMenuElement.style.top = loc.y + "px";
    }

    this.hideAllMenus = function(){
        this.lengthUnitConverter.hide();
        this.areaUnitConverter.hide();
    }

    this.appendTo = function(userInterface){
        userInterface.appendChild(this.floatingOptionsMenuElement);
        userInterface.appendChild(this.lengthUnitConverter.unitConverterElement);
        userInterface.appendChild(this.areaUnitConverter.unitConverterElement);
    }
}

BluVueSheet.ColorMenu = function(setColor){
	this.colorMenuElement = document.createElement("div");
	this.colorMenuElement.className = 'bluvue-sheet-color-menu';

	for (var i = 0; i < BluVueSheet.Constants.Colors.length; i++) {
		var button = document.createElement("div");
		button.className = "bluvue-color-button bluvue-color-button-"+BluVueSheet.Constants.Colors[i].className;
    button.name = i;
		button.onclick = function(){
			setColor(BluVueSheet.Constants.Colors[parseInt(this.name)].color.toStyle());
		};
		this.colorMenuElement.appendChild(button);
		if(i%3==2){
			var br = document.createElement("br");
			this.colorMenuElement.appendChild(br);
		}
	}
    this.visible = function(){
        return (this.colorMenuElement.style.display == "block")
    }
	this.show = function () {
	    this.colorMenuElement.style.display = 'block';
	}
	this.hide = function(){
	    this.colorMenuElement.style.display = 'none';
	}
	this.setSelectedColor = function( colorIndex ) {
      var selectedColor = colorIndex == -1 ? {className:"USER_COLOR"} : BluVueSheet.Constants.Colors[colorIndex];
      var selectedColorClass = 'bluvue-color-button-'+selectedColor.className;

      angular.forEach( document.querySelectorAll( '.bluvue-color-button' ), function( el, index ) {
          var element = angular.element( el );
          element.toggleClass( 'bluvue-color-button-selected', element.hasClass( selectedColorClass ) );
      } );
	}
}
BluVueSheet.ColorMenu.LastColor = new Color(0.5725, 0.5725, 0.5725, 1);

BluVueSheet.TextEditor = function(textUpdate, setTextSize){

	this.textEditorElement = document.createElement("div");
	this.textEditorElement.className = "bluvue-text-editor";

	var textBox = document.createElement("textarea");
	textBox.onchange = function(){
		textUpdate(textBox.value);
	}
	textBox.onkeyup = function(){
		textUpdate(textBox.value);
	}
	this.textEditorElement.appendChild(textBox);

	this.show = function(loc){
	    this.textEditorElement.style.left = loc.x + "px";
	    this.textEditorElement.style.top = loc.y + "px";
	    this.textEditorElement.style.display = "block";
	    textBox.focus();
	}
	this.hide = function(){
	    this.textEditorElement.style.display = 'none';
	}
	this.setLoc = function(loc){
	    this.textEditorElement.style.left = loc.x + "px";
	    this.textEditorElement.style.top = loc.y + "px";
	}
	this.setText = function(text){
	    textBox.value = text;
	    textBox.focus();
	}
    this.getWidth = function(){
        return this.textEditorElement.offsetWidth;
    }
    this.getHeight = function(){
        return this.textEditorElement.offsetHeight;
    }
}

BluVueSheet.UnitConverter = function (type, convertToUnit) {
    this.unitConverterElement = document.createElement("div");
    this.unitConverterElement.className = 'bluvue-sheet-unit-converter-menu';

    for (var i = 0; i < BluVueSheet.Constants.UnitNames[type].length; i++) {
        var button = document.createElement("div");
        button.className = "bluvue-unit-converter-button";
        button.dataset.index = i;
        button.innerHTML = BluVueSheet.Constants.UnitDisplayNames[type][i];
        button.onclick = function () {
            convertToUnit(type, this.dataset.index);
        };
        this.unitConverterElement.appendChild(button);
        if (i % 3 == 2) {
            var br = document.createElement("br");
            this.unitConverterElement.appendChild(br);
        }
    }
    this.visible = function(){
        return (this.unitConverterElement.style.display == "block")
    }
    this.show = function (loc) {
        this.unitConverterElement.style.left = loc.x + "px";
        this.unitConverterElement.style.top = loc.y + "px";
        this.unitConverterElement.style.display = 'block';
    }
    this.hide = function () {
        this.unitConverterElement.style.display = 'none';
    }
}

BluVueSheet.ToolMenuExtension = function(sheet, scope){
    this.toolMenuExtensionElement = document.getElementsByClassName("bluvue-sheet-tool-menu-extension")[0];

    this.updateLocation = function(toolMenuButton){
        var button = document.getElementsByClassName("bv-toolbar-"+toolMenuButton.name)[0];
        this.toolMenuExtensionElement.style.left = (70*toolMenuButton.id)+"px";
    }
}