// Setup
angular.module('carApp', [
    'angularCharts'
]);

// Controller
angular.module('carApp').controller('Controller', ['$scope', '$filter', function($scope, $filter) {

    $scope.initialized = false;

    $scope.init = function() {
        $scope.initFilters();
        $scope.updateFilteredData();
        $scope.initChart();
        $scope.initialized = true;
    };

    $scope.initFilters = function() {
        $scope.filters = {
            modelYear: {
                min: 1922,
                max: 1963
            },
            removeLowMPG: true,
            resolution: 20
        };
    };

    $scope.initChart = function() {
        $scope.chart = {
            type: 'bar',
            config: {
                title: '',
                tooltips: true,
                labels: false,
                mouseover: function() {
                },
                mouseout: function() {
                },
                click: function() {
                },
                legend: {
                    display: true,
                    position: 'right'
                },
                innerRadius: 0, // applicable on pieCharts, can be a percentage like '50%'
                lineLegend: 'lineEnd' // can be also 'traditional'
            },
            dataSet: {
                series: ['Cars'],
                data: $scope.filteredData
            }
        };
    };

    $scope.updateFilteredData = function() {
        $scope.filteredData = $scope.getFilteredDataSet();
        $scope.updateMPGStats();
    };

    $scope.updateMPGStats = function() {
        var mpg = $scope.filteredData.map(function(car) {
            return car.MPG;
        });

        // natural sort
        // http://stackoverflow.com/questions/14599321/javascript-natural-sort
        mpg = mpg.sort(function(a, b) {
            return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
        });

        $scope.MPG = {
            min: Math.min.apply(0, mpg),
            max: Math.max.apply(0, mpg),
            sum: mpg.reduce(function(a, b) {
                return a + b;
            }),
            count: mpg.length,
            median: mpg[Math.floor(mpg.length / 2)],
        };
        $scope.MPG.mean = $scope.MPG.sum / $scope.MPG.count;
        $scope.MPG.range = $scope.MPG.max - $scope.MPG.min;

        // std
        var variance = 0;
        for (var val in mpg) {
            variance += Math.pow(mpg[val] - $scope.MPG.mean, 2);
        }
        variance /= $scope.MPG.count;
        $scope.MPG.std = Math.sqrt(variance);
    };


    $scope.getFilteredDataSet = function(minMPG, maxMPG) {
        minMPG = minMPG || 0;
        maxMPG = maxMPG || Infinity;

        var data = global_data;

        // filter MPG
        data = $filter('filter')(data, function(car) {
            var isNotNull = car.MPG !== null;
            var isInRange = car.MPG >= minMPG && car.MPG <= maxMPG;
            var passesLowMPGCheck = true;

            if ($scope.filters.removeLowMPG) {
                passesLowMPGCheck = car.MPG >= 1.0;
            }

            return isNotNull && isInRange && passesLowMPGCheck;
        });

        // filter model year
        data = $filter('filter')(data, function(car) {
            var isNotNull = car.model_year !== null;
            var isWithinModelYear =
                car.model_year !== null &&
                car.model_year >= $scope.filters.modelYear.min &&
                car.model_year <= $scope.filters.modelYear.max;

            return isNotNull && isWithinModelYear;
        });

        return data;
    };

    $scope.getFormattedChartData = function() {
        var sampleSize = $scope.MPG.range / $scope.filters.resolution;

        var data = [];
        for (var i = 0; i < $scope.filters.resolution; i++) {
            var sampleMin = sampleSize * i;
            var sampleMax = sampleSize * i + sampleSize;

            var carsWithinSampleMPG = $scope.getFilteredDataSet(sampleMin, sampleMax);

            var carsInSample = carsWithinSampleMPG.length;

            var column = {
                x: '<' + Math.floor(sampleMax),
                y: [carsInSample],
                tooltip: carsInSample + " cars<br>< " + Math.round(sampleMax * 100) / 100 + 'mpg'
            };

            data.push(column)
        }

        return data;
    };

    $scope.ensureValidFilters = function() {
        if ($scope.filters.modelYear.min > $scope.filters.modelYear.max) {
            $scope.filters.modelYear.max = $scope.filters.modelYear.min;
        }
    };

    $scope.reset = function() {
        $scope.initFilters();
    };

    // Update chart when filters change
    $scope.$watch('filters', function(oldVal, newVal) {
        $scope.ensureValidFilters();
        $scope.updateFilteredData();
        $scope.chart.dataSet.data = $scope.getFormattedChartData();
    }, true);

}]);
