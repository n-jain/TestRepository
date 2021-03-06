BluVueSheet.OptionsMenu = function (sheet, scope) {
	var t = this;

	this.sheet = sheet;
	this.lengthUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Length, sheet.convertToUnit);
	this.areaUnitConverter = new BluVueSheet.UnitConverter(BluVueSheet.Constants.Area, sheet.convertToUnit);
	this.textSizeMenu = document.getElementsByClassName("bluvue-sheet-textsize-menu")[0];
	this.colorMenu = new BluVueSheet.ColorMenu(sheet.setColor);

	this.optionsMenuElement = document.createElement("div");
	this.optionsMenuElement.className = 'bluvue-sheet-options-menu';

	var addButton = function (btnInfo) {
		var button = document.getElementById("button_" + btnInfo.id);
		if (button != null) {
			return;
		}

		button = document.createElement("div");
		button.className = "bv-options-image bv-options-" + btnInfo.className;
		button.id = "button_" + btnInfo.id;
		button.btnInfo = btnInfo;

		button.onclick = function () {
			function toggleMenu(menu) {
				if (menu.visible()) {
					menu.hide();
					return;
				}
				t.hideAllMenus();
				menu.show();
			}

			if (btnInfo.id === BluVueSheet.Constants.OptionButtons.Color.id) {
				toggleMenu(t.colorMenu);
			} else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitLength.id) {
				toggleMenu(t.lengthUnitConverter);
			} else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.UnitArea.id) {
				toggleMenu(t.areaUnitConverter);
			} else if (btnInfo.id === BluVueSheet.Constants.OptionButtons.Text.id) {
				if (t.textSizeMenu.style.display == "block") {
					t.textSizeMenu.style.display = "none";
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

	var removeButton = function (btnInfo) {
		var button = document.getElementById("button_" + btnInfo.id);
		if (button != null) {
			if (button.parentNode === t.optionsMenuElement)
				t.optionsMenuElement.removeChild(button);
		}
	}

	var setButtonSelected = function (btnInfo, isSelected) {
		//make button brighter
		var className = "bv-options-image bv-options-" + btnInfo.className;
		className = isSelected ? className + " selected" : className;
		var elem = document.getElementById("button_" + btnInfo.id);
		if (elem) {
			elem.className = className;
		}
	}

	this.deselectAllButtons = function () {
		var btns = document.getElementsByClassName("bv-options-image");
		for (var toolIndex = 0; toolIndex < btns.length; toolIndex++) {
			if (btns[toolIndex].className.indexOf("selected") > 0) {
				var btn = btns[toolIndex];
				btn.className = btn.className.substr(0, btn.className.indexOf(" selected"));
			}
		}
	}

	this.setColor = function (color) {
		function hash(c) {
			return Math.floor(c.red * 255) + "," + Math.floor(c.green * 255) + "," + Math.floor(c.blue * 255);
		}

		function getColorIndex(c) {
			var c1 = hash(c);
			for (var i = 0; i < BluVueSheet.Constants.Colors.length; i++) {
				if (c === BluVueSheet.Constants.Colors[i] || c1 == hash(BluVueSheet.Constants.Colors[i].color)) {
					return i;
				}
			}
			return -1;
		}

		BluVueSheet.ColorMenu.LastColor = color;

		sheet.optionsMenu.colorMenu.setSelectedColor(getColorIndex(color));

		var btns = document.getElementsByClassName("bv-options-color");
		if (btns.length === 0) {
			return;
		}
		var btn = btns[0];
		btn.getElementsByTagName("div")[0].style.background = color.toStyle();
	}

	this.setSelectedOptionsForAnnotations = function (selectedAnnotations, tileView) {
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
			var canFill = false, colCanFill = 0;
			for (var i = 0; i < selectedAnnotations.length; i++) {
				if (tileView.isFillableAnnotation(selectedAnnotations[i].type)) {
					canFill = true;
					colCanFill++;
				}
			}

			if (canFill) {
				var totalFilled = 0;
				addButton(BluVueSheet.Constants.OptionButtons.Fill);
				for (var j = 0; j < selectedAnnotations.length; j++) {
					if (selectedAnnotations[j].fill && tileView.isFillableAnnotation(selectedAnnotations[j].type))totalFilled++;
				}

				//highlight the fill button if all selected paths are filled
				setButtonSelected(BluVueSheet.Constants.OptionButtons.Fill, totalFilled == colCanFill);
			}
		}

		if (tileView.getTool() === BluVueSheet.Constants.Tools.Text) {
			addButton(BluVueSheet.Constants.OptionButtons.Text);
		}

		if (selectedAnnotations.length == 1) {
			if (selectedAnnotations[0].type == TEXT_ANNOTATION) {
				addButton(BluVueSheet.Constants.OptionButtons.Text)
			}
		}

		if (tileView.getTool() != BluVueSheet.Constants.Tools.Lasso && (tileView.getTool() !== null || selectedAnnotations.length > 0)) {
			addButton(BluVueSheet.Constants.OptionButtons.Color);
		}
	}

	this.hideAllMenus = function () {
		this.textSizeMenu.style.display = "none";
		this.colorMenu.hide();
	}

	this.appendTo = function (userInterface) {
		userInterface.appendChild(this.optionsMenuElement);
		userInterface.appendChild(this.colorMenu.colorMenuElement);
	}
}

