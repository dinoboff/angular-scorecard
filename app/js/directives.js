(function () {
  'use strict';

  angular.module('myApp.directives', ['myApp.config', 'myApp.filters', 'templates-main']).

    /**
     * Directive to set the a `svga element `viewBox` attribute
     * from values from the scope.
     *
     * With:
     *  
     *  <svg ng-attr-viewBox="0 0 {{100}} {{100}}"/>
     *
     * Angular would produce the correct attribute but it would have no effect. 
     * This directive edit the viewBox.baseVal property directly.
     *
     * Usage:
     *
     *  <svg sc-view-box="layout"/>
     *
     * where `$scope.layout == {width: 100, height: 100, margin:{top:10, left:20}}`
     * 
     */
    directive('scViewBox', function(SVG){
      return {
        scope: {
          'viewBox': '=?scViewBox'
        },
        link: function(scope, element) {
          
          element.get(0).setAttribute('preserveAspectRatio', 'xMidYMid meet');

          scope.$watch('viewBox', function(){
            var vb = scope.viewBox || SVG();

            element.get(0).setAttribute(
              'viewBox',
              [-vb.margin.left, -vb.margin.top, vb.width, vb.height].join(' ')
            );

          });
        }
      };
    }).

    /**
     * Build a axis on the right of a chart.
     *
     * Draw the axis, the axis label, the ticks and the thicks labels.
     *
     * ex:
     * 
     *  <g sc-r-axis="yScale" sc-layout="svg" title="chartName"></g>
     *
     * Where yScale would be a quantity d3 quantitative scale.
     * 
     */
    directive('scRAxis', function($window) {
      return {
        template: '<line class="ruler" ng-repeat="tick in scale.ticks(6)" x1="0" ng-attr-x2="{{layout.inWidth}}" y1="0" y2="0" ng-attr-transform="translate(0,{{scale(tick)}})"/>\n'+
          '<g class="tick" ng-repeat="tick in scale.ticks(6)" ng-attr-transform="translate(0,{{scale(tick)}})">\n'+
          ' <line x1="-5" x2="0" y1="0" y2="0"/>\n'+
          ' <text dx="-6">{{tick}}</text>\n'+
          '</g>\n'+
          '<g class="title" ng-attr-transform="translate({{-layout.margin.left}},{{layout.inHeight/2}})">\n'+
          ' <text transform="rotate(-90)" ng-attr-textLength="{{layout.inHeight}}" lengthAdjust="spacingAndGlyphs">{{title()}}</text>\n'+
          '</g>'+
          '<line class="axis" x1="0" x2="0" y1="-5" ng-attr-y2={{layout.inHeight+5}}/>\n',
        scope: {
          scale: '=scRAxis',
          layout: '=scLayout',
          title: '&?'
        },
        link: function(_, el) {
          var svgEl = $window.d3.select(el.get(0));
          svgEl.classed('axis', true);
          svgEl.classed('y-axis', true);
        }
      };
    }).

    /**
     * Build the bottom axis
     *
     * ex:
     * 
     *  <g sc-b-axis="xScale" sc-layout="svg"></g>
     *
     * Where xScale would be a quantity d3 ordinal scale.
     * 
     */
    directive('scBAxis', function($window) {
      return {
        template: ' <g class="tick" ng-repeat="name in scale.domain()" transform="translate({{scale(name)}}, {{layout.inHeight}})">'+
          '  <line x1="0" x2="0" y1="0" y2="5"/>\n'+
          '  <text dy=".5em">{{name}}</text>\n'+
          ' </g>'+
          '<line class="axis" ng-attr-transform="translate(0, {{layout.inHeight}})" x1="-5" y1="0" y2="0" ng-attr-x2={{layout.inWidth}}/>\n',
        scope: {
          scale: '=scBAxis',
          layout: '=scLayout'
        },
        link: function(s, el){
          var svgEl = $window.d3.select(el.get(0));
          svgEl.classed('axis', true);
          svgEl.classed('x-axis', true);
        }
      };
    }).

    directive('scBNestedAxis', function($window){
      return {
        template: '<g class="axis-0" ng-repeat="name in scale.domain()" ng-attr-transform="translate({{scale(name)}},{{layout.inHeight}})">\n'+
          '  <g class="tick" ng-attr-transform="translate({{scale.rangeBand()/2}},0)">\n'+
          '    <line x1="0" x2="0" y1="0" y2="5"/>\n'+
          '    <text x="0" y="0" dy=".5em">{{name}}</text>\n'+
          '  </g>\n'+
          '  <line class="sep" x1="0" y1="0" x2="0" y2="1.8em"/>\n'+
          '</g>'+
          '<g class="axis-1" ng-repeat="leaf in tree" ng-attr-transform="translate({{treeScale($index)}},{{layout.inHeight}})">'+
          '  <line class="sep" x1="0" y1="1.8em" x2="0" y2="3.3em"/>\n'+
          '  <text class="tick" ng-attr-x="{{treeScale.rangeBand($index)/2}}" y="0" dy="1.8em">{{leaf.root}}</text>\n'+
          '</g>'+
          '<line class="sep" x1="0" y1="0" x2="0" y2="3.3em" ng-attr-transform="translate({{layout.inWidth}},{{layout.inHeight}})"/>\n'+
          '<line class="axis" ng-attr-transform="translate(0, {{layout.inHeight}})" x1="-5" y1="0" y2="0" ng-attr-x2={{layout.inWidth}}/>\n',
        scope: {
          scale: '=scBNestedAxis',
          tree: '=scTree',
          layout: '=scLayout'
        },
        link: function(s, el){
          var svgEl = $window.d3.select(el.get(0));
          svgEl.classed('axis', true);
          svgEl.classed('x-axis', true);
          svgEl.classed('nested-axis', true);

          s.treeScale = function(index) {
            var c = 0;
            
            if (index === 0) {
              return 0;
            }

            for (var i = 1; i <= index; i++) {
              c += s.tree[index - i].children.length;
            }
            
            return s.scale.rangeBand() * c;
          };

          s.treeScale.rangeBand = function(index) {
            return s.scale.rangeBand() * s.tree[index].children.length;
          };
        }
      };
    }).
    
    /**
     * scBoxPlot directive
     *
     * (not strictly speaking a boxplot, the box is missing)
     *
     * usage:
     *
     *  <sc-box-plot sc-data="data"/>
     */
    directive('scBoxPlot', function(TPL_PATH, SVG, $window) {
      return {
        restrict: 'E',
        templateUrl: TPL_PATH + '/boxplot.html',
        scope: {
          data: '=scData',
          width: '&scWidth',
          height: '&scHeight'
        },
        link: function(scope) {
          var onDataChange;

          scope.layout = SVG(
            {top: 10, right: 30, bottom: 30, left: 50},
            scope.width(),
            scope.height()
          );

          onDataChange = function() {
            var d3 = $window.d3,
              xDomain = [],
              yDomain = [];

            if (!scope.data || scope.data.type !== 'boxPlot') {
              return;
            }

            // Calculate min, max, median of ranges and set the domains
            for (var i = 0; i < scope.data.series.length; i++) {
              scope.data.series[i].data.sort(d3.ascending);
              scope.data.series[i].min = scope.data.series[i].data[0];
              scope.data.series[i].max = scope.data.series[i].data.slice(-1)[0];
              scope.data.series[i].median = d3.median(scope.data.series[i].data);
              
              yDomain.push(scope.data.series[i].min);
              yDomain.push(scope.data.series[i].max);
              xDomain.push(scope.data.series[i].name);
            }

            yDomain.sort(d3.ascending);
            yDomain = yDomain.slice(0,1).concat(yDomain.slice(-1));

            // Set scales
            scope.xScale = d3.scale.ordinal().
              domain(xDomain).
              rangePoints([0, scope.layout.inWidth], 1);

            scope.yScale = d3.scale.linear().
              domain(yDomain).
              range([scope.layout.inHeight, 0]).
              nice();
          };

          scope.$watch('data', onDataChange);
        }
      };
    }).

    /**
     * scGroupedBoxPlot
     *
     * Like box plot except the data series are part of groups. The x axis
     * has two level. One level names the serie; the other one names the group
     * of the serie.
     *
     * usage:
     *
     *  <sc-grouped-box-plot sc-data="data"/>
     */
    directive('scGroupedBoxPlot', function(TPL_PATH, SVG, $window) {
      return {
        restrict: 'E',
        templateUrl: TPL_PATH + '/groupedboxplot.html',
        scope: {
          data: '=scData',
          width: '&scWidth',
          height: '&scHeight'
        },
        link: function(scope) {
          var d3 = $window.d3,
            onDataChange,
            leaf,
            root,
            yDomain = [];

          scope.layout=SVG(
            {top: 10, right: 30, bottom: 70, left: 50},
            scope.width(),
            scope.height()
          );

          onDataChange = function() {
            
            if (!scope.data || scope.data.type !== 'groupedBoxPlot') {
              return;
            }

            scope.xScale = d3.scale.ordinal();
            scope.yScale = d3.scale.linear();
            scope.legendScale = d3.scale.ordinal().
              domain(['median','mean']).
              rangeBands([0, scope.layout.inWidth], 0.5, 0.5);
            scope.xTree = [];
            
            // Calculate min, max, median of ranges and set the domains
            for (var i = 0; i < scope.data.series.length; i++) {
              root = scope.data.series[i];
              leaf = {'root': root.name, 'children': []};
              for (var j = 0; j < root.series.length; j++) {
                root.series[j].data.sort(d3.ascending);
                root.series[j].min = root.series[j].data[0];
                root.series[j].max = root.series[j].data.slice(-1)[0];
                root.series[j].median = d3.median(root.series[j].data);
                root.series[j].mean = d3.mean(root.series[j].data);

                yDomain.push(root.series[j].min);
                yDomain.push(root.series[j].max);
                scope.xScale(root.series[j].name);
                leaf.children.push(root.series[j].name);
              }
              scope.xTree.push(leaf);
            }

            yDomain.sort(d3.ascending);
            yDomain = yDomain.slice(0,1).concat(yDomain.slice(-1));

            // Set scales
            scope.xScale = scope.xScale.rangeBands([0, scope.layout.inWidth], 0, 0);
            scope.yScale = scope.yScale.domain(yDomain).
              range([scope.layout.inHeight, 0]).
              nice();
          };

          scope.$watch('data', onDataChange);
        }
      };
    }).

    /**
     * Draw a bar chart
     * 
     */
    directive('scBar', function(TPL_PATH, SVG_MARGIN, SVG, $window){
      return {
        restrict: 'E',
        templateUrl: TPL_PATH + '/bar.html',
        scope: {
          data: '=scData',
          width: '&scWidth',
          height: '&scHeight'
        },
        link: function(scope) {
          var d3 = $window.d3,
            onDataChange;

          scope.layout=SVG(SVG_MARGIN, scope.width(), scope.height());

          onDataChange = function(){
            var yDomain = [];

            if (!scope.data || scope.data.type !== 'bar') {
              return;
            }

            scope.xScale = d3.scale.ordinal();
            scope.yScale = d3.scale.linear();
            scope.yAxisScale = d3.scale.linear();

            for (var i = 0; i < scope.data.series.length; i++) {
              scope.xScale(scope.data.series[i].name);
              yDomain.push(scope.data.series[i].data);
            }

            yDomain.sort(d3.ascending);
            // TODO: Fix  hardcoded Domain
            yDomain = [0].concat(yDomain.slice(-1));
            yDomain[1] *= 1.1;
            scope.yScale = scope.yScale.domain(yDomain);
            scope.yAxisScale = scope.yAxisScale.domain(yDomain);

            // Set scales
            scope.xScale = scope.xScale.rangePoints([0, scope.layout.inWidth], 1);
            scope.yScale = scope.yScale.range([0, scope.layout.inHeight]).nice();
            scope.yAxisScale = scope.yAxisScale.
              range([scope.layout.inHeight, 0]).
              nice();
          };

          scope.$watch('data', onDataChange);
        }
      };
    }).

    /**
     * Draw a pie chart
     * 
     */
    directive('scPie', function(TPL_PATH, SVG_MARGIN, SVG, $window){
      return {
        restrict: 'E',
        templateUrl: TPL_PATH + '/pie.html',
        scope: {
          data: '=scData',
          width: '&scWidth',
          height: '&scHeight'
        },
        link: function(scope) {
          var d3 = $window.d3,
            onDataChange,
            onSeriesLenghtChange;

          onSeriesLenghtChange = function(){
            scope.layout=SVG(
              {
                top: 10,
                right: 10,
                bottom: 30 + (20 * scope.data.series.length),
                left: 10
              },
              scope.width(),
              scope.height()
            );
          };

          onDataChange = function(){
            var percentage = d3.scale.linear().
                domain([0, d3.sum(scope.data.series, function(d){ return d.data; })]).
                range([0,1]),
              formatter = d3.format(".01%");

            // Make sure the pie fits into the inner svg document,
            // and sure the legend aligns with the pie
            if (scope.layout.inHeight > scope.layout.inWidth) {
              scope.pieRadius = scope.layout.inWidth/2;
              scope.legendXAnchor = 0;
            } else {
              scope.pieRadius = scope.layout.inHeight/2;
              scope.legendXAnchor = (scope.layout.inWidth - scope.pieRadius*2)/2;
            }

            scope.pieData = d3.layout.pie().
              value(function(d){return d.data;})(scope.data.series);

            scope.colors = d3.scale.category20();

            scope.percentage = function(d){
              var p = percentage(d);
              return formatter(p);
            };

            scope.labelAnchor = function(s) {
              if (((s.startAngle + s.endAngle) / 2) < Math.PI) {
                return "start";
              } else {
                return "end";
              }
            };

            scope.arc = d3.svg.arc()
              .startAngle(function(d){ return d.startAngle; })
              .endAngle(function(d){ return d.endAngle; })
              .innerRadius(0)
              .outerRadius(scope.pieRadius);
          };

          // TODO: the order matters... might break.
          scope.$watch('data.series.lenght', onSeriesLenghtChange);
          scope.$watch('data', onDataChange);
        }
      };
    }).

    /**
     * Draw a chart
     *
     * usage:
     *
     *  <my-chart chart-data="data" [svg-width="100"] [svg-height="100"]/>
     *  
     */
    directive('myChart', function(TPL_PATH, SVG, SVG_MARGIN, SVG_HEIGHT, SVG_WIDTH, $window) {
      var templates = {
        'combined': TPL_PATH + '/combined.html',
        'groupedBar': TPL_PATH + '/groupedbar.html',
        'default': TPL_PATH + '/not-supported.html'
      }, factories = {

        'groupedBar': function(chart, width, height) {
          var d3 = $window.d3,
            xNestedDomain = [],
            xNestedDomainPseudoSet = {},
            xDomain = [],
            yDomain = [],
            entries,
            data = chart.series;
          
          chart.svg=SVG({
            top: 30,
            right: 30,
            bottom: 60,
            left: 70
          }, width, height);

          // Calculate min, max, median of ranges and set the domains
          for (var i = 0; i < data.length; i++) {
            xDomain.push(data[i].name);
            entries = d3.entries(data[i].data);
            for (var j = 0; j < entries.length; j++) {
              yDomain.push(entries[j].value);
              xNestedDomainPseudoSet[entries[j].key] = 1;
            }
          }
          yDomain.sort(d3.ascending);
          // TODO: Fix  hardcoded Domain low
          yDomain = [0].concat(yDomain.slice(-1));
          xNestedDomain = d3.keys(xNestedDomainPseudoSet);

          // Set scales
          chart.xScale = d3.scale.ordinal().
            domain(xDomain).
            rangeBands([0, chart.svg.inWidth], 0, 0);
          chart.xAxisScale = d3.scale.ordinal().
            domain(xDomain).
            rangePoints([0, chart.svg.inWidth], 1);
          chart.xNestedScale = d3.scale.ordinal().
            domain(xNestedDomain).
            rangeBands([0, chart.svg.inWidth/data.length], 0, 0.5);
          chart.colors = d3.scale.category20();
          chart.legendScale = d3.scale.ordinal().
            domain(xNestedDomain).
            rangeBands([0, chart.svg.inWidth], 0.5, 0.5);
          chart.yScale = d3.scale.linear().
            domain(yDomain).
            range([0, chart.svg.inHeight]).
            nice();
          chart.yScaleReversed = d3.scale.linear().
            domain(yDomain).
            range([chart.svg.inHeight, 0]).
            nice();
        },

        'combined': function(chart, width, height) {
          chart.svg=SVG(SVG_MARGIN, width, height);
        }

      };

      return {
        restrict: 'E',
        scope: {
          'chartData': '=',
          'svgWidth': '&',
          'svgHeight': '&'
        },
        template: '<div class="graph" ng-include="template"></div>',
        link: function(scope){

          scope.$watch('chartData', function(){
            var gType,
              height = scope.svgHeight() || SVG_HEIGHT,
              width = scope.svgWidth() || SVG_WIDTH;

            if (!scope.chartData) {
              return;
            }

            gType = scope.chartData.type;
            scope.template = templates[gType] ? templates[gType] : templates['default'];
            
            if (factories[gType]) {
              factories[gType](scope.chartData, width, height);
            }

          });
        }
      };
    });

})();
