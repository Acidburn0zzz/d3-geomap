(function() {
  var svg;

  //save off default references
  var d3 = window.d3, topojson = window.topojson;
  
  var defaultOptions = {
    scope: 'world',
    responsive: false,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        borderWidth: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightFillOpacity: 0.85,
        exitDelay: 100
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600
    },
    backgroundConfig: {
      backgroundImage: null
    },
    pointerConfig: {
      pan: true,
      panBounds: true,
      zoom: true,
      zoomIncrement: 0.1
    }
  };

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': '60%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');
    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;
    
    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path {stroke: #FFFFFF; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;


    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }
    this.geoData = geoData;

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    return geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        var fillColor;

        if ( colorCodeData[d.id] ) {
          fillColor = fillData[ colorCodeData[d.id].fillKey ];
        }

        return fillColor || fillData.defaultFill;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);

          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', options.highlightFillColor)
              .style('stroke', options.highlightBorderColor)
              .style('stroke-width', options.highlightBorderWidth)
              .style('fill-opacity', options.highlightFillOpacity);
            if(!$this.attr('data-previousAttributes'))
              $this.attr('data-previousAttributes', JSON.stringify(previousAttributes));

            //as per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident))/.test ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
            $this.attr('data-previousAttributes',null);
          }
          $this.on('mousemove', null);
          d3.select(self.options.element).selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }
    
    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  //plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path); 
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          if ( datum.options && datum.options.strokeColor) {
            return datum.options.strokeColor;
          }
          return  options.strokeColor
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
          if ( datum.options && datum.options.strokeWidth) {
            return datum.options.strokeWidth;
          }
          return options.strokeWidth;
        })
        .attr('d', function(datum) {
            var originXY = self.latLngToXY(datum.origin.latitude, datum.origin.longitude);
            var destXY = self.latLngToXY(datum.destination.latitude, datum.destination.longitude);
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * options.arcSharpness)) + "," + (midXY[1] - (75 * options.arcSharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .transition()
          .delay(100)
          .style('fill', function() {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + options.animationSpeed + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1)
        }

        layer.append("text")
          .attr("x", x)
          .attr("y", y)
          .style("font-size", (options.fontSize || 10) + 'px')
          .style("font-family", options.fontFamily || "Verdana")
          .style("fill", options.labelColor || "#000")
          .text( d.id );
        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, JSON.stringify );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
          }
          if ( latLng ) return latLng[1];;
        })
        .attr('r', 0) //for animation purposes
        .attr('data-info', function(d) {
          return JSON.stringify(d);
        })
        .style('stroke', function ( datum ) {
          return typeof datum.borderColor !== 'undefined' ? datum.borderColor : options.borderColor;
        })
        .style('stroke-width', function ( datum ) {
          return typeof datum.borderWidth !== 'undefined' ? datum.borderWidth : options.borderWidth;
        })
        .style('fill-opacity', function ( datum ) {
          return typeof datum.fillOpacity !== 'undefined' ? datum.fillOpacity : options.fillOpacity;
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ datum.fillKey ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', options.highlightFillColor)
              .style('stroke', options.highlightBorderColor)
              .style('stroke-width', options.highlightBorderWidth)
              .style('fill-opacity', options.highlightFillOpacity)
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition().duration(400)
          .attr('r', function ( datum ) {
            return datum.radius;
          });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }

  }