BluVueSheet.FloatingOptionsMenu = function (sheet, scope){
    this.sheet = sheet;

    this.show = function() {
	    var mgr = scope.currentSheet.tileView.annotationManager;

	    if(mgr.getSelectedAnnotation().length) {
		    var ann = mgr.getSelectedAnnotation()[0],
				isMaster = ann.userId === null,
		        data = BluVueSheet.Constants.AnnotationMenuButtons.TypeSwitcher.states[isMaster ? 'master' : 'personal'];

		    scope.selectedSingleAnnotation = true;

		    if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
			    scope.$apply();
		    }

		    var html = angular.element('<span class="type-switcher-button-' + (isMaster ? 'master' : 'personal') + '">' + data.parentText + '</span>');

		    angular.element(document.getElementsByClassName('bv-toolbar-type-switcher-button')[0]).append(html);

		    if(mgr.getSelectedAnnotation().length == 1 && ann.links && ann.links.length) {
			    angular.element(document.getElementsByClassName('bv-toolbar-links-button')[0]).append('<span class="bv-toolbar-counter">' + ann.links.length + '</span>');
		    }

		    if(mgr.getSelectedAnnotation().length == 1 && ann.attachments && ann.attachments.length) {
			    angular.element(document.getElementsByClassName('bv-toolbar-attachments-button')[0]).append('<span class="bv-toolbar-counter">' + ann.attachments.length + '</span>');
		    }
	    }
    }

    this.hide = function(){
	    scope.selectedSingleAnnotation = false;
	    if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
		    scope.$apply();
	    }
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

	this.show = function (loc) {
	    this.textEditorElement.style.width = BluVueSheet.TextEditor.Width + "px";
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
        return BluVueSheet.TextEditor.Width;
    }
    this.getHeight = function(){
        return this.textEditorElement.offsetHeight;
    }
}

BluVueSheet.TextEditor.Width = 300;

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
        this.toolMenuExtensionElement.style.left = (61*toolMenuButton.id)+"px";

        angular.forEach(document.querySelectorAll(".bluvue-sheet-tool-menu .bv-toolbar-image"), function(value, key){
            angular.element(value).removeClass('active-child-tool');
        });

        if(toolMenuButton.buttons.length > 1) {
            angular.element(document.querySelector(".bv-toolbar-"+toolMenuButton.name)).addClass('active-child-tool');
        }
    }
}

