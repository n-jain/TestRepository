angular.module("bluvueSheet", []);

angular.module("bluvueSheet").directive("bvSheet", ['$window', '$location',
    function sheetDirective($window, $location) {
        'use strict';

        return {
            scope: {
                sheet: "=",
                userId: "=",
                isAdmin: "=",
                saveAnnotation: "=",
                deleteAnnotation: "=",
                closeSheet: "=",
                nextSheet: "=",
                previousSheet: "=",
                pinnedSheets: "="
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
                scope.toolMenuButtonTools = [0,0,0,0,0,0,0];
                scope.selectedToolMenu = null;
                scope.textSizes = BluVueSheet.Constants.TextSizes;
                
                var backPressed = false;
                $window.history.pushState({}, "", $location.absUrl());
                $window.onpopstate = function () {
                    scope.$apply(function () {
                        backPressed = true;
                        scope.close();
                    });
                }

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
                }

                scope.selectTool = function(tool) {
                    if (tool === scope.selectedTool && scope.selectedTool != null) {
                        scope.selectedTool = null;
                    } else {
                        scope.selectedTool = tool;
                        if(tool!=null) scope.toolMenuButtonTools[tool.menuId] = tool.menuIndex;
                    }
                    scope.currentSheet.setTool(scope.selectedTool);

                    //update tool menu
                    scope.selectedToolMenu = null;
                }

                scope.toolMenuButtonClicked = function(toolMenuButton) {
                    console.log(toolMenuButton);
                    scope.selectedToolMenu = toolMenuButton;
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
                        console.log(document.getElementById("fullscreen_button"));
                        document.getElementById("fullscreen_button").innerHTML = "Exit Full Screen";
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
                    }
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
                });
                
                scope.$on('$destroy', function () {
                    $window.onpopstate = null;
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
            }
        }
    }
]);

