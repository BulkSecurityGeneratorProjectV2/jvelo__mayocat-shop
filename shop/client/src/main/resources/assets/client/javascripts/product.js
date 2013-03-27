'use strict'

angular.module('product', ['ngResource'])

    .controller('ProductController', [
        '$scope',
        '$rootScope',
        '$routeParams',
        '$resource',
        '$http',
        '$location',
        'catalogService',
        'addonsService',
        'imageService',
        'configurationService',

        function ($scope, $rootScope, $routeParams, $resource, $http, $location, catalogService, addonsService,
            imageService, configurationService) {

            $scope.slug = $routeParams.product;

            $scope.publishProduct = function () {
                $scope.product.onShelf = true;
                $scope.updateProduct();
            }

            $scope.updateProduct = function () {
                if ($scope.isNew()) {
                    $http.post("/api/1.0/product/", $scope.product)
                        .success(function (data, status, headers, config) {
                            var fragments = headers("location").split('/'),
                                slug = fragments[fragments.length - 1];
                            $location.url("/product/" + slug);
                        })
                        .error(function (data, status, headers, config) {
                            // TODO handle 409 conflict
                        });
                }
                else {
                    $scope.ProductResource.save({ "slug": $scope.slug }, $scope.product);
                    angular.forEach($scope.collections, function (collection) {
                        if (collection.hasProduct && !collection.hadProduct) {
                            $scope.collectionOperation(collection, "addProduct");
                        }
                        if (collection.hadProduct && !collection.hasProduct) {
                            $scope.collectionOperation(collection, "removeProduct");
                        }
                    });
                }
            };

            $scope.editThumbnails = function (image) {
                $rootScope.$broadcast('thumbnails:edit', "product", image);
            }

            $scope.collectionOperation = function (collection, operation) {
                $resource("/api/1.0/collection/:slug/:operation", {"slug": collection.slug, "operation": operation}, {
                    "save": {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                }).save("product=" + $scope.product.slug, function () {
                });
            };

            $scope.ProductResource = $resource("/api/1.0/product/:slug");

            $scope.isNew = function () {
                return $scope.slug == "_new";
            };

            $scope.newProduct = function () {
                return {
                    slug: "",
                    title: "",
                    addons: []
                };
            }

            $scope.reloadImages = function () {
                $scope.product.images = $http.get("/api/1.0/product/" + $scope.slug + "/image").success(function (data) {
                    $scope.product.images = data;
                });
            }

            $scope.selectFeatureImage = function (image) {
                imageService.selectFeatured($scope.product, image);
            }

            $scope.getImageUploadUri = function () {
                return "/api/1.0/product/" + $scope.slug + "/attachment";
            }

            $scope.initializeCollections = function () {
                catalogService.listCollections(function (collections) {
                    $scope.collections = collections;
                    angular.forEach($scope.collections, function (collection) {
                        angular.forEach($scope.product.collections, function (c) {
                            if (collection.href == c.href) {
                                // hasProduct => used as model
                                collection.hasProduct = true
                                // hadProduct => used when saving to see if we need to update anything
                                collection.hadProduct = true
                            }
                            else if (!collection.hasProduct) {
                                collection.hasProduct = false;
                                collection.hadProduct = false;
                            }
                        });
                    });
                });
            }

            $scope.initializeAddons = function () {
                addonsService.initialize("product", $scope.product).then(function (addons) {
                    $scope.addons = addons;
                });
            }

            $scope.initializeModels = function() {
                $scope.models = [];
                configurationService.get("entities", function (entities) {
                    if (typeof entities.product !== 'undefined') {
                        for (var modelId in entities.product.models) {
                            if (entities.product.models.hasOwnProperty(modelId)) {
                                var model = entities.product.models[modelId];
                                $scope.models.push({
                                    id: modelId,
                                    name: model.name
                                });
                            }
                        }
                    }
                });
            }

            // Initialize existing product or new product

            if (!$scope.isNew()) {
                $scope.product = $scope.ProductResource.get({
                    "slug": $scope.slug,
                    "expand": ["collections", "images"] }, function () {
                    // Ensures the collection initialization happens after the AJAX callback
                    $scope.initializeCollections();

                    // Same for addons
                    $scope.initializeAddons();
                    $scope.initializeModels();

                    if ($scope.product.onShelf == null) {
                        // "null" does not seem to be evaluated properly in angular directives
                        // (like ng-show="something != null")
                        // Thus, we convert "null"onShelf to undefined to be able to have that "high impedance" state in
                        // angular directives.
                        $scope.product.onShelf = undefined;
                    }
                });
            }
            else {
                $scope.product = $scope.newProduct();
                $scope.initializeAddons();
                $scope.initializeModels();
            }

        }])
;