BluVueSheet.Dialog = function(params) {
	params = params || {};
	params.openAnimate = params.openAnimate != undefined ? params.openAnimate : true;
	params.hideAnimate = params.hideAnimate != undefined ? params.hideAnimate : true;

	var typeClass = '';
	switch(params.showType) {
		case 'panel':
			typeClass = 'bluvue-dialog-type-panel';
			break;
    case 'unit':
      typeClass = 'bluvue-dialog-unit-panel';
	}

  var dialog = this;

  var defaultHideAction = function defaultHideAction(){
	  if(dialog.defaultHideAction != undefined) {
		  dialog.defaultHideAction();
	  } else {
		  dialog.hide();
	  }
  }

  // Need this resize listener to ensure that vertical height is honored, even
  // if css margin:auto doesn't work (I'm lookin' at you, Firefox)
  var onResize = function dialogOnResize() {
    var w = window;
    var d = document;
    var e = d.documentElement;
    var g = d.getElementsByTagName('body')[0];
    var y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    var cy = content[0].offsetHeight;

    content[0].style.top = (y/2 - cy/2) + 'px';
  };

  var resizeTimer;
  var resizeListener = function dialogResizeListener() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout( onResize, 100 );
  };


  var cancelAction = defaultHideAction;

  this.showConfirmDialog = function showDialog( options ) {
    cancelAction = options.cancelAction || defaultHideAction;

	  var data = {
		  title: options.title||"Confirm",
		  bodyClass: 'bluvue-dialog-confirmBody',
		  message: options.message,
		  bodyElement: options.bodyElement,
		  buttons: [],
		  topButtons: {},
		  showBottomButtons: options.showBottomButtons
	  };

	  if(options.hideCancelButton != true) {
		  data.buttons.push({
			  label: options.cancelLabel||"Cancel",
			  action: cancelAction,
			  buttonClass: options.buttonClass||'cancel'
		  });
	  }

	  if(options.hideOkButton != true) {
		  data.buttons.push({
			  label: options.okLabel||"Ok",
			  validatorFactory: options.validatorFactory,
			  action: options.okAction||defaultHideAction,
			  buttonClass: options.buttonClass||''
		  });
	  }

	  if(options.button1Action != undefined) {
		  data.topButtons[1] = {
			  label: options.button1Label || "Cancel",
			  action: options.button1Action
		  };
	  }

	  if(options.button2Action != undefined) {
		  data.topButtons[2] = {
			  label: options.button2Label||"Ok",
			  action: options.button2Action
		  };
	  }

	  if(options.defaultHideAction != undefined) {
		  dialog.defaultHideAction = options.defaultHideAction;
	  }

    return dialog.showDialog( data );
  }

  this.showTooltip = function showTooltip( options ) {
      return dialog.showDialog( {
          image: options.image,
          title: options.title||"Tip",
          dialogClass: 'bluvue-tooltip',
          bodyClass: 'bluvue-dialog-tooltipBody',
          message: options.message
      });
  }

  this.showDialog = function showConfirmDialog( options ) {
    options.topButtons = options.topButtons||[];

    var bodyContent = angular.element( "<div class='" + (options.dialogClass||"bluvue-dialog-body") + "'></div>" );

    if( options.image )
      bodyContent.append( angular.element( "<img class='dialog-hero-image' src='" + options.image + "'></img>" ) );
	  if('panel' == params.showType)
		  bodyContent.append(angular.element("<div style=\"text-align: right;\"></div>").append(angular.element('<a href="#" id="dialog-panel-close" onclick="return false;"></a>').on('click', defaultHideAction)));

	  var titleContent = angular.element("<div class='dialog-title'></div>");

	  if(options.topButtons[1] != undefined) {
		 var button = angular.element( "<div class='dialog-top-button'>" + options.topButtons[1].label + "</div>" );
		 button.on( 'click', options.topButtons[1].action );
		 titleContent.append( button );
	  } else if('panel' == params.showType){
		  titleContent.append( angular.element( "<div class='dialog-top-button'></div>") );
	  }

    if( options.title )
	    titleContent.append( '<span>' + options.title + '</span>' );

	  if(options.topButtons[2] != undefined) {
		 var button = angular.element( "<div class='dialog-top-button'>" + options.topButtons[2].label + "</div>" );
		 button.on( 'click', options.topButtons[2].action );
		 titleContent.append( button );
	  } else if('panel' == params.showType) {
		  titleContent.append( angular.element( "<div class='dialog-top-button'></div>") );
	  }

	  bodyContent.append(titleContent);

    if( options.message )
      bodyContent.append( angular.element( "<div class='dialog-message'>" + options.message + "</div>" ) );
    if( options.bodyElement )
      bodyContent.append( options.bodyElement );
    if( options.buttons && options.showBottomButtons != false )
    {
      var buttonHolder = angular.element( "<div class='dialog-button-holder'>" );
      options.buttons.forEach( function( spec ) {
        var button = angular.element( "<div class='dialog-button'>" + spec.label + "</div>" );
        if( spec.buttonClass )
          button.addClass( spec.buttonClass );
        if( spec.validatorFactory )
        {
          spec.validatorFactory( button );
        }
        button.on( 'click', spec.action );
        buttonHolder.append( button );
      } );
      bodyContent.append( buttonHolder );
    }

    return dialog.show( bodyContent, options.dialogClass );
  }

  this.show = function( body, dialogClass )
  {
    if( dialogClass )
      content.addClass( dialogClass );

    content.append( angular.element( body ) );
	  holder.on( 'click', defaultHideAction );
	  content.on( 'click', function() {return false;} );
    holder.css( { display: "block" } );
    wrapper.css( { display: "block" } );
    window.addEventListener( 'resize', resizeListener );

	  switch(params.showType) {
		  case 'panel':
			  if(params.openAnimate) {
				  setTimeout(function() {
					  angular.element(document.querySelectorAll('.bluvue-dialog-type-panel .bluvue-dialog-content'))
						  .addClass('bluvue-dialog-content-open');
				  }, 100);
			  } else {
				  angular.element(document.querySelectorAll('.bluvue-dialog-type-panel .bluvue-dialog-content'))
					  .addClass('bluvue-dialog-content-open')
					  .addClass('bluvue-dialog-content-no-animate');
			  }

			  break;
	  }

    onResize(); // Initialize the height logic

	  var onKeyUp = function(event) {
		  switch(event.keyCode){
			  case 27: //esc
				  dialog.hide();
				  break;
		  }

		  window.removeEventListener('keyup', onKeyUp);
	  }

	  window.addEventListener('keyup', onKeyUp, true);
  }

	this.hideHolder = function() {
		holder.css( { display: "none" } );
		wrapper.css( { display: "none" } );
	}

  this.hide = function() {
	  var el = this;
	  var hideEvent = function() {
		  window.removeEventListener( 'resize', resizeListener );
		  holder.off( 'click', cancelAction );
		  el.hideHolder();
		  content.removeClass();
		  content.addClass( 'bluvue-dialog-content' );
		  content.empty();
		  el.destroy();
	  };

	  switch(params.showType) {
		  case 'panel':
			  angular.element(document.querySelectorAll('.bluvue-dialog-type-panel .bluvue-dialog-content'))
				  .removeClass('bluvue-dialog-content-open')
				  .removeClass('bluvue-dialog-content-no-animate');

			  if(params.hideAnimate) {
				  setTimeout(function() { hideEvent(); el.destroy(); }, 500);
			  } else {
				  hideEvent();
			  }

			  break;
		  default:
			  hideEvent();
	  }
  }

  this.destroy = function() {
    holder.remove();
    wrapper.remove();
  }

	// Remove old holders
	angular.element(document.querySelector('.bluvue-dialog-holder')).remove();
	angular.element(document.querySelector('.bluvue-dialog-wrapper')).remove();

  var parent = angular.element( document.querySelector('.bluvue-sheet') );
  var wrapper = angular.element( '<div class="bluvue-dialog-wrapper ' + typeClass + '"></div>' );
	var holder = angular.element( '<div class="bluvue-dialog-holder"></div>' );
  var content = angular.element( '<div class="bluvue-dialog-content"></div>');

  wrapper.append(content);
  this.hideHolder();

  parent.append( wrapper );
	parent.append(holder);
}

