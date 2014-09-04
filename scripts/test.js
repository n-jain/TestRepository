angular.module('test', ['bluvueSheet'])
    .controller('testController', ['$scope', '$q',
        function ($scope, $q) {
            'use strict';

            $scope.sheet = {
                slicesUrl: "sheet/slices.zip",
                previewUrl: "sheet/preview.png",
                projectId: "guid",
                sheetId: "guid",
                userId: "guid",
                annotations: [] // hard code annotations here for testing
            };

            $scope.saveAnnotation = function(annotationId, projectId, sheetId, userId, annotationType, json) {
                /*
                 * returns a $q promise
                 * 
                 * usage:
                 * saveAnnotation(vars).then(function() {
                 *  // runs on success
                 * })
                 * .catch(function(error) {
                 *  // runs on error
                 * })
                 * .finally(function() {
                 *  // runs at the end no matter what
                 * });
                 * 
                 */

                var throwSaveError = false;
                var deferred = $q.defer();

                setTimeout(function () {
                    if (throwSaveError) {
                        deferred.reject('Reason the annotation could not save.');
                    } else {
                        deferred.resolve('');
                    }
                    
                }, 1000);

                return deferred.promise();
            }

            $scope.deleteAnnotation = function(annotationId) {
                var throwSaveError = false;
                var deferred = $q.defer();

                setTimeout(function () {
                    if (throwSaveError) {
                        deferred.reject('Reason the annotation could not be deleted.');
                    } else {
                        deferred.resolve('');
                    }

                }, 1000);

                return deferred.promise();
            }
        }
    ]);