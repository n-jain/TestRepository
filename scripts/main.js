angular.module("bluvueSheet", []);

angular.module("bluvueSheet").directive("bvSheet", ['$window', '$location', '$interval', '$filter',
    function sheetDirective($window, $location, $interval, $filter) {
        'use strict';

        return {
            scope: {
                sheet: "=",
                userId: "=",
                email: "=",
                isAdmin: "=",
                syncAnnotations: "=",
                closeSheet: "=",
                nextSheet: "=",
                previousSheet: "=",
                pinnedSheets: "=",
                getCurrentIndex: "=",
                getTotalSheets: "=",
                revisionsForCurrentSheet: "=",
                openSheetById: "=",
                saveSheet: "=",
                filepickerApiKey: "=",
                attachmentsBucketName: "=",
	              canEditNotes: "=",
	              fullName: "="
            },
            restrict: "E",
            replace: true,
            transclude: false,
            templateUrl: "template/bluvue-sheet.html?_=" + Math.random().toString(36).substring(7),
            link: function bvSheetLink(scope, elem) {
	              scope.isShowAttachmentsButton = false;
                scope.currentSheet = null;
                scope.selectedTool = null;
                scope.tools = BluVueSheet.Constants.Tools;
                scope.toolMenuButtons = BluVueSheet.Constants.ToolMenuButtons;
                scope.toolMoreMenu = [];
                scope.toolMenuButtonTools = [0,0,0,0,0,0,0];
                scope.selectedToolMenu = null;
                scope.textSizes = BluVueSheet.Constants.TextSizes;
	              scope.loadingImagesList = [];

                for( var i=0; i<BluVueSheet.Constants.MoreMenu.length; i++ )
                {
                  var item = BluVueSheet.Constants.MoreMenu[i];
                  if( !item.isAdmin || (item.isAdmin && scope.isAdmin) )
                  {
                    scope.toolMoreMenu.push( item );
                  }
                }

                var toolipDialog = new BluVueSheet.Dialog();

                var backPressed = false;
                $window.history.pushState({}, "", $location.absUrl());
                
                $window.onpopstate = function () {
                    scope.scheduleAnnotationSync( null, null, function(){
                        backPressed = true;
                        scope.close();
                    }, true );
                };

                var windowResizeObserver = function windowResizeObserver() {
                    var checkFullscreen = ((typeof document.webkitIsFullScreen) !== 'undefined') ? document.webkitIsFullScreen : document.mozFullScreen;

                    if(!checkFullscreen) {
                        document.getElementById("fullscreen_button").innerHTML = "Full Screen";
                        document.getElementById("fullscreen_floating_block").style.display = "none";
                        document.getElementsByClassName("bluvue-sheet-header")[0].style.display = "block";
                        document.getElementsByClassName("bluvue-sheet-tool-menu")[0].style.display = "block";
                    }
                };
                angular.element($window).on( 'resize', windowResizeObserver );

                var windowCloseObserver = function windowCloseObserver() {
                    // Dispatch a sync to complete the shutdown
                    scope.scheduleAnnotationSync( null, null, function(){
                    }, true );
                };
                angular.element($window).on( 'unload', windowCloseObserver );

                scope.annotationWatcher = $interval( function(){scope.doAnnotationSync();}, BluVueSheet.Constants.ANNOTATION_SYNC_INTERVAL );

                scope.options = {
                    currentSheetPinned: false
                };

                var backHistoryDepth = $window.history.length-1;

                // There's a bug in the container for this webapp that causes
                // the html element to have a scrollbar when we're displayed.
                // This class, 'html.noScroll', disables that scroll bar.
                // See also Jira - BWA-1211.
                document.querySelector('html').classList.toggle( 'noScroll', true );
                scope.close = function () {
                    document.querySelector('html').classList.toggle( 'noScroll', false );
                    if (!backPressed) {
                        setTimeout(function() {
                            scope.currentSheet.dispose();
                            scope.closeSheet();
                            $window.history.go( backHistoryDepth - $window.history.length );
                        }, 0);
                        return;
                    }

                    scope.currentSheet.dispose();
                    scope.closeSheet();
                };

                scope.deselectTool = function() {
                    scope.selectTool(null);
                    scope.$apply();
                    scope.moreMenuToggle(true);
                };

                scope.selectTool = function(tool) {
                    if( !tool || (scope.selectedTool && tool.id === scope.selectedTool.id) ) {
                        scope.selectedTool = null;
                        tool = null;
                    }

                    if( tool )
                    {
	                      var mgr = scope.currentSheet.tileView.annotationManager;

	                      if('lasso' != tool.name) {
		                      mgr.deselectAllAnnotations();
	                      }

                        if( tool.id == BluVueSheet.Constants.Tools.Calibration.id )
                        {

                            if( mgr.scaleAnnotation )
                            {
                              console.log('scale');
                                // Avoid the toolip - we're selecting the annotation instead of changing mode
                                mgr.selectSingleAnnotation( mgr.scaleAnnotation );
                                scope.selectedToolMenu = null;
                                return;
                            }
                        }
                        else if( tool.id == BluVueSheet.Constants.Tools.Ruler.id )
                        {
                            if( !mgr.scaleAnnotation )
                            {
                                // There's no calibration, so enforce one!
	                              var dialog = new BluVueSheet.Dialog();

	                              dialog.showConfirmDialog( {
			                            title: "Calibration Required",
			                            message: "Before using the ruler, the scale for this sheet needs to be set and calibrated.",
			                            okLabel:"Calibrate Now",
			                            okAction:function(){
				                            scope.selectTool(BluVueSheet.Constants.Tools.Calibration);
				                            dialog.hide();
			                            },
		                              cancelAction: function() {
			                              scope.deselectTool();
			                              dialog.hide();
		                              }
		                            });

	                              return;
                            }
                        }

	                      var toolsStorage = JSON.parse(localStorage['tools'] || "{}");

	                      if(toolsStorage[tool.id] == undefined) {
		                      toolsStorage[tool.id] = {};
	                      }

	                      if(toolsStorage[tool.id].visited == undefined) {
		                      toolsStorage[tool.id].visited = false;
	                      }

                        if( !toolsStorage[tool.id].visited || scope.alwaysShowToolHelp() )
                        {
	                          new BluVueSheet.Dialog().showTooltip( {
                               title: tool.label||tool.name,
                               message:tool.description,
                               image: tool.heroImage
                            });
                        }
                        tool.visited = true;
	                      toolsStorage[tool.id].visited = true;

	                      localStorage['tools'] = JSON.stringify(toolsStorage);

                        scope.selectedTool = tool;
                    }

                    for( var i=0; i<scope.toolMenuButtonTools.length; i++ )
                    {
                        scope.toolMenuButtonTools[i] = (tool) ? ((tool.menuId==i) ? tool.menuIndex:0) : 0;
                    }

                    if( !scope.selectedTool ) {
                        angular.forEach(document.querySelectorAll(".bluvue-sheet-tool-menu .bv-toolbar-image"), function(value, key){
                            angular.element(value).removeClass('active-child-tool');
                        });
                    }

                    scope.currentSheet.setTool( scope.selectedTool );

                    //update tool menu
                    scope.selectedToolMenu = null;
                };

                scope.toolMenuButtonClicked = function(toolMenuButton) {
                    // If need un-expand expanded tool item
                    if( scope.selectedToolMenu && scope.selectedToolMenu.id == toolMenuButton.id && toolMenuButton.buttons.length > 1) {
                        try {
                            scope.selectTool(null);
                        } catch(e) {}

                        return;
                    }

                    if(toolMenuButton.name == 'hide-button') {
                        document.getElementsByClassName('bluvue-sheet-tool-menu')[0].style.display = 'none';
                        document.getElementById('show-toolbar').style.display = 'block';
                        return;
                    }

                    if(toolMenuButton.buttons.length == 1){
                        scope.selectTool(toolMenuButton.buttons[0]);
                        scope.selectedToolMenu = null;
                    } else {
                        scope.selectedToolMenu = toolMenuButton;
                    }

                    scope.currentSheet.toolMenuExtension.updateLocation(toolMenuButton);
                };

                scope.showToolbar = function() {
                    document.getElementsByClassName('bluvue-sheet-tool-menu')[0].style.display = 'block';
                    document.getElementById('show-toolbar').style.display = 'none';
                };

                scope.resetZoom = function () {
                    scope.currentSheet.resetZoom();
                };
                
                scope.enterFullscreen = function() {
                    if (!document.fullscreenElement && !document.mozFullScreenElement &&
                        !document.webkitFullscreenElement && !document.msFullscreenElement &&
	                    !angular.element(document.querySelector('body')).hasClass('fullscreen-mode') ){
                        if (document.documentElement.requestFullscreen) {
                            document.documentElement.requestFullscreen();
                        } else if (document.documentElement.msRequestFullscreen) {
                            document.documentElement.msRequestFullscreen();
                        } else if (document.documentElement.mozRequestFullScreen) {
                            document.documentElement.mozRequestFullScreen();
                        } else if (document.documentElement.webkitRequestFullscreen) {
                            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                        }
                        document.getElementById("fullscreen_button").innerHTML = "Exit Full Screen";
                        document.getElementById("fullscreen_floating_block").style.display = "block";
                        document.getElementsByClassName("bluvue-sheet-header")[0].style.display = "none";
                        document.getElementsByClassName("bluvue-sheet-tool-menu")[0].style.display = "none";

	                      angular.element(document.querySelector('body')).addClass('fullscreen-mode');

                        scope.moreMenuToggle(true);
                    } else {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.msExitFullscreen) {
                            document.msExitFullscreen();
                        } else if (document.mozCancelFullScreen) {
                            document.mozCancelFullScreen();
                        } else if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen();
                        }
                        document.getElementById("fullscreen_button").innerHTML = "Full Screen";
                        document.getElementById("fullscreen_floating_block").style.display = "none";
                        document.getElementsByClassName("bluvue-sheet-header")[0].style.display = "block";
                        document.getElementsByClassName("bluvue-sheet-tool-menu")[0].style.display = "block";

	                      angular.element(document.querySelector('body')).removeClass('fullscreen-mode');
                    }
                };

                scope.editSheetName = function editSheetName() {
                  var dialog = new BluVueSheet.Dialog();
                  var holder = angular.element( "<div class='bluvue-editor-holder'/>" );
                  var editor = angular.element( "<input class='bluvue-sheetname-edit' value='"+ scope.sheet.name +"'></input>" );
                  holder.append( editor );
                  // Allow user to click input field
                  editor.on( 'click', function(e){ e.stopPropagation(); } );
                  // Spoof BluVueSheet.KeyboardControls to make it not eat our keypresses
                  var oldKeyCapture = scope.currentSheet.tileView.annotationManager.captureKeyboard;
                  scope.currentSheet.tileView.annotationManager.captureKeyboard=true;
                  dialog.showConfirmDialog( {
                    title: 'Change sheet name',
                    bodyElement: holder,
                    okLabel:'Save',
                    okAction: function saveSheetNameAction() {
                      scope.$apply(function() {
                        var val = editor[0].value;
                        if( val.length === 0 )
                          val = "Untitled";
                        if( val.length > 50 )
                          val = val.substring( 0, 50 );
                        scope.sheet.name = val;
                        scope.saveSheet(scope.sheet);
	                      dialog.hide();
                      });
                    },
                    cancelAction: function hideAction(){
                      scope.currentSheet.tileView.annotationManager.captureKeyboard=oldKeyCapture;
                      dialog.hide();
                    }
                  });
                };

                scope.selectRevision = function selectRevision() {
                    scope.scheduleAnnotationSync( null, null, function(){
                        var dialog = new BluVueSheet.Dialog();
                        var holder = angular.element( "<div class='bluvue-editor-holder'/>" );

                        var revisions = scope.revisionsForCurrentSheet( scope.currentSheet );
                        var editor = angular.element( "<select class='bluvue-revision-edit'></select>" );

                        revisions.forEach( function( rev, index ) {
                            var selected = ( rev.id == scope.sheet.id) ? " selected" : "";
                            editor.append( angular.element( "<option value='" + index + "'" + selected +">"+ (rev.versionName || rev.name) +"</option>") );
                        });

                        holder.append( editor );
                        // Allow user to click input field
                        editor.on( 'click', function(e){ e.stopPropagation(); } );
                        dialog.showConfirmDialog( {
                            title: 'Change Revision',
                            message: 'Choose revision from history list',
                            bodyElement: holder,
                            okLabel:'Change',
                            okAction: function () {
                                scope.$apply(function () {
                                    scope.openSheetById(revisions[editor[0].value].id);
	                                  dialog.hide();
                                });
                            }
                        });
                    }, true );
                };

                scope.rotateSheet = function rotateSheet() {
                    scope.currentSheet.tileView.annotationManager.deselectAllAnnotations();
                    scope.sheet.rotation = ((scope.sheet.rotation+90) % 360);
                    scope.currentSheet.tileView.setScale(0);
                    scope.currentSheet.tileView.setScroll(0,0);
                };

                scope.$watch('sheet', function (newValue) {
                    if (scope.currentSheet) {
                        scope.currentSheet.dispose();
                        scope.currentSheet = null;
                    }

                    if (newValue) {
                        scope.currentSheet = new BluVueSheet.Sheet();
                        scope.currentSheet.loadSheet(scope.sheet, scope, elem);
                        scope.options.currentSheetPinned = indexOfPinnedSheet(scope.sheet) >= 0;
                    } else {
                        scope.options.currentSheetPinned = false;
                    }
                    if( scope.getCurrentIndex() === 0 ) {
                        document.getElementById('previous-sheet-arrow').style.display = 'none';
                    }

                    if( scope.getTotalSheets() == 1 ) {
                        document.getElementById('next-sheet-arrow').style.display = 'none';
                    }

                    var overlay = angular.element( document.querySelector( '.overlay' ) );
                    overlay.toggleClass( 'bluvue-replaced-revision', scope.isReplacement() );

	                  scope.isShowAttachmentsButton = false;
                });

                scope.$on('$destroy', function () {
                    $window.onpopstate = null;
                    angular.element($window).off( 'resize', scope.windowResizeObserver );
                    angular.element($window).off( 'unload', windowCloseObserver );

                    if( scope.annotationWatcher )
                    {
                      $interval.cancel( scope.annotationWatcher );
                      delete scope.annotationWatcher;
                    }
                });

                //#region Pin Sheets
                var indexOfPinnedSheet = function(sheet) {
                    for (var i = 0; i < scope.pinnedSheets.length; i++) {
                        if (scope.pinnedSheets[i] === sheet) {
                            return i;
                        }
                    }

                    return -1;
                };

                scope.pinCurrentSheet = function () {
                    if (indexOfPinnedSheet(scope.sheet) !== -1) { return; }
                    scope.pinnedSheets.push(scope.sheet);
                    scope.options.currentSheetPinned = true;
                };

                scope.unpinSheet = function(index) {
                    scope.pinnedSheets.splice(index, 1);
                    scope.options.currentSheetPinned = indexOfPinnedSheet(scope.sheet) >= 0;
                };

                scope.selectPinnedSheet = function (pinnedSheet) {
                    if (scope.sheet === pinnedSheet) { return; }
                    scope.sheet = pinnedSheet;
                };
                //#endregion

                scope.moreMenuToggle = function (need_closed) {
                    need_closed = need_closed || false;

                    var menu = document.getElementsByClassName('bluvue-sheet-more-menu')[0];
                    var isClosed = menu.style.display == 'none' || !menu.style.display;

                    if(isClosed && !need_closed) {
                        menu.style.display = 'block';
                    } else {
                        menu.style.display = 'none';
                    }
                };

                scope.moreMenuItemClicked = function(menuItem) {
                    var f = menuItem.func;

                    try {
                        scope[f]();
                    }
                    catch(err) {
                        console.log('Exception while clicking "' + menuItem.func + '"', err );
                    }

                    scope.moreMenuToggle(true);
                };

                scope.alwaysShowToolHelp = function() {
                    return document.getElementById('toggle_tool_help_button').getElementsByTagName('span')[0].innerHTML != 'Show Tool Help';
                };

                scope.toggleToolHelp = function() {
                    var button = document.getElementById('toggle_tool_help_button').getElementsByTagName('span')[0];
                    var isShow = !scope.alwaysShowToolHelp();

                    if(isShow) {
                        button.innerHTML = 'Don\'t Show Tool Help';
	                      localStorage.showToolHelp = false;
                    } else {
                        button.innerHTML = 'Show Tool Help';
	                      localStorage.showToolHelp = true;
                    }
                };

                scope.selectNextSheet = function () {
                    scope.scheduleAnnotationSync( null, null, function(){
                        scope.nextSheet();

                        // Hide right arrow if nextSheet isn't exists
                        document.getElementById('previous-sheet-arrow').style.display = 'block';
                        if( scope.getCurrentIndex() === scope.getTotalSheets()-1 ) {
                            document.getElementById('next-sheet-arrow').style.display = 'none';
                        }
                    }, true );
                };

                scope.selectPreviousSheet = function () {
                    scope.scheduleAnnotationSync( null, null, function(){
                        scope.previousSheet();

                        // Hide right arrow if nextSheet isn't exists
                        document.getElementById('next-sheet-arrow').style.display = 'block';
                        if( scope.getCurrentIndex() === 0 ) {
                            document.getElementById('previous-sheet-arrow').style.display = 'none';
                        }
                    }, true );
                };

                scope.isReplacement = function isReplacement() {
                    var revisions = scope.revisionsForCurrentSheet( ) || [];

                    // starts at 1, not a replacement if i==0 matches
                    for( var i=1; i<revisions.length; i++ )
                    {
                        if( revisions[i].id == scope.sheet.id )
                            return true;
                    }
                    return false;
                };

                /**
                 * Schedules an annotation update with the remainder of the system.
                 * All updates must be routed though this implementation - clients
                 * should never use call syncAnnotations directly.
                 **/
                scope.scheduleAnnotationSync = function scheduleAnnotationSync( modifiedAnnotations, deleteIds, onComplete, forceSync )
                {
                  if( modifiedAnnotations && modifiedAnnotations.length )
                  {
                    for( var i=0; i<modifiedAnnotations.length; i++ )
                    {
                      var annotation = modifiedAnnotations[ i ];

                      var serializable = annotation;
                      if( angular.isFunction( annotation.toSerializable ) )
                          serializable = annotation.toSerializable();

                      scope.syncBuffer.modifiedAnnotations[ annotation.id ] = serializable;
                    }
                  }
                  scope.syncBuffer.deletedAnnotationIds = scope.syncBuffer.deletedAnnotationIds.concat(deleteIds||[] );

                  if( onComplete )
                    scope.syncBuffer.finallyQueue.push( onComplete );

                  if( forceSync )
                    scope.doAnnotationSync();
                };

                scope.syncBuffer = { modifiedAnnotations: {}, deletedAnnotationIds: [], finallyQueue:[] };
                scope.doAnnotationSync = function doAnnotationSync()
                {
                  var version = scope.sheet.annotationVersion;

                  var mod = [];
                  var modKeys = Object.keys( scope.syncBuffer.modifiedAnnotations ) || [];
                  for( var i=0; i<modKeys.length; i++ )
                  {
                    var need_delete = false;
                    for(var j=0; j < scope.syncBuffer.deletedAnnotationIds.length; j++) {
                      if(scope.syncBuffer.deletedAnnotationIds[j] == modKeys[i]) {
                        need_delete = true;
                        break;
                      }
                    }
                    if(!need_delete) {
                      mod.push( scope.syncBuffer.modifiedAnnotations[ modKeys[i] ] );
                    }
                  }
                  var del = scope.syncBuffer.deletedAnnotationIds;
                  var finallyQueue = scope.syncBuffer.finallyQueue;

                  // Empty the buffer as we're taking care of this now.
                  scope.syncBuffer.modifiedAnnotations = {};
                  scope.syncBuffer.deletedAnnotationIds = [];
                  scope.syncBuffer.finallyQueue = [];

                  scope.syncAnnotations( version, mod, del ).then( function( result ){
                    scope.sheet.annotationVersion = result.data.version;
                    var mgr = scope.currentSheet.tileView.annotationManager;

                    if( result.data.annotations ) {
                        mgr.onExternalAnnotationUpdate( result.data.annotations );
                    }

                    if( result.data.annotationDeletes ) {
                        mgr.onExternalAnnotationDelete( result.data.annotationDeletes );
                    }

	                  scope.currentSheet.tileView.setLoaded();

                  })["catch"]( function( err ) {
                    console.error( "Annotation sync error", err );
                  })["finally"]( function() {
                    for( var x=0; x<finallyQueue.length; x++ )
                    {
                      var callback = finallyQueue[x];
                      if (callback) {
                          callback();
                      }
                    }
                  });
                };
                scope.showAttachmentsPanel = function(need_apply, dont_change_filter) {
	                scope.attachmentFiles = [];

	                need_apply = need_apply || false;
	                dont_change_filter = dont_change_filter || false;

	                if(!need_apply && !dont_change_filter) {
		                scope.changeFilterAttachmentPanel('all');
	                }

	                scope.generateAttachmentFilesList(need_apply, true);

	                var panel = angular.element(document.querySelector('.bluvue-attachments-panel')),
		                  attachment_icon = angular.element(document.querySelector('.bv-options-attachments'));
                  document.getElementsByClassName('bluvue-attachments-panel-holder')[0].style.display = 'block';
                  panel.addClass('bluvue-attachments-panel-open');
	                attachment_icon.addClass('another-status');

	                var onKeyUp = function(event) {
		                switch(event.keyCode){
			                case 27: //esc
				                scope.hideAttachmentsPanel();
				                break;
		                }

		                window.removeEventListener('keyup', onKeyUp);
	                };

	                window.addEventListener("keyup", onKeyUp);

	                scope.isShowAttachmentNextButton = false;
	                scope.isShowAttachmentPreviousButton = false;
                };

                scope.generateAttachmentFilesList = function(need_apply, required_show_filters) {
	                required_show_filters = required_show_filters || false;

	                var mgr = scope.currentSheet.tileView.annotationManager,
		                att_all = mgr.getAttachments(false),
		                att_sel = mgr.getAttachments(true),
		                el_count_selected = angular.element(document.querySelector('#attachments-panel-filter-selected span')),
		                el_count_all      = angular.element(document.querySelector('#attachments-panel-filter-all span'));

	                el_count_selected.text(att_sel.length);
	                el_count_all.text(att_all.length);

	                scope.editModeAttachmentsAction('hide-all');

	                if('all' == scope.activeFilterAttachmentPanel()) {
		                scope.attachmentFiles = att_all;

		                if(required_show_filters && mgr.getSelectedAnnotation().length) {
			                scope.editModeAttachmentsAction('hide');
		                }

	                } else {
		                scope.attachmentFiles = att_sel;

		                var ann_sel = mgr.getSelectedAnnotation();

		                if (ann_sel.length == 1 && (!scope.attachmentFiles.length || ann_sel[0].userId == scope.userId || !ann_sel[0].userId && scope.isAdmin)) {
			                scope.editModeAttachmentsAction('close');
		                }
	                }

	                for(var i in scope.attachmentFiles) {
		                switch(scope.attachmentFiles[i].mimeType) {
			                case 'image/bmp':
			                case 'image/gif':
			                case 'image/jpeg':
			                case 'image/png':
			                case 'image/svg+xml':
			                case 'image/tiff':
				                scope.attachmentFiles[i].icon = 'photo';
				                break;
			                case 'text/csv':
			                case 'text/html':
			                case 'text/plain':
			                case 'text/rtf':
			                case 'application/pdf':
			                case 'application/vnd.ms-excel':
			                case 'application/msword':
			                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
			                case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			                case 'application/vnd.ms-powerpoint':
			                case 'message/rfc822':
				                scope.attachmentFiles[i].icon = 'document';
				                break;
			                case 'video/avi':
			                case 'video/mpeg':
			                case 'video/mp4':
				                scope.attachmentFiles[i].icon = 'video';
				                break;
			                case 'audio/mp4':
			                case 'audio/mpeg':
			                case 'audio/webm':
				                scope.attachmentFiles[i].icon = 'audio';
		                }

		                switch(scope.attachmentFiles[i].annotation.type) {
			                case SQUARE_ANNOTATION: scope.attachmentFiles[i].type_label = 'Square'; break;
			                case X_ANNOTATION: scope.attachmentFiles[i].type_label = 'X'; break;
			                case CIRCLE_ANNOTATION: scope.attachmentFiles[i].type_label = 'Circle'; break;
			                case ARROW_ANNOTATION: scope.attachmentFiles[i].type_label = 'Arrow'; break;
			                case CLOUD_ANNOTATION: scope.attachmentFiles[i].type_label = 'Cloud'; break;
			                case TEXT_ANNOTATION: scope.attachmentFiles[i].type_label = 'Text'; break;
			                case LINE_ANNOTATION: scope.attachmentFiles[i].type_label = 'Line'; break;
			                case PEN_ANNOTATION: scope.attachmentFiles[i].type_label = 'Pen'; break;
			                case HIGHLIGHTER_ANNOTATION: scope.attachmentFiles[i].type_label = 'Pencil'; break;
			                case SCALE_ANNOTATION: scope.attachmentFiles[i].type_label = 'Calibration'; break;
			                case MEASURE_ANNOTATION: scope.attachmentFiles[i].type_label = 'Distance'; break;
			                case POLYGON_ANNOTATION: scope.attachmentFiles[i].type_label = 'Polygon'; break;
			                case FREE_FORM_ANNOTATION: scope.attachmentFiles[i].type_label = 'Free-form'; break;
		                }

		                var filename = scope.attachmentFiles[i].name;
		                scope.attachmentFiles[i].filename = filename.substr(0, filename.lastIndexOf('.'));
		                scope.attachmentFiles[i].fileextension = filename.substr(filename.lastIndexOf('.'));
	                }

	                if(need_apply) {
		                scope.$apply();
	                }
                };

	            scope.selectAttachmentItem = function(position) {
		            var el = document.getElementById('attachments-panel-files').getElementsByTagName('li')[position],
			            ael = angular.element(el);

		            el.scrollIntoView({block: "end"});
		            ael.addClass('active-element');

		            setTimeout(function() {
			            ael.removeClass('active-element');
		            }, 300);
	            };

                scope.hideAttachmentsPanel = function() {
	                var panel = angular.element(document.querySelector('.bluvue-attachments-panel')),
		                  attachment_icon = angular.element(document.querySelector('.bv-options-attachments'));

	                document.getElementsByClassName('bluvue-attachments-panel-holder')[0].style.display = 'none';
	                panel.removeClass('bluvue-attachments-panel-open');

	                attachment_icon.removeClass('another-status');

	                scope.isShowAttachmentNextButton = false;
	                scope.isShowAttachmentPreviousButton = false;
                };

                scope.changeFilterAttachmentPanel = function(filter, need_apply) {
	                var selected = angular.element(document.querySelector('#attachments-panel-filter-selected'));
	                var all = angular.element(document.querySelector('#attachments-panel-filter-all'));
	                if('all' == filter) {
		                selected.removeClass('active');
		                all.addClass('active');
		                scope.addModeAttachmentsAction('close');
	                } else {
		                selected.addClass('active');
		                all.removeClass('active');
	                }

	                scope.generateAttachmentFilesList(false, true);
                };

                scope.activeFilterAttachmentPanel = function() {
	                var is_all = angular.element(document.querySelector('#attachments-panel-filter-all')).hasClass('active');
	                return is_all ? 'all' : 'selected';
                };

	              scope.addModeAttachmentsAction = function(action) {
									switch(action) {
										case 'open':
											scope.isShowAddAttachmentPanel = true;
											break;
										case 'close':
											scope.isShowAddAttachmentPanel = false;
											break;
									}
	              };

		            scope.editModeAttachmentsAction = function(action) {
			            switch(action) {
				            case 'open':
					            scope.isHideAttachmentsPanelCancelControls = false;
					            scope.isHideAttachmentsPanelControls = true;
					            scope.isHideAttachmentsPanelFilterControls = false;
					            break;
				            case 'close':
					            scope.isHideAttachmentsPanelCancelControls = true;
					            scope.isHideAttachmentsPanelControls = false;
					            scope.isHideAttachmentsPanelFilterControls = false;
					            break;
				            case 'hide':
					            scope.isHideAttachmentsPanelCancelControls = true;
					            scope.isHideAttachmentsPanelControls = true;
					            scope.isHideAttachmentsPanelFilterControls = false;
					            break;
				            case 'hide-all':
					            scope.isHideAttachmentsPanelCancelControls = true;
					            scope.isHideAttachmentsPanelControls = true;
					            scope.isHideAttachmentsPanelFilterControls = true;
			            }
		            };

	              scope.addAttachmentAction = function(filetype) {
                  var mgr = scope.currentSheet.tileView.annotationManager;
                  var annotation = mgr.getSelectedAnnotation()[0];

		              var appendFile = function(lat, lon) {
			              scope.fileChooser.chooseAttachment( function attachmentAdded( fileInfo ) {

				              var options = {
					              createdDate: scope.generateTimestamp(),
					              id: scope.generateUUID(),
					              name: fileInfo.filename,
					              mimeType: fileInfo.mimetype,
					              url: fileInfo.url,
					              userId: scope.userId,
					              email: scope.email,
					              amazonKeyPath: fileInfo.key
				              };

				              if(lat && lon ) {
					              options.location = {
						              "id": scope.generateUUID(),
						              "horizontalAccuracy": 192,
						              "longitude": lon,
						              "verticalAccuracy": 192,
						              "latitude": lat,
						              "altitude": 0,
						              "determinationDate": scope.generateTimestamp()
					              };
				              }

				              mgr.addAttachment( annotation, options);

				              scope.changeFilterAttachmentPanel('selected');
				              scope.addModeAttachmentsAction('close');
				              scope.generateAttachmentFilesList(true);
				              scope.selectAttachmentItem(0);

			              }, function attachmentCanceled() {}, filetype);
		              };

		              navigator.geolocation.getCurrentPosition(function(position) {
			              appendFile(position.coords.latitude, position.coords.longitude);
		              }, function() {
			              appendFile(null, null);
		              });
                };

	            scope.removeAttachment = function(attachment_id) {
		            var mgr = scope.currentSheet.tileView.annotationManager;

		            mgr.removeAttachment(mgr.getSelectedAnnotation()[0], attachment_id);
		            scope.generateAttachmentFilesList();

		            if(scope.attachmentFiles.length) {
			            scope.editModeAttachmentsAction('open');
		            } else {
			            scope.editModeAttachmentsAction('close');
		            }
	            };

	            scope.openInPopup = function(url) {
		            window.open(url, url, 'width=500,height=500');
	            };

	            scope.openInTab = function(url) {
		            window.open(url, "_blank", "");
	            };

	            scope.openInViewer = function(url, type, name, index) {
		            scope.openAttachmentIndex = index;

		            scope.hideAttachmentsPanel();
		            scope.isShowViewerPlaceholder = true;

		            scope.viewerData = {
			            icon: type,
			            url: url,
			            filename: name
		            };

		            angular.element(document.querySelector('.bluvue-viewer-panel-holder')).addClass('bluvue-viewer-panel-holder-active');

		            var panel_inline = document.getElementsByClassName('bluvue-viewer-panel-content-inline')[0];

		            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({width: 'auto'});

		            scope.stopViewerMedia();

		            switch(type) {
			            case 'photo':
				            var image = document.getElementById('viewer-photo');
				            image.style.display = 'none';
				            image.src = url;

				            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({height: 'auto'});

				            var viewerPhoto = function (blockMode) {
					            if(blockMode === undefined) {
						            blockMode = true;
					            }

					            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({});

					            if(blockMode) {
						            image.style.display = 'block';
					            }

					            var css = {
						            height: !image.clientHeight || image.clientHeight > (window.innerHeight - 100) ? (window.innerHeight - 145) + 'px' : image.height + 'px',
						            top: (window.innerHeight + 100 - (!image.clientHeight || image.clientHeight > (window.innerHeight - 100) ? (window.innerHeight - 145) + 'px' : image.height)) / 2 + 'px'
					            };

					            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css(css);

					            // Set left param after set real height
					            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({
						            left: (window.outerWidth - document.querySelectorAll(".bluvue-viewer-panel-content")[0].clientWidth) / 2 + 'px'
					            });
				            };

				            image.onload = viewerPhoto;

				            var imageWasLoading = false;
				            for(var i in scope.loadingImagesList) {
					            if(scope.loadingImagesList[i] == url) {
						            imageWasLoading = true;
					            }
			              }

				            if(!imageWasLoading) {
					            scope.loadingImagesList.push(url);
				            } else {
					            viewerPhoto(true);
				            }

				            var onResize = function() {
											viewerPhoto(false);
					            window.removeEventListener('resize', onResize);
					            window.addEventListener('resize', onResize, true);
				            };

				            onResize();

				            break;
			            case 'video':
				            angular.element(document.querySelector('#viewer-video')).append('<source src="' + url + '">');
				            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({
					            left: 'calc(50% - 240px)',
					            top: 'calc(50% - 135px)'
				            });
				            break;
			            case 'audio':
				            angular.element(document.querySelector('#viewer-audio')).append('<source src="' + url + '">');
				            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({
					            left: 'calc(50% - 150px)',
					            top: 'calc(50% - 15px)'
				            });
				            break;
			            case 'document':
				            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({
					            cursor: 'pointer',
					            left: 'calc(50% - 75px)',
					            top: '50%',
				              width: '150px',
				              textAlign: 'center'
				            });
				            break;
		            }

		            var col_attachments = angular.element(document.querySelectorAll('#attachments-panel-files li')).length;

		            scope.isShowAttachmentNextButton = index + 1 != col_attachments;
		            scope.isShowAttachmentPreviousButton = index;
	            };

	            scope.hideViewer = function() {
		            scope.showAttachmentsPanel(false, true);
		            scope.isShowViewerPlaceholder = false;

		            angular.element(document.querySelector('.bluvue-viewer-panel-content')).css({height: 'auto', left: '-10000px'});

		            angular.element(document.querySelector('.bluvue-viewer-panel-holder')).removeClass('bluvue-viewer-panel-holder-active');

		            var image = document.getElementById('viewer-photo');
		            image.style.display = 'none';

		            scope.stopViewerMedia();

		            scope.isShowAttachmentPreviousButton = false;
		            scope.isShowAttachmentNextButton = false;
	            };

	            scope.stopViewerMedia = function() {
		            var video = document.querySelector('#viewer-video'),
		                audio = document.querySelector('#viewer-audio');

		            audio.pause();
		            video.pause();

		            audio.addEventListener('pause', function () {
			            this.currentTime = 0;
		            }, false);

		            video.addEventListener('pause', function () {
			            this.currentTime = 0;
		            }, false);

		            angular.element(video).empty();
		            angular.element(audio).empty();
	            };

                scope.fileChooser = new BluVueSheet.FileChooser( scope );

                scope.generateUUID = function generateUUID( base64 ) {
                  var d = new Date().getTime();
                  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = (d + Math.random()*16)%16 | 0;
                      d = Math.floor(d/16);
                      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
                  });
                  uuid = uuid.replace( /-/g, '' );
                  return base64 ? scope.uuidToBase64( uuid ) : uuid;
                };

                var hexlist = '0123456789abcdef';
                var b64list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

                scope.uuidToBase64 = function uuidToBase64( g )
                {
                  var s = g.replace(/[^0-9a-f]/ig,'').toLowerCase();
                  if (s.length != 32) return '';

                  s = s.slice(6,8) + s.slice(4,6) + s.slice(2,4) + s.slice(0,2) +
                        s.slice(10,12) + s.slice(8,10) +
                        s.slice(14,16) + s.slice(12,14) +
                        s.slice(16);
                  s += '0';

                  var a, p, q;
                  var r = '';
                  var i = 0;
                  while (i < 33) {
                   a =  (hexlist.indexOf(s.charAt(i++)) << 8) |
                        (hexlist.indexOf(s.charAt(i++)) << 4) |
                        (hexlist.indexOf(s.charAt(i++)));

                   p = a >> 6;
                   q = a & 63;

                   r += b64list.charAt(p) + b64list.charAt(q);
                  }

                  return r;
                };

                scope.generateTimestamp = function generateTimestamp() {
                  return (new Date()).toISOString();
                };

	              scope.checkMenuItemShowCondition = function(menuItem) {
		                switch(menuItem.func) {
			                case 'notesDialog':
												return scope.userCanEditNotes() || scope.sheetHasNotes();

			                case 'selectRevision':
				                return scope.sheetCountRevisions() > 1;

		                }

		              return true;
	              };

	              scope.sheetHasNotes = function() {
		              return null !== scope.sheet.notes;
	              };

		            scope.userCanEditNotes = function() {
			            return scope.canEditNotes;
		            };

		            scope.sheetHasRevisions = function() {
			            return scope.revisionsForCurrentSheet(scope.currentSheet) ? true: false;
		            };

		            scope.sheetCountRevisions = function() {
			            return scope.revisionsForCurrentSheet(scope.currentSheet).length;
		            };

	              scope.notesDialog = function(openAnimate, hideAnimate) {
			            var dialog = new BluVueSheet.Dialog({showType: 'panel', openAnimate: openAnimate, hideAnimate: hideAnimate});
			            var holder = angular.element( "<div class='bluvue-editor-holder'/>" );

			            if(scope.sheet.notes === null) {
				            scope.notesEditDialog(true);
				            return;
			            }

		              var openEditDialog = function () {
			              scope.$apply(function () {
				              dialog.destroy();
				              scope.notesEditDialog(false, true, true);
			              });
		              };

		              var sheetNotesElement = angular.element('<div class="notes-body notes-body-with-border">' + scope.sheet.notes + '</div>')
			              .on('click', openEditDialog);

			            dialog.showConfirmDialog( {
				            title: 'Notes',
				            message: '',
				            bodyElement: sheetNotesElement,
				            button2Label:'Edit',
				            hideOkButton: true,
				            hideCancelButton: true,
				            button2Action: openEditDialog
			            });
		            };

		            scope.notesEditDialog = function(openAnimate, hideAnimate, fromShowDialog) {
			            fromShowDialog = fromShowDialog || false;

			            var dialog = new BluVueSheet.Dialog({showType: 'panel', openAnimate: openAnimate, hideAnimate: hideAnimate});
			            var holder = angular.element( "<div class='bluvue-editor-holder'/>" );
			            var notes = scope.sheet.notes === null ? '' : scope.sheet.notes;

			            var editor = angular.element( "<div class=\"notes-body\"><textarea class=\"notes-editor\" id=\"notes-editor\" maxlength=\"8000\">"+ notes +"</textarea></div><hr>" );

			            holder.append( editor );
			            // Allow user to click input field
			            editor.on( 'click', function(e){ e.stopPropagation(); } );


			            var insertAtCursor = function insertAtCursor(myField, myValue) {
				            //IE support
				            if (document.selection) {
					            myField.focus();
					            var sel = document.selection.createRange();
					            sel.text = myValue;
				            }
				            //MOZILLA and others
				            else if (myField.selectionStart || myField.selectionStart == '0') {
					            var startPos = myField.selectionStart;
					            var endPos = myField.selectionEnd;
					            myField.value = myField.value.substring(0, startPos)
					            + myValue
					            + myField.value.substring(endPos, myField.value.length);
				            } else {
					            myField.value += myValue;
				            }
				            //myField.focus();
			            };

			            var doGetCaretPosition = function doGetCaretPosition(ctrl) {
				            var CaretPos = 0;	// IE Support
				            if (document.selection) {
					            ctrl.focus ();
					            var Sel = document.selection.createRange ();
					            Sel.moveStart ('character', -ctrl.value.length);
					            CaretPos = Sel.text.length;
				            }
				            // Firefox support
				            else if (ctrl.selectionStart || ctrl.selectionStart == '0')
					            CaretPos = ctrl.selectionStart;
				            return (CaretPos);
			            };

			            var setCaretPosition = function (elem, caretPos) {
				            if(elem !== null) {
					            if(elem.createTextRange) {
						            var range = elem.createTextRange();
						            range.move('character', caretPos);
						            range.select();
					            }
					            else {
						            elem.focus();
						            elem.setSelectionRange(caretPos, caretPos);
					            }
				            }
			            };

			            var moveCaretToEnd = function (el) {
				            if (typeof el.selectionStart == "number") {
					            el.selectionStart = el.selectionEnd = el.value.length;
				            } else if (typeof el.createTextRange != "undefined") {
					            el.focus();
					            var range = el.createTextRange();
					            range.collapse(false);
					            range.select();
				            }
			            };

			            var addText = function(text) {
				            var el = document.getElementById('notes-editor'),
					            pos = doGetCaretPosition(el);

				            insertAtCursor(el, (el.value[pos-1] != "\n" && pos ? "\n" : "") + text + "\n");
				            setCaretPosition(el, pos + text.length + (el.value[pos-1] != "\n" && pos ? 2 : 1));
			            };

			            var save = function() {
				            scope.$apply(function() {
					            var notes = document.getElementById('notes-editor').value;

					            if(!notes.length) {
						            notes = null;
					            }

					            scope.sheet.notes = notes;
					            scope.saveSheet(scope.sheet);

					            dialog.hide();
				            });
			            };

			            var isChangeNote = function(fromShowDialog) {
				            var temp_note   = document.getElementById('notes-editor').value,
					              sheet_note  = scope.sheet.notes;

				            if(sheet_note == null) {
					            sheet_note = '';
				            }

				            if(sheet_note == temp_note) {
					            return false;
				            }

				            var dialog = new BluVueSheet.Dialog();

				            dialog.showConfirmDialog({
					            title: 'Discard your changes?',
					            bodyElement: '<div style="text-align: center;">This Note has been modified. Discard changes?</div>',
					            cancelLabel: 'Cancel',
					            okLabel: 'Yes',
					            okAction: function() {
						            dialog.hide();
					            },
					            cancelAction: function() {
						            dialog.hide();
						            scope.notesEditDialog(false, true, fromShowDialog);
						            document.getElementById('notes-editor').value = temp_note;
					            }
				            });
				            return true;
			            };

			            dialog.showConfirmDialog({
				            title: 'Notes',
				            message: '',
				            bodyElement: editor,
				            button2Label:'Save',
				            cancelLabel: 'Add Name',
				            okLabel: 'Add Date',
				            buttonClass: 'button-with-border',
				            okAction: function() {
					            addText($filter('date')(new Date(), 'MMM d, y h:mm a'));
				            },
				            cancelAction: function() {
					            addText(scope.fullName);
				            },
				            button1Action: function() {
					            if(fromShowDialog) {
						            scope.notesDialog(false, true);
					            } else {
						            dialog.hide();
					            }
				            },
				            button2Action: (function (save, fromShowDialog) {
					            return function() {
						            save();

						            if(fromShowDialog && scope.sheet.notes != null) {
							            scope.notesDialog(false, true);
						            }
					            };
				            })(save, fromShowDialog),
				            defaultHideAction: function() {
					            if(document.getElementById('notes-editor').value == '' && scope.sheet.notes == null) {
						            dialog.hide();
						            return;
					            }

					            // Show prompt dialog if notes was changed, but don't saved
					            if(!isChangeNote(fromShowDialog)) {
						            scope.notesDialog(false, true);
					            }
				            }
			            });

			            moveCaretToEnd(document.getElementById('notes-editor'));
			            document.getElementById('notes-editor').focus();
		            };

		            scope.selectPreviousAttachment = function() {
			            scope.openAttachmentIndex--;

			            var cur_attachment = angular.element(document.querySelectorAll('#attachments-panel-files li')[scope.openAttachmentIndex]);

			            scope.openInViewer(cur_attachment.attr('data-url'), cur_attachment.attr('data-icon'), cur_attachment.attr('data-name'), scope.openAttachmentIndex);

	              };

	              scope.selectNextAttachment = function() {
			            scope.openAttachmentIndex++;

			            var cur_attachment = angular.element(document.querySelectorAll('#attachments-panel-files li')[scope.openAttachmentIndex]);

			            scope.openInViewer(cur_attachment.attr('data-url'), cur_attachment.attr('data-icon'), cur_attachment.attr('data-name'), scope.openAttachmentIndex);
	              };
            }
        };
    }
]);
