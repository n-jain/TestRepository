BluVueSheet.OptionsMenu = function(sheet, scope) {
    var t = this;

    this.sheet = sheet;
    this.lengthUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Length, sheet.convertToUnit);
    this.areaUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Area, sheet.convertToUnit);

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
            if (btnInfo.id === BluVueSheet.Constants.OptionButtons.Color.id) {
                t.sheet.colorMenu.show();
            } else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitLength.id) {
                t.lengthUnitConverter.show();
            } else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitArea.id) {
                t.areaUnitConverter.show();
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
    };

    this.setColor = function(color) {
        BluVueSheet.ColorMenu.LastColor = color;
        var btns = document.getElementsByClassName("bv-options-color");
        if (btns.length === 0) {
            return;
        }
        var btn = btns[0];

        btn.getElementsByTagName("div")[0].style.backgroundColor = color.toStyle();
    }

    this.setSelectedOptionsForAnnotations = function(selectedAnnotations, tileView) {
        var userIsAdmin = scope.isAdmin;
        var keys = Object.keys(BluVueSheet.Constants.OptionButtons);
        for (var x = 0; x < keys.length; x++) {
            removeButton(BluVueSheet.Constants.OptionButtons[keys[x]]);
        }

        if (selectedAnnotations.length > 0) {
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
        }

        if (selectedAnnotations.length == 1) {
            var type = selectedAnnotations[0].type;
            this.setColor(selectedAnnotations[0].color);
            if (type == MEASURE_ANNOTATION)
                addButton(BluVueSheet.Constants.OptionButtons.UnitLength);
            if ((type == SQUARE_ANNOTATION || type == POLYGON_ANNOTATION || type == PEN_ANNOTATION) && tileView.annotationManager.scaleAnnotation != null) {
                if (selectedAnnotations[0].areaMeasured) {
                    addButton(BluVueSheet.Constants.OptionButtons.UnitArea);
                }

                setButtonSelected(BluVueSheet.Constants.OptionButtons.Area, selectedAnnotations[0].areaMeasured);
                addButton(BluVueSheet.Constants.OptionButtons.Area);
            }
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

        if (tileView.getTool() != BluVueSheet.Constants.Tools.Lasso && (tileView.getTool() !== null || selectedAnnotations.length > 0)) {
            addButton(BluVueSheet.Constants.OptionButtons.Color);
        }

        if (selectedAnnotations.length > 0) {
            addButton(BluVueSheet.Constants.OptionButtons.Delete);
        }
    }
};

BluVueSheet.ColorMenu = function(setColor){
	this.colorMenuElement = document.createElement("div");
	this.colorMenuElement.className = 'bluvue-sheet-color-menu';

	for (var i = 0; i < BluVueSheet.ColorMenu.Colors.length; i++) {
		var button = document.createElement("div");
		button.className = "bluvue-color-button";
		button.style.background = BluVueSheet.ColorMenu.Colors[i].toStyle();
		button.name = BluVueSheet.ColorMenu.Colors[i].toStyle();
		button.onclick = function(){
			setColor(this.name);
		};
		this.colorMenuElement.appendChild(button);
		if(i%3==2){
			var br = document.createElement("br");
			this.colorMenuElement.appendChild(br);
		}
	}
	this.show = function () {
	    this.colorMenuElement.style.display = 'block';
	}
	this.hide = function(){
	    this.colorMenuElement.style.display = 'none';
	}
}
BluVueSheet.ColorMenu.Colors = [
    new Color(1, 0, 0, 1), new Color(0, 1, 0, 1), new Color(0, 0, 1, 1),
	new Color(1, 1, 0, 1), new Color(1, 0.647, 0, 1), new Color(1, 0, 1, 1),
	new Color(0.333, 0.102, 0.545, 1), new Color(0, 0, 0, 1), new Color(0.8, 0.8, 0.8, 1)
];
BluVueSheet.ColorMenu.LastColor = new Color(0.5725, 0.5725, 0.5725, 1);

BluVueSheet.TextEditor = function(textUpdate, setTextSize){
	
	this.textEditorElement = document.createElement("div");
	this.textEditorElement.className = "bluvue-text-editor";

    var fontSize = 20;
	var textSizeMenu = document.createElement("div");
	for(var i=0; i<BluVueSheet.Constants.TextSizes.length; i++){
		var button = document.createElement("div");
		button.className = "bv-toolbar-image bv-toolbar-image-inline bv-toolbar-text";
		button.name = BluVueSheet.Constants.TextSizes[i];
		button.style.fontSize = fontSize + "px";
	    fontSize += 4;
		button.onclick = function () {
			setTextSize(parseInt(this.name));
		};
		textSizeMenu.appendChild(button);
	}
	this.textEditorElement.appendChild(textSizeMenu);
	
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
	    this.textEditorElement.style.display = 'block';
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

    this.show = function () {
        this.unitConverterElement.style.display = 'block';
    }
    this.hide = function () {
        this.unitConverterElement.style.display = 'none';
    }
}
