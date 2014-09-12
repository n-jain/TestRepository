angular.module("bluvueSheet", []);

angular.module("bluvueSheet").directive("bvSheet", [
    function sheetDirective() {
        'use strict';

        return {
            scope: {
                sheet: "=",
                userId: "=",
                saveAnnotation: "=",
                deleteAnnotation: "=",
                closeSheet: "="
            },
            restrict: "E",
            replace: true,
            transclude: false,
            template: "<div class='bluvue-sheet'><canvas>Canvas is not supported</canvas></div>",
            link: function bvSheetLink(scope, elem) {
                // sheet object
                /* {
                 * id: 'guid',
                 * projectId: 'guid',
                 * slicesUrl: '',
                 * previewUrl: '',
                 * annotations: []
                 * }
                 */

                // annotation object
                /*
                 * {
                 * id: 'guid',
                 * userId: 'guid',
                 * data: 'json string'
                 * type: int
                 * }
                 */

                var bvSheet = null;
                scope.$watch('sheet', function (newValue) {
                    if (newValue != null) {
                         bvSheet = new BluVueSheet.Sheet();
                        bvSheet.loadSheet(scope.sheet, scope, elem);
                    }
                });
                
            }
        }
    }
]);

