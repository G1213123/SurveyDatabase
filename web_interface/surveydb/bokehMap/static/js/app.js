function create_map(map, options){

	var featureList, boroughSearch = [], theaterSearch = [], museumSearch = [];

	$(window).resize(function() {
	  sizeLayerControl();
	});

	$(document).on("click", ".feature-row", function(e) {
	  $(document).off("mouseout", ".feature-row", clearHighlight);
	  sidebarClick(parseInt($(this).attr("id"), 10));
	});

	if ( !("ontouchstart" in window) ) {
	  $(document).on("mouseover", ".feature-row", function(e) {
		highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
	  });
	}

	$(document).on("mouseout", ".feature-row", clearHighlight);

	$("#about-btn").click(function() {
	  $("#aboutModal").modal("show");
	  $(".navbar-collapse.in").collapse("hide");
	  return false;
	});

	$("#full-extent-btn").click(function() {
	  map.fitBounds(surveys.getBounds());
	  $(".navbar-collapse.in").collapse("hide");
	  return false;
	});

	$("#legend-btn").click(function() {
	  $("#legendModal").modal("show");
	  $(".navbar-collapse.in").collapse("hide");
	  return false;
	});


	$("#list-btn").click(function() {
	  animateSidebar();
	  return false;
	});

	$("#nav-btn").click(function() {
	  $(".navbar-collapse").collapse("toggle");
	  return false;
	});

	$("#sidebar-toggle-btn").click(function() {
	  animateSidebar();
	  return false;
	});

	$("#sidebar-hide-btn").click(function() {
	  animateSidebar();
	  return false;
	});

	function animateSidebar() {
	  $("#sidebar").animate({
		width: "toggle"
	  }, 350, function() {
		map.invalidateSize();
	  });
	}

	function sizeLayerControl() {
	  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
	}

	function clearHighlight() {
	  highlight.clearLayers();
	}

	function sidebarClick(id) {
	  var layer = surveys.getLayer(id);
	  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
	  layer.fire("click");
	  /* Hide sidebar and go to the map on small screens */
	  if (document.body.clientWidth <= 767) {
		$("#sidebar").hide();
		map.invalidateSize();
	  }
	}

	function syncSidebar() {
	  /* Empty sidebar features */
	  $("#feature-list tbody").empty();
	  /* Loop through theaters layer and add only features which are in the map bounds */
	  surveys.eachLayer(function (layer) {
		if (map.hasLayer(surveysLayer)) {
		  if (map.getBounds().contains(layer.getLatLng())) {
			$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"></td><td class="feature-name">' + layer.feature.properties.SurveyID[0] + '\n' + layer.feature.properties.SurveyID[2] + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
		  }
		}
	  });
	  /* Update list.js featureList */
	  featureList = new List("features", {
		valueNames: ["feature-name"]
	  });
	  featureList.sort("feature-name", {
		order: "asc"
	  });
	}

	/* Basemap Layers */
	var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
	  maxZoom: 19,
	  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
	});
	cartoLight.addTo(map);


	/* Overlay Layers */
	var highlight = L.geoJson(null);
	var highlightStyle = {
	  stroke: false,
	  fillColor: "#00FFFF",
	  fillOpacity: 0.7,
	  radius: 10
	};

	//generate random color base on the project number
	//reference: https://gist.github.com/mjackson/5311256
	var head_column = ["SurveyID", "Job Number", "Project Name", "Survey", "Issue Date"]

	var rangeMax = 2020
	var rangeMin = 2015
	var filter_str = ''

	function hslToRgb(h, s, l) {
		  var r, g, b;

		  if (s == 0) {
			r = g = b = l; // achromatic
		  } else {
			function hue2rgb(p, q, t) {
			  if (t < 0) t += 1;
			  if (t > 1) t -= 1;
			  if (t < 1/6) return p + (q - p) * 6 * t;
			  if (t < 1/2) return q;
			  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			  return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;

			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		  }

		  return [ r * 255, g * 255, b * 255 ];
		}

	var rgbToHex = function (rgb) {
		  var hex = Math.floor(Number(rgb)).toString(16);
		  if (hex.length < 2) {
			   hex = "0" + hex;
		  }
		  return hex;
		};

	var fullColorHex = function(r,g,b) {
	  var red = rgbToHex(r);
		  var green = rgbToHex(g);
		  var blue = rgbToHex(b);
		  return red+green+blue;
		};

	function getColor(d) {
			h = (d % 256) / 256
			var color = hslToRgb(h, 1, 0.5);
			var s = '#'
			return '#' + fullColorHex.apply(null, color);
		}


	//populating the map with json data with circle markers and clustered markers

		function protecland_marker(feature, latlng) {
			return L.circleMarker(latlng, {
				radius: 8.0,
				fillColor: getColor(parseInt(feature.properties.SurveyID[0])*30),
				color: '#000000',
				weight: 1,
				opacity: 1.0,
				fillOpacity: 0.8,
				popupAnchor:  [-4, 0]
			})
		}


	//handle feature clicked events
	function popUp(f,l){
		var out = [];
		if (f.properties){
			for(key in f.properties.SurveyID){
				var descipt = (key!="3")? f.properties.SurveyID[key] : f.properties.Survey;
				out.push("<b>" + head_column[key]+": </b>"+ descipt);
			}
			l.bindPopup(out.join("<br />"));
		}
	}

	// layer for holding the data
	map_survey = JSON.parse(map_survey_str)
	
	function populate_map(rangeMin,rangeMax,filter_str){
		return (L.geoJson(map_survey,{
			coordsToLatLng: function (coords) {
				return new L.LatLng(coords[0], coords[1], coords[2]);
			},
			filter: function(feature, layer) {
				if (feature.properties){
					 return ((feature.properties.SurveyID[4].substr(0,4) <= rangeMax) &&
						(feature.properties.SurveyID[4].substr(0,4) >= rangeMin) &&
						(feature.properties.SurveyID[0].includes(filter_str) || feature.properties.SurveyID[1].includes(filter_str)))
					}
				},
			onEachFeature:popUp,
			pointToLayer:protecland_marker,
			
		}))
	}
	// layer for display on the map
	
	surveys = populate_map(2015,new Date().getFullYear())
	surveysLayer = L.geoJson(null).addTo(map);
	$("#loading").hide();
	syncSidebar();
	


	/* Single marker cluster layer to hold all clusters */
	var markerClusters = new L.MarkerClusterGroup({
	  spiderfyOnMaxZoom: true,
	  showCoverageOnHover: false,
	  zoomToBoundsOnClick: true,
	  disableClusteringAtZoom: 8
	}).addTo(map);


	/* Layer control listeners that allow for a single markerClusters layer */
	map.on("overlayadd", function(e) {
	  if (e.layer === surveysLayer) {
		markerClusters.addLayer(surveys);
		syncSidebar();
		
	  }

	});

	map.on("overlayremove", function(e) {
	  if (e.layer === surveysLayer) {
		markerClusters.removeLayer(surveys);
		syncSidebar();
	  }
	});

	/* Filter sidebar feature list to only show features in current map bounds */
	map.on("moveend", function (e) {
	  syncSidebar();
	});

	/* Clear feature highlight when map is clicked */
	map.on("click", function(e) {
	  highlight.clearLayers();
	});

	/* Attribution control */
	function updateAttribution(e) {
	  $.each(map._layers, function(index, layer) {
		if (layer.getAttribution) {
		  $("#attribution").html((layer.getAttribution()));
		}
	  });
	}
	map.on("layeradd", updateAttribution);
	map.on("layerremove", updateAttribution);

	var attributionControl = L.control({
	  position: "bottomright"
	});
	attributionControl.onAdd = function (map) {
	  var div = L.DomUtil.create("div", "leaflet-control-attribution");
	  div.innerHTML = "</span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
	  return div;
	};
	map.addControl(attributionControl);

	var zoomControl = L.control.zoom({
	  position: "bottomright"
	}).addTo(map);


	/* Larger screens get expanded layer control and visible sidebar */
	if (document.body.clientWidth <= 767) {
	  var isCollapsed = true;
	} else {
	  var isCollapsed = false;
	}

	var baseLayers = {
	  "Street Map": cartoLight,
	};

	var groupedOverlays = {
	  "Points of Interest": {
		"&nbsp;Surveys": surveysLayer,
	  },

	};

	var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
	  collapsed: isCollapsed
	}).addTo(map);

	/* Highlight search box text on click */
	$("#searchbox").click(function () {
	  $(this).select();
	});

	/* Prevent hitting enter from refreshing the page */
	$("#searchbox").keypress(function (e) {
	  if (e.which == 13) {
		e.preventDefault();
	  }
	});

	$("#featureModal").on("hidden.bs.modal", function (e) {
	  $(document).on("mouseout", ".feature-row", clearHighlight);
	});

	// Leaflet patch to make layer control scrollable on touch browsers
	var container = $(".leaflet-control-layers")[0];
	if (!L.Browser.touch) {
	  L.DomEvent
	  .disableClickPropagation(container)
	  .disableScrollPropagation(container);
	} else {
	  L.DomEvent.disableClickPropagation(container);
	}
	
	var ThisYear = new Date().getFullYear();
	var slidervar = $("#slider")[0];
	noUiSlider.create(slidervar, {
		connect: true,
		start: [ 2015, new Date().getFullYear() ],
		step: 1,
		range: {
			min: 2015,
			max: new Date().getFullYear()
		}
	});
	document.getElementById('input-number-min').setAttribute("pattern", "number");
	document.getElementById('input-number-max').setAttribute("pattern", "number");
	var inputNumberMin = $("#input-number-min")[0];
	var inputNumberMax = $("#input-number-max")[0];
	inputNumberMin.addEventListener('change', function(){
		slidervar.noUiSlider.set([this.value, null]);
	});
	inputNumberMax.addEventListener('change', function(){
		slidervar.noUiSlider.set([null, this.value]);
	});
	slidervar.noUiSlider.on('update', function( values, handle ) {
                //handle = 0 if min-slider is moved and handle = 1 if max slider is moved
                if (handle==0){
                    document.getElementById('input-number-min').value = Math.floor(values[0]);
                } else {
                    document.getElementById('input-number-max').value =  Math.floor(values[1]);
                }
                rangeMin = document.getElementById('input-number-min').value;
                rangeMax = document.getElementById('input-number-max').value;
				
				map.eachLayer(function (layer) {
                        if (layer === surveysLayer){
                            layer.clearLayers();
				}})
						
				surveys = populate_map(rangeMin,rangeMax,filter_str)
				surveys.addTo(surveysLayer);
				$("#loading").hide();
				syncSidebar();

	})
	var filter_box = $("#filter")[0];
	filter_box.oninput = function( ){
		filter_str = filter_box.value;
		
		map.eachLayer(function (layer) {
                        if (layer === surveysLayer){
                            layer.clearLayers();
				}})
						
		surveys = populate_map(rangeMin,rangeMax,filter_str)
		surveys.addTo(surveysLayer);
		$("#loading").hide();
		syncSidebar();
	}
}
