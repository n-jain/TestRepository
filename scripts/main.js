angular.module("bluvueSheet", []);

angular.module("bluvueSheet").directive("bvSheet", ['$window', '$location', '$interval',
    function sheetDirective($window, $location, $interval) {
        'use strict';

        return {
            scope: {
                sheet: "=",
                userId: "=",
                isAdmin: "=",
                syncAnnotations: "=",
                saveAnnotation: "=",
                deleteAnnotation: "=",
                closeSheet: "=",
                nextSheet: "=",
                previousSheet: "=",
                pinnedSheets: "=",
                getCurrentIndex: "=",
                getTotalSheets: "=",
                revisionsForCurrentSheet: "=",
                openSheetById: "=",
                saveSheet: "="
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
                scope.toolMoreMenu = BluVueSheet.Constants.MoreMenu;
                scope.toolMenuButtonTools = [0,0,0,0,0,0,0];
                scope.selectedToolMenu = null;
                scope.textSizes = BluVueSheet.Constants.TextSizes;

                var toolipDialog = new BluVueSheet.Dialog();

                var backPressed = false;
                $window.history.pushState({}, "", $location.absUrl());
                $window.onpopstate = function () {
                    scope.$apply(function () {
                        backPressed = true;
                        scope.close();
                    });
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

                console.log( "WARNING!  Using very slow sync for debug.  FIX ME FOR RELEASE!" )
                //scope.annotationWatcher = $interval( function(){scope.doAnnotationSync();}, BluVueSheet.Constants.ANNOTATION_SYNC_INTERVAL );
                scope.annotationWatcher = $interval( function(){scope.doAnnotationSync();}, 15*1000 );

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
                  var dialog = new BluVueSheet.Dialog();
                  var holder = angular.element( "<div class='bluvue-editor-holder'/>" );

                  var revisions = scope.revisionsForCurrentSheet( scope.currentSheet );
                  var editor = angular.element( "<select class='bluvue-revision-edit'></select>" );

                  revisions.forEach( function( rev, index ) {
                    var selected = ( rev.id == scope.sheet.id) ? " selected" : "";
                    editor.append( angular.element( "<option value='" + index + "'" + selected +">"+ rev.name +"</option>") );
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
                    scope.nextSheet();

                    // Hide right arrow if nextSheet isn't exists
                    document.getElementById('previous-sheet-arrow').style.display = 'block';
                    if( scope.getCurrentIndex() === scope.getTotalSheets()-1 ) {
                        document.getElementById('next-sheet-arrow').style.display = 'none';
                    }
                };

                scope.selectPreviousSheet = function () {
                    scope.previousSheet();

                    // Hide right arrow if nextSheet isn't exists
                    document.getElementById('next-sheet-arrow').style.display = 'block';
                    if( scope.getCurrentIndex() == 0 ) {
                        document.getElementById('previous-sheet-arrow').style.display = 'none';
                    }
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
                  scope.syncBuffer.modifiedAnnotations.concat( modifiedAnnotations );
                  scope.syncBuffer.deletedAnnotationIds.concat( deletedAnnotationIds );

                  if( onComplete )
                    scope.syncBuffer.finallyQueue.push( onComplete );

                  if( forceSync )
                    scope.doAnnotationSync();
                };

                scope.syncBuffer = { modifiedAnnotations: [], deletedAnnotationIds: [], finallyQueue:[] };
                scope.doAnnotationSync = function doAnnotationSync()
                {
                  var version = scope.sheet.annotationVersion;
                  var mod = scope.syncBuffer.modifiedAnnotations;
                  var del = scope.syncBuffer.deletedAnnotations;
                  var finallyQueue = scope.syncBuffer.finallyQueue;

                  // Empty the buffer as we're taking care of this now.
                  scope.syncBuffer.modifiedAnnotations = [];
                  scope.syncBuffer.deletedAnnotations = [];
                  scope.syncBuffer.finallyQueue = [];

                  scope.syncAnnotations( version, mod, del ).then( function( result ){
                    scope.sheet.annotationVersion = result.data.version;
                    var mgr = scope.currentSheet.tileView.annotationManager;

                    if( result.data.annotations )
                      mgr.onExternalAnnotationUpdate( result.data.annotations );
                    if( result.data.annotationDeletes )
                    	mgr.onExternalAnnotationDelete( result.data.annotationDeletes );
                  }).catch( function( err ) {
                    console.error( "Annotation sync error", err );
                  }).finally( function() {
                    for( var i=0; i<finallyQueue.length; i++ )
                    {
                      var callback = finallyQueue[i];
                      if( callback )
                        callback();
                    }
                  });
               };

               // Force initial sync to occur at link time
              scope.doAnnotationSync();

            }
        }
    }
]);