function handlePointer (layer, data, options) {

    var self = this,
     svg = this.svg,
     position = null;

    var cleanExit = true;

    if(options.pan){
      var oldCursor;
      function mousedown(){
        if(d3.event.which == 1){
          position = d3.mouse(this);
          var transform = getSVGTransform(self.svg);
          if(cleanExit) oldCursor = svg.node().style.cursor;
          cleanExit = false;
          svg.style('cursor','move');

          function pointermove(){
            var newPosition = d3.mouse(this);
            //scale to keep movements proportional to mouse movements
            var x = (newPosition[0] - (position[0]||0)) / transform.scale;
            var y = (newPosition[1] - (position[1]||0)) / transform.scale;
            setSVGTranslation(svg, transform.x + x, transform.y + y, options.panBounds);
          }
          svg.on('mousemove', pointermove);
          svg.on('touchmove', pointermove);
          svg.on('pointermove', pointermove);

          //disable built in image dragging for firefox
          svg.on('dragstart', function(e){ d3.event.preventDefault(); })

          function pointerup() {
            svg.style('cursor',oldCursor);
            oldCursor = null;
            cleanExit = true;
            svg.on('mousemove', null);
            svg.on('touchmove', null);
            svg.on('pointermove', null);
          }
          svg.on('mouseup', pointerup);
          svg.on('touchend', pointerup);
          svg.on('pointerup', pointerup);
        }
      }
      svg.on('mousedown', mousedown);
      svg.on('touchstart', mousedown);
      svg.on('pointerdown', mousedown);

      function pointerout(){
        svg.style('cursor',oldCursor);
        oldCursor = null;
        cleanExit = true;
        svg.on('mousemove', null);
        svg.on('touchmove', null);
        svg.on('pointermove', null);
      }
      svg.on('mouseout', pointerout);
      svg.on('pointerout', pointerout);
    }

    if(options.zoom){
      function mousewheel( datum ) {
        var change = (d3.event.type == 'mousewheel') ? d3.event.wheelDelta : -d3.event.detail;
        if (change > 0){
          setSVGScale(self.svg, 1 + options.zoomIncrement);
        }else{
          setSVGScale(self.svg, 1 - options.zoomIncrement);
        }
        d3.event.stopPropagation();
      };
      svg.on('mousewheel', mousewheel);
      svg.on('DOMMouseScroll', mousewheel);
    }
  }

  function getSVGTransform(svg){
    var b = svg.select('g.datamaps-subunits').node().transform.baseVal;
    var count = b.numberOfItems;
    var sx = 1, x = 0, y = 0;
    for(var i=0;i<count;i++){
      var t = b.getItem(i);
      if (t.type == SVGTransform.SVG_TRANSFORM_SCALE){
        sx = t.matrix.a;
      }else if(t.type == SVGTransform.SVG_TRANSFORM_TRANSLATE){
        x = t.matrix.e;
        y = t.matrix.f;
      }
    }
    return { scale: sx, x: x, y: y};
  }
  function setSVGScale(svg, scale){
    var currentScale = getSVGTransform(svg);
    //need to re-center
    var container = svg.node().parentElement;
    var c = 0.5 * (scale - 1) / scale / currentScale.scale;
    var x = currentScale.x - container.clientWidth * c;
    var y = currentScale.y - container.clientHeight * c;

    svg.selectAll('g').each(function(){
      var g = this;
      var b = g.transform.baseVal;
      var count = b.numberOfItems;
      var t = null, s = null;
      for(var i=0;i<count;i++){
        var bi = b.getItem(i);
        if (bi.type == SVGTransform.SVG_TRANSFORM_SCALE) s = bi;
        if (bi.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) t = bi;
      }
      if(!s){
        s = g.parentElement.createSVGTransform();
        b.appendItem(s);
      }
      s.setScale(currentScale.scale * scale, currentScale.scale * scale);
      if(!t){
        t = g.parentElement.createSVGTransform();
        b.appendItem(t);
      }
      t.setTranslate(x, y);
    });
  }
  function setSVGTranslation(svg, x, y, bounded){
    if(Math.abs(x)==0 && Math.abs(y)==0) return;

    var current = getSVGTransform(svg);

    //limit to edges
    if(bounded){
      var container = svg.node().parentElement;
      var w = container.clientWidth;
      var h = container.clientHeight;
      var size = svg.node().getBBox();
      var diffX = current.x - x;
      var diffY = current.y - y;

      if(size.x >= diffX && diffX <= 0) x = current.x;
      if(size.y >= diffY && diffY <= 0) y = current.y;
      if(w - size.x - size.width + diffX >= 0 && diffX >= 0) x = current.x;
      if(h - size.y - size.height + diffY >= 0 && diffY >= 0) y = current.y;
    }

    if(x!=current.x || y!=current.y){
      svg.selectAll('g').each(function() {
        var g = this;
        var b = g.transform.baseVal;
        var count = b.numberOfItems;
        var t = null, s = null;
        for(var i=0;i<count;i++){
          var bi = b.getItem(i);
          if (bi.type == SVGTransform.SVG_TRANSFORM_SCALE) s = bi;
          if (bi.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) t = bi;
        }
        if(!s){
          s = g.parentElement.createSVGTransform();
          b.appendItem(s);
          s.setScale(1,1);
        }
        if(!t){
          t = g.parentElement.createSVGTransform();
          b.appendItem(t);
        }
        t.setTranslate(x, y);
      });
    }
  }

  /** plugin to render background image */
  function handleBackground(layer, data, options) {

    var self = this,
     svg = this.svg;

    var image;
    var layer = svg.select('g.datamaps-background');
    if(layer.empty()){
      layer = svg.insert('g', ':first-child');
      layer.attr('class','datamaps-background')
      image = layer.insert('image', ':first-child');
      image.attr('preserveAspectRatio','xMinYMin');
    }else{
      image = layer.select('image');
    }
    var subunits = self.svg.select('g.datamaps-subunits');

    function renderBackground(){
      var size = subunits.node().getBBox();

      var aspect = 0.5;
      var diff = size.height - (size.width * aspect);

      image.attr('xlink:href', options.backgroundImage)
        .attr('y', (size.y + diff) + 'px')
        .attr('x', size.x + 'px')
        .attr('height', (size.width * aspect) + 'px')
        .attr('width', size.width + 'px');
    }
    renderBackground();

    //disable built in image dragging for firefox
    image.on('dragstart', function(e){ d3.event.preventDefault(); })

    svg.node().addEventListener("transform",function(){
      //read translation and apply to image
      var g = subunits.node();
      var transform = g.getAttribute('transform');
      layer.attr('transform',transform);
    },false);
    svg.node().addEventListener("topologychange", renderBackground);
  }

  //stolen from underscore.js
  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }

    //set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);
    this.options.backgroundConfig = defaults(options.backgroundConfig, defaultOptions.backgroundConfig);
    this.options.pointerConfig = defaults(options.pointerConfig, defaultOptions.pointerConfig);

    //add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    /* Add core plugins to this instance */
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);
    this.addPlugin('pointer', handlePointer);

    //append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var prefix = '-webkit-transform' in document.body.style ? '-webkit-' : '-moz-transform' in document.body.style ? '-moz-' : '-ms-transform' in document.body.style ? '-ms-' : '',
          newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').style(prefix + 'transform', 'scale(' + (newsize / oldsize) + ')');
    }
  }

  // actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    //save off in a closure
    var self = this;
    var options = self.options;

    //set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(self, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    //if custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // if fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          //allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            //in the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              } 
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        self.subunits = drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        //fire off finished callback
        self.addPlugin('background', handleBackground);
        self.options.done(self);
      }
  };
  // redraw current topology using new projection & options
  Datamap.prototype.redraw = function() {
    var self = this;
    var options = self.options;
    if(self.subunits){
      var pathAndProjection = options.setProjection.apply(self, [options.element, options] );
      self.path = pathAndProjection.path;
      self.projection = pathAndProjection.projection;

      var geo = self.subunits.data( self.geoData );

      //helper function to raise event after all transitions complete
      function endall(transition, callback) {
        var n = 0;
        transition
          .each(function() { ++n; })
          .each("end", function() { if (!--n) callback.apply(this, arguments); });
      }

      geo.transition().duration(0).attr('d', self.path).call(endall, function(){
        var event = document.createEvent("Event");
        event.initEvent("topologychange", true, true);
        self.svg.node().dispatchEvent(event);
      });
    }
  }
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.usaTopo = '__USA__';

  /**************************************
                Utilities
  ***************************************/

  //convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  //add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data) {
    var svg = this.svg;
    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        //if it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
          var $this = this.svg.select('.' + subunit);
          if($this.node()){
            var previousAttributes = JSON.parse($this.node().getAttribute('data-previousAttributes'));
            if(!previousAttributes){
              var previousAttributes = {
                'fill':  $this.style('fill'),
                'stroke': $this.style('stroke'),
                'stroke-width': $this.style('stroke-width'),
                'fill-opacity': $this.style('fill-opacity')
              };
            }
            previousAttributes.fill = color;
            this.svg.select('.' + subunit).attr('data-previousAttributes',JSON.stringify(previousAttributes));
          }
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(this);
      //replaced code that renders a DIV with a call to template
      var transform = getSVGTransform(self.svg);
      var elementData = element.data()[0];
      var id = elementData.id;
      var name = (elementData.properties ? elementData.properties.name : elementData.name);
      var data = JSON.parse(element.attr('data-info'));
      var top = ((position[1] + transform.y) * transform.scale + 30);
      var left = ((position[0] + transform.x) * transform.scale);
      options.popupTemplate({ id:id, name:name, data:data }, top, left);
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, defaultOptions[name + 'Config']);

        //add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // expose library
  if ( typeof define === "function" && define.amd ) {
    define( "datamaps", function(require) { d3 = require('d3'); topojson = require('topojson'); return Datamap; } );
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();