BluVueSheet.Confirm = function (params) {
	params.title = params.title || '';
	params.content = params.content || '';
	params.confirmButton = params.confirmButton || 'Confirm';
	params.cancelButton = params.cancelButton || 'Cancel';
	params.confirmAction = params.confirmAction || defaultCancelAction;
	params.cancelAction = params.cancelAction || defaultCancelAction;
	params.appendClass = params.appendClass || '';
	params.buttons = params.buttons || [];
	params.showHolder = params.showHolder || false;

  function defaultCancelAction() {
    angular.element(document.querySelectorAll('.confirm-popup')).remove();
    angular.element(document.querySelector('.bluvue-confirm-popup-holder')).css({display: 'none'});
  }

  this.openPopup = function() {
    var popup = angular.element('<div class="confirm-popup"></div>').addClass(params.appendClass);
    var title = angular.element('<h1></h1>').text(params.title);
    var content = angular.element('<div class="confirm-popup-content"></div>').text(params.content);
    var actions = angular.element('<ul></ul>').addClass('confirm-popup-actions')
      .append(angular.element('<li></li>').addClass('confirm-popup-confirm-action').text(params.confirmButton).bind('click', params.confirmAction).bind('click', defaultCancelAction))
      .append(angular.element('<li></li>').addClass('confirm-popup-cancel-action').text(params.cancelButton).bind('click', params.cancelAction).bind('click', defaultCancelAction));

    if(params.buttons.length) {
      var actions = angular.element('<ul></ul>').addClass('confirm-popup-actions');
      params.buttons.forEach(function(button) {
        actions.append(angular.element('<li></li>').addClass('confirm-popup-confirm-action').text(button.label).bind('click', button.action || defaultCancelAction).bind('click', defaultCancelAction))
      });
    }

    popup.append(title).append(content).append(actions);
    angular.element(document.querySelector('body')).append(popup);

    if(params.showHolder) {
      angular.element(document.querySelector('.bluvue-confirm-popup-holder')).css({display: 'block'});

      document.querySelector('.bluvue-confirm-popup-holder').addEventListener('click', function() {
        defaultCancelAction();
      });
    }
  };

  this.closePopup = function() {

  };
};


