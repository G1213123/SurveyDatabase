function create_map(map, options) {

	var featureList;

	$(window).resize(function () {
		sizeLayerControl();
	});

	$(document).on("click", ".feature-row", function (e) {
		$(document).off("mouseout", ".feature-row", clearHighlight);
		sidebarClick(parseInt($(this).attr("id"), 10));
	});

	if (!("ontouchstart" in window)) {
		$(document).on("mouseover", ".feature-row", function (e) {
			highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
		});
	}

	$(document).on("mouseout", ".feature-row", clearHighlight);

	$("#about-btn").click(function () {
		$("#aboutModal").modal("show");
		$(".navbar-collapse.in").collapse("hide");
		return false;
	});

	$("#full-extent-btn").click(function () {
		map.flyTo([22.375, 114.126], 15);
		$(".navbar-collapse.in").collapse("hide");
		return false;
	});

	$("#list-btn").click(function () {
		animateSidebar();
		return false;
	});

	$("#nav-btn").click(function () {
		$(".navbar-collapse").collapse("toggle");
		return false;
	});

	$("#sidebar-toggle-btn").click(function () {
		animateSidebar();
		return false;
	});

	$("#sidebar-hide-btn").click(function () {
		animateSidebar();
		return false;
	});

	function animateSidebar() {
		$("#sidebar").animate({
			width: "toggle"
		}, 350, function () {
			map.invalidateSize();
		});
	}

	function sizeLayerControl() {
		$(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
	}

	function clearHighlight() {
		highlight.clearLayers();
	}

	/* Basemap Layers */
	var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
	});
	cartoLight.addTo(map);


	/* Overlay Layers */
	var highlightStyle = {
		stroke: false,
		fillColor: "#FFFF00",
		fillOpacity: 0.7,
		radius: 30
	};
	var highlight = L.geoJson(null,highlightStyle).addTo(map);


	//search function with geocode
	control = new L.Control.Geocoder({ geocoder: L.Control.Geocoder.nominatim(), hideMarkerOnCollapse: false });
	control.addTo(map);

	//generate random color base on the project number
	//reference: https://gist.github.com/mjackson/5311256
	var head_column = ["SurveyID", "Job Number", "Project Name", "Survey", "Issue Date"]

	var rangeMax = 2020
	var rangeMin = 2017
	var filter_str = ''

	function hslToRgb(h, s, l) {
		var r, g, b;

		if (s == 0) {
			r = g = b = l; // achromatic
		} else {
			function hue2rgb(p, q, t) {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;

			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}

		return [r * 255, g * 255, b * 255];
	}

	var rgbToHex = function (rgb) {
		var hex = Math.floor(Number(rgb)).toString(16);
		if (hex.length < 2) {
			hex = "0" + hex;
		}
		return hex;
	};

	var fullColorHex = function (r, g, b) {
		var red = rgbToHex(r);
		var green = rgbToHex(g);
		var blue = rgbToHex(b);
		return red + green + blue;
	};

	function getColor(d) {
		h = (d % 256) / 256
		var color = hslToRgb(h, 1, 0.5);
		var s = 'rgb('
		return s + color[0] + ',' + color[1] + ',' + color[2] + ')';
	}

	surveyNames = [
		'Vehicular',
		'Pedestrian',
		'Public Transport',
		'Parking',
		'Illegal Parking',
		'Queue Length',
		'Interview',
		'Cancelled'
	]

	//font awesome icon used for survey types
	surveyicon = {
		'Vehicular': 'fa fa-car',
		'Pedestrian': 'fas fa-walking',
		'Public Transport': 'fa fa-bus',
		'Parking': 'fas fa-parking',
		'Illegal Parking': 'fa fa-times-circle',
		'Queue Length': 'fa fa-road',
		'Interview': 'fas fa-clipboard-list'
	}

	function geticon(type, id, remark) {
		if (typeof id == 'undefined' || remark == "Cancelled") {
			color = 'black'
		} else {
			color = getColor(parseInt(id.replace(/^.*?(\d+).*/, '$1')) * 35)
		}
		return '<i class="' + type + '" style="color: ' + color + '"></i>'
	}

	//Defining the map marker icon
	function protecland_marker(feature, latlng, icon) {
		return new L.Marker(latlng, icon)
	}


	//handle feature clicked events
	function popUp(f, l) {
		var out = [];
		if (f.properties) {
			for (key in f.properties.SurveyID) {
				var descipt = (key != "Survey") ? f.properties.SurveyID[key] : f.properties.SurveyID.Survey.join(",");
				if (descipt == null) {
					descipt = "-";
				} else {
					descipt = descipt.replace(/[\[\]']/g, '');
				}

				out.push("<b>" + key + ": </b>" + descipt);
			}
			out.push('<a href="' +
				'file:'
				+ '"> Details index')
			l.bindPopup(out.join("<br />"),
			{
				'autoPan': false,
				'keepInView': true
			}
			);
		}
	}

	/* Single marker cluster layer to hold all clusters */
	var markerClusters = L.markerClusterGroup.layerSupport({
		iconCreateFunction: function (cluster) {
			var markers = cluster.getAllChildMarkers();
			var html = '<div class="circle">' + markers.length + '</div>';
			return L.divIcon({ html: html, className: 'mycluster', iconSize: L.point(32, 32) });
		},
		spiderfyOnMaxZoom: true,
		showCoverageOnHover: false,
		zoomToBoundsOnClick: true,
	});

	//surveysLayer = L.geoJson(null);
	vehLayer = 			new L.LayerGroup()
	pedLayer = 			new L.LayerGroup()
	ptLayer = 			new L.LayerGroup()
	parkingLayer = 		new L.LayerGroup()
	illparkLayer = 		new L.LayerGroup()
	qlengthLayer = 		new L.LayerGroup()
	interviewLayer = 	new L.LayerGroup()
	cancelLayer = 		new L.LayerGroup()
	layerList = [
		 vehLayer,
		 pedLayer,
		 ptLayer,
		 parkingLayer,
		 illparkLayer,
		 qlengthLayer,
		interviewLayer,
		cancelLayer,
	]
	surveys = new L.LayerGroup(layerList);
	markerClusters.checkIn(layerList)
	markerClusters.addTo(map)
	layerList.forEach(element => {
		if (element != cancelLayer){
		element.addTo(map)}
	});

		// store the survey data string
	// map_survey = JSON.parse(map_survey_str)

	function create_marker(json, layerkey) {
		return (L.geoJson(json, {
			coordsToLatLng: function (coords) {
				return new L.LatLng(coords[0], coords[1], coords[2]);
			},
			filter:function(feature, layer) {
				return (feature.properties.SurveyID.Remark!='Cancelled')},
			onEachFeature: function(feature, layer){
				popUp(feature,layer);
				layerList[layerkey].addLayer(layer)},
			pointToLayer: function(feature, latlng) {
				icon = {
					icon: L.divIcon({
						html: geticon(surveyicon[surveyNames[layerkey]], feature.properties.SurveyID.SurveyID, feature.properties.SurveyID.Remark),
						iconSize: [40, 40],
						className: 'myDivIcon'
					})
				}
				var marker = protecland_marker(feature, latlng, icon)
				return marker
			},

		}))
	}
	// layer for display on the map

	/* Filter sidebar feature list to only show features in current map bounds */
	map.on("moveend", function (e) {
		onMapChange();
	});

	map.on("overlayadd", function (e) {
		onMapChange();
	});

	map.on("overlayremove", function (e) {
		onMapChange();
	});

	/* Clear feature highlight when map is clicked */
	map.on("click", function (e) {
		highlight.clearLayers();
	});

	/* remove django leaflet default control and add back at bottom right*/
	map.removeControl(map.zoomControl);
	var zoomControl = L.control.zoom({
		position: "bottomright"
	}).addTo(map);


	/* Larger screens get expanded layer control and visible sidebar */
	if (document.body.clientWidth <= 767) {
		var isCollapsed = true;
	} else {
		var isCollapsed = false;
	}

	/* layer for basemap */
	var baseLayers = {
		"Street Map": cartoLight,
	};

	/* individual layers for survey type */
	var groupedOverlaysLegend = {};
	for (let [key, value] of layerList.entries()) {
		groupedOverlaysLegend[geticon(surveyicon[surveyNames[key]]) + "&nbsp;" + [surveyNames[key]]] = value
	};

	var groupedOverlays = {
		"Points of Interest": groupedOverlaysLegend

	};

	// select survey type
	var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
		collapsed: false
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

	// slider for filtering survey issue year
	var ThisYear = new Date().getFullYear();
	var slidervar = $("#slider")[0];
	noUiSlider.create(slidervar, {
		connect: true,
		start: [2017, new Date().getFullYear()],
		step: 1,
		range: {
			min: 2017,
			max: new Date().getFullYear()
		}
	});
	document.getElementById('input-number-min').setAttribute("pattern", "number");
	document.getElementById('input-number-max').setAttribute("pattern", "number");
	var inputNumberMin = $("#input-number-min")[0];
	var inputNumberMax = $("#input-number-max")[0];
	inputNumberMin.addEventListener('change', function () {
		slidervar.noUiSlider.set([this.value, null]);
	});
	inputNumberMax.addEventListener('change', function () {
		slidervar.noUiSlider.set([null, this.value]);
	});
	slidervar.noUiSlider.on('update', function (values, handle) {
		//handle = 0 if min-slider is moved and handle = 1 if max slider is moved
		if (handle == 0) {
			document.getElementById('input-number-min').value = Math.floor(values[0]);
		} else {
			document.getElementById('input-number-max').value = Math.floor(values[1]);
		}
		rangeMin = document.getElementById('input-number-min').value;
		rangeMax = document.getElementById('input-number-max').value;

	})
	slidervar.noUiSlider.on('change',onMapChange)

	timeout = null
	// filter survey id number and survey project name
	var filter_box = $("#filter")[0];
	filter_box.oninput = function () {
		filter_str = filter_box.value;

		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(function () {
			//onMapChange();

		}, 500)
	}

	L.LayerGroup.include({
		customGetLayer: function (id) {
			for (var i in this._layers) {
				for (var j in this._layers[i]._layers) {
					if (j == id) {
						return this._layers[i]._layers[j];
					}
				}
			}
		}
	});

	// set map focus on the clicked survey
	function sidebarClick(id) {
		var layer = surveys.customGetLayer(id);
		//map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
		layer.fire("click");
		/* Hide sidebar and go to the map on small screens */
		if (document.body.clientWidth <= 767) {
			$("#sidebar").hide();
			map.invalidateSize();
		}
	}

	async function getfeaturejson (layerkey){
		surveyjson = await fetch("/mapQuery/", {
			method: "POST",
			body: new URLSearchParams({
				"input-number-min": document.getElementById("input-number-min").value,
				"input-number-max": document.getElementById("input-number-max").value,
				"keywords": document.getElementById("filter").value,
				"type":surveyNames[layerkey],
				"bbox": JSON.stringify(map.getBounds())
			}),
			headers: {
				"Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
				'X-CSRFToken': csrftoken
			},
			mode: 'same-origin' // Do not send CSRF token to another domain.
		})
		return await surveyjson.json()
	}

	// refresh side bar survey list
	async function onMapChange() {
		$("#loading-overlay").show()

		/* Empty sidebar features */
		$("#feature-list tbody").empty();
		/* clear map features*/
		surveys.clearLayers()
		map.eachLayer(function (layer) {
			if (Object.values(layerList).indexOf(layer) > -1) {
				layer.clearLayers();
			}
		})

		/* Resent request for map bbox extent to fetch features*/
		for (let [index, value] of layerList.entries()) {
			create_marker(await getfeaturejson(index), index)
			value.addTo(surveys);
		}

		/* Loop through theaters layer and add only features which are in the map bounds */
		markerClusters.eachLayer(function (feature) {
			$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(feature) + '" lat="' + feature.getLatLng().lat + '" lng="' + feature.getLatLng().lng +
				'"><td style="vertical-align: middle;"></td><td class="feature-name"><b>' + feature.feature.properties.SurveyID.SurveyID + '&nbsp;</b><span class="dot" style="background-color: ' + getColor(parseInt(feature.feature.properties.SurveyID.SurveyID.replace(/^.*?(\d+).*_/, '$1')) * 35) + ';"></span><br />' +
				feature.feature.properties.SurveyID.Project + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
			})
		
		

		/* Update list.js featureList */
		featureList = new List("features", {
			valueNames: ["feature-name"]
		});
		featureList.sort("feature-name", {
			order: "asc"
		});
		$("#loading-overlay").hide();
	}

	onMapChange()
}
