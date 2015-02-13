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
                attachmentsBucketName: "="
            },
            restrict: "E",
            replace: true,
            transclude: false,
            templateUrl: "template/bluvue-sheet.html?_=" + Math.random().toString(36).substring(7),
            link: function bvSheetLink(scope, elem) {
                scope.currentSheet = null;
                scope.selectedTool = null;
                scope.tools = BluVueSheet.Constants.Tools;
                scope.toolMenuButtons = BluVueSheet.Constants.ToolMenuButtons;
                scope.toolMoreMenu = [];
                scope.toolMenuButtonTools = [0,0,0,0,0,0,0];
                scope.selectedToolMenu = null;
                scope.textSizes = BluVueSheet.Constants.TextSizes;

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
                }

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

                scope.close = function () {
                    if (!backPressed) {
                        setTimeout(function() {
                            $window.history.back();
                        }, 0);
                        return;
                    }

                    scope.currentSheet.dispose();
                    scope.closeSheet();
                }

                scope.deselectTool = function() {
                    scope.selectTool(null);
                    scope.$apply();
                    scope.moreMenuToggle(true);
                }

                scope.selectTool = function(tool) {
                    if( !tool || (scope.selectedTool && tool.id === scope.selectedTool.id) ) {
                        scope.selectedTool = null;
                        tool = null;
                    }

                    if( tool )
                    {
                        if( tool.id == BluVueSheet.Constants.Tools.Calibration.id )
                        {
                            var mgr = scope.currentSheet.tileView.annotationManager;
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
                            var mgr = scope.currentSheet.tileView.annotationManager;
                            if( !mgr.scaleAnnotation )
                            {
                                // There's no calibration, so enforce one!
                                tool = BluVueSheet.Constants.Tools.Calibration;
                            }
                        }

                        if( !tool.visited || scope.alwaysShowToolHelp() )
                        {
                            toolipDialog.showTooltip( {
                               title: tool.label||tool.name,
                               message:tool.description,
                               image: tool.heroImage
                            });
                        }
                        tool.visited = true;

                        scope.selectedTool = tool;
                    }

                    for( var i=0; i<scope.toolMenuButtonTools.length; i++ )
                    {
                        scope.toolMenuButtonTools[i] = (tool) ? ((tool.menuId==i) ? tool.menuIndex:0) : 0;
                    }

                    if( scope.selectedTool == null ) {
                        angular.forEach(document.querySelectorAll(".bluvue-sheet-tool-menu .bv-toolbar-image"), function(value, key){
                            angular.element(value).removeClass('active-child-tool');
                        });
                    }

                    scope.currentSheet.setTool( scope.selectedTool );

                    //update tool menu
                    scope.selectedToolMenu = null;
                }

                scope.toolMenuButtonClicked = function(toolMenuButton) {
                    // If need un-expand expanded tool item
                    if(scope.selectedToolMenu != null && scope.selectedToolMenu.id == toolMenuButton.id && toolMenuButton.buttons.length > 1) {
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
                }

                scope.showToolbar = function() {
                    document.getElementsByClassName('bluvue-sheet-tool-menu')[0].style.display = 'block';
                    document.getElementById('show-toolbar').style.display = 'none';
                }

                scope.resetZoom = function () {
                    scope.currentSheet.resetZoom();
                }
                scope.enterFullscreen = function() {
                    if (!document.fullscreenElement && !document.mozFullScreenElement &&
                        !document.webkitFullscreenElement && !document.msFullscreenElement ){
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
                        if( val.length == 0 )
                          val = "Untitled";
                        if( val.length > 50 )
                          val = val.substring( 0, 50 );
                        scope.sheet.name = val;
                        scope.saveSheet(scope.sheet);
                      });
                    },
                    cancelAction: function hideAction(){
                      scope.currentSheet.tileView.annotationManager.captureKeyboard=oldKeyCapture;
                      dialog.hide();
                    }
                  });
                }

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
                                });
                            }
                        });
                    }, true );
                }

                scope.rotateSheet = function rotateSheet() {
                    scope.currentSheet.tileView.annotationManager.deselectAllAnnotations();
                    scope.sheet.rotation = ((scope.sheet.rotation+90) % 360);
                    scope.currentSheet.tileView.setScale(0);
                    scope.currentSheet.tileView.setScroll(0,0);
                }

                scope.$watch('sheet', function (newValue) {
                    if (scope.currentSheet != null) {
                        scope.currentSheet.dispose();
                        scope.currentSheet = null;
                    }

                    if (newValue != null) {
                        scope.currentSheet = new BluVueSheet.Sheet();
                        scope.currentSheet.loadSheet(scope.sheet, scope, elem);
                        scope.options.currentSheetPinned = indexOfPinnedSheet(scope.sheet) >= 0;
                    } else {
                        scope.options.currentSheetPinned = false;
                    }
                    if( scope.getCurrentIndex() == 0 ) {
                        document.getElementById('previous-sheet-arrow').style.display = 'none';
                    }

                    if( scope.getTotalSheets() == 1 ) {
                        document.getElementById('next-sheet-arrow').style.display = 'none';
                    }

                    var overlay = angular.element( document.querySelector( '.overlay' ) );
                    overlay.toggleClass( 'bluvue-replaced-revision', scope.isReplacement() );
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
                }

                scope.pinCurrentSheet = function () {
                    if (indexOfPinnedSheet(scope.sheet) !== -1) { return; }
                    scope.pinnedSheets.push(scope.sheet);
                    scope.options.currentSheetPinned = true;
                }

                scope.unpinSheet = function(index) {
                    scope.pinnedSheets.splice(index, 1);
                    scope.options.currentSheetPinned = indexOfPinnedSheet(scope.sheet) >= 0;
                }

                scope.selectPinnedSheet = function (pinnedSheet) {
                    if (scope.sheet === pinnedSheet) { return; }
                    scope.sheet = pinnedSheet;
                }
                //#endregion

                scope.moreMenuToggle = function (need_closed) {
                    var need_closed = need_closed || false;

                    var menu = document.getElementsByClassName('bluvue-sheet-more-menu')[0];
                    var isClosed = menu.style.display == 'none' || menu.style.display == '';

                    if(isClosed && !need_closed) {
                        menu.style.display = 'block';
                    } else {
                        menu.style.display = 'none';
                    }
                }

                scope.moreMenuItemClicked = function(menuItem) {
                    var f = menuItem.func;

                    try {
                        scope[f]();
                    }
                    catch(err) {
                        console.log('Exception while clicking "' + menuItem.func + '"', err );
                    }

                    scope.moreMenuToggle(true);
                }

                scope.alwaysShowToolHelp = function() {
                    return document.getElementById('toggle_tool_help_button').getElementsByTagName('span')[0].innerHTML != 'Show Tool Help';
                };

                scope.toggleToolHelp = function() {
                    var button = document.getElementById('toggle_tool_help_button').getElementsByTagName('span')[0];
                    var isShow = !scope.alwaysShowToolHelp();

                    if(isShow) {
                        button.innerHTML = 'Don\'t Show Tool Help';
                    } else {
                        button.innerHTML = 'Show Tool Help';
                    }
                }

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
                        if( scope.getCurrentIndex() == 0 ) {
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
                scope.showAttachmentsPanel = function(need_apply) {
	                need_apply = need_apply || false;

	                scope.generateAttachmentFilesList(need_apply);

	                var panel = angular.element(document.querySelector('.blubue-attachments-panel')),
		                  attachment_icon = angular.element(document.querySelector('.bv-options-attachments'));
                  document.getElementsByClassName('blubue-attachments-panel-holder')[0].style.display = 'block';
                  panel.addClass('blubue-attachments-panel-open');
	                attachment_icon.addClass('another-status');
                }

                scope.generateAttachmentFilesList = function(need_apply) {
	                var mgr = scope.currentSheet.tileView.annotationManager,
		                att_all = mgr.getAttachments(false),
		                att_sel = mgr.getAttachments(true),
		                el_count_selected = angular.element(document.querySelector('#attachments-panel-filter-selected span')),
		                el_count_all      = angular.element(document.querySelector('#attachments-panel-filter-all span'));

	                el_count_selected.text(att_sel.length);
	                el_count_all.text(att_all.length);

	                scope.editModeAttachmentsAction('hide');

	                if('all' == scope.activeFilterAttachmentPanel()) {
		                scope.attachmentFiles = att_all;
	                } else {
		                scope.attachmentFiles = att_sel;

		                var ann_sel = mgr.getSelectedAnnotation();

		                if(ann_sel.length == 1 && (!scope.attachmentFiles.length || ann_sel[0].userId == scope.userId || ann_sel[0].userId == null && scope.isAdmin)) {
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
	                }

	                if(need_apply) {
		                scope.$apply();
	                }
                }

                scope.hideAttachmentsPanel = function() {
	                var panel = angular.element(document.querySelector('.blubue-attachments-panel')),
		                  attachment_icon = angular.element(document.querySelector('.bv-options-attachments'));

	                document.getElementsByClassName('blubue-attachments-panel-holder')[0].style.display = 'none';
	                panel.removeClass('blubue-attachments-panel-open');

	                attachment_icon.removeClass('another-status');
                }

                scope.changeFilterAttachmentPanel = function(filter) {
	                var selected = angular.element(document.querySelector('#attachments-panel-filter-selected'));
	                var all = angular.element(document.querySelector('#attachments-panel-filter-all'));
	                if('all' == filter) {
		                selected.removeClass('active');
		                all.addClass('active');
	                } else {
		                selected.addClass('active');
		                all.removeClass('active');
	                }

	                scope.generateAttachmentFilesList();
                };

                scope.activeFilterAttachmentPanel = function() {
	                var is_all = angular.element(document.querySelector('#attachments-panel-filter-all')).hasClass('active');
	                return is_all ? 'all' : 'selected';
                };

	              scope.editModeAttachmentsAction = function(action) {
									switch(action) {
										case 'open':
											scope.isHideAttachmentsPanelCancelControls = false;
											scope.isHideAttachmentsPanelControls = true;
											break;
										case 'close':
											scope.isHideAttachmentsPanelCancelControls = true;
											scope.isHideAttachmentsPanelControls = false;
											break;
										case 'hide':
											scope.isHideAttachmentsPanelCancelControls = true;
											scope.isHideAttachmentsPanelControls = true;
											break;
									}
	              };

	              scope.addAttachmentAction = function() {
                  var mgr = scope.currentSheet.tileView.annotationManager;
                  var annotation = mgr.getSelectedAnnotation()[0];

                  scope.fileChooser.chooseAttachment( function attachmentAdded( fileInfo ) {

                    mgr.addAttachment( annotation, {
                      createdDate: $filter('date')( new Date(), 'yyyy-MM-dd HH:mm:ss' ),
                      id: scope.generateUUID(),
                      name: fileInfo.filename,
                      mimeType: fileInfo.mimetype,
                      url: fileInfo.url,
                      userId: scope.userId,
                      email: scope.email,
                      amazonKeyPath: fileInfo.key
                    });

                  }, function attachmentCanceled() {
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

                scope.fileChooser = new BluVueSheet.FileChooser( scope );

                scope.generateUUID = function generateUUID() {
                  var d = new Date().getTime();
                  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = (d + Math.random()*16)%16 | 0;
                      d = Math.floor(d/16);
                      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
                  });
                  return uuid.replace( /-/g, '' );
                };

               // Force initial sync to occur at link time
              scope.doAnnotationSync();

            }
        }
    }
]);