BluVueSheet.FileChooser = function( scope ) {
  var fileChooser = this;

  filepicker.setKey( scope.filepickerApiKey );

  var createPickerOptions = function createPickerOptions( mimetypes ) {
    var options = {
      multiple: true,
      services: ['COMPUTER', 'DROPBOX', 'BOX', 'GOOGLE_DRIVE', 'SKYDRIVE', 'CLOUDDRIVE' ]
  };

    if( mimetypes )
      options.mimetypes = mimetypes;

    return options;
  };

  var errorCodes = {
    111: "Your browser doesn't support reading from DOM File objects",
    115: "File not found",
    118: "General read error",
    151: "The file store couldn't be reached",
    "default": "Could not save file."
  };

  var getExtension = function getExtension( filename, mimeType )
  {
    var a = filename.split(".");
    if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
        return mimeType;
    }
    return a.pop().toLowerCase();
  }

  var createStorageInfo = function createStorageInfo( inkBlob )
  {
    var guid = scope.generateUUID( true );
    var amazonKeyPath = guid + "." + getExtension( inkBlob.filename );
    
    // BWA-1457 -- special case for bogus 'audio/mp3' MIME - use standardized 'audio/mpeg' instead
    var mime = inkBlob.mimetype == "audio/mp3" ? "audio/mpeg":inkBlob.mimetype;
    
    return {
      container: scope.attachmentsBucketName,
      filename: inkBlob.filename,
      mimetype: mime,
      path: amazonKeyPath
    };
  }

  this.chooseAttachment = function chooseAttachment( onSuccess, onError, filetype ) {
	  var mimeTypes = [];

	  for(var i in BluVueSheet.Constants.MIME) {
		  if(BluVueSheet.Constants.MIME[i].type == filetype) {
			  mimeTypes.push(i);
		  }
	  }

    this.openFileChooser( mimeTypes, onSuccess, onError );
  }

  this.openFileChooser = function openFileChooser( fileTypes, onSuccess, onError ) {

    onSuccess = onSuccess || function( file ) {
      console.log( "Opened", file );
    };

    onError = onError || function( message ) {
      console.error( "File Chooser Error:", message );
    };

    filepicker.pickMultiple( createPickerOptions( fileTypes ), function pickMultipleSuccess( InkBlobs )
    {
      InkBlobs.forEach( function( inkBlob ) {
        filepicker.store( inkBlob, createStorageInfo( inkBlob ),
          function storeSuccess( inkBlobStored ) {
            onSuccess( inkBlobStored );
          },
          function storeError( FPError ) {
            onError( errorCodes[ FPError.code ] || ( errorCodes[ 'default' ] + " (" + FPError + ")" ) );
          }
        );
      });
    },
    function pickMultipleError( FPError ){
      if( FPError.code !== 101 ) {
        console.log( "General error during upload" );
      }
    });
  }
}
