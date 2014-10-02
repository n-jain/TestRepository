angular.module("bluvueSheet", []);

angular.module("bluvueSheet").directive("bvSheet", ['$window', '$location',
    function sheetDirective($window, $location) {
        'use strict';

        return {
            scope: {
                sheet: "=",
                userId: "=",
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
                    if (tool === scope.selectedTool && scope.selectedTool !== null) {
                        scope.selectedTool = null;
                    } else {
                        scope.selectedTool = tool;
                    }

                    scope.currentSheet.setTool(scope.selectedTool);
                }

                scope.resetZoom = function () {
                    scope.currentSheet.resetZoom();
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

