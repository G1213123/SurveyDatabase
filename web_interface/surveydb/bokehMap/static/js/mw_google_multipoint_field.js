(function($) {
	var markers = [];
	
    DjangoGooglePointFieldWidget = DjangoMapWidgetBase.extend({
		
		
        initializeMap: function(){
            var mapCenter = this.mapCenterLocation;
            if (this.mapCenterLocationName){
                
                this.geocoder.geocode({'address' : this.mapCenterLocationName}, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        var geo_location = results[0].geometry.location;
                        mapCenter = [geo_location.lat(), geo_location.lng()];
                    }else{
                        console.warn("Cannot find " + this.mapCenterLocationName + " on google geo service.")
                    }
                    this.map = new google.maps.Map(this.mapElement, {
                        center: new google.maps.LatLng(mapCenter[0], mapCenter[1]),
                        scrollwheel: true,
						gestureHandling: 'greedy',
                        zoomControlOptions: {
                            position: google.maps.ControlPosition.RIGHT
                        },
                        zoom: this.zoom
                    });

                    $(this.mapElement).data('google_map', this.map);
                    $(this.mapElement).data('google_map_widget', this);

                    if (!$.isEmptyObject(this.locationFieldValue)){
                        this.updateLocationInput(this.locationFieldValue.lat, this.locationFieldValue.lng);
                        this.fitBoundMarker();
                    }

                }.bind(this));

            }else{
                this.map = new google.maps.Map(this.mapElement, {
                    center: new google.maps.LatLng(mapCenter[0], mapCenter[1]),
                    scrollwheel: true,
					gestureHandling: 'greedy',
					zoomControlOptions: {
                        position: google.maps.ControlPosition.RIGHT
                    },
                    zoom: this.zoom
                });
                
                $(this.mapElement).data('google_map', this.map);
                $(this.mapElement).data('google_map_widget', this);

                if (!$.isEmptyObject(this.locationFieldValue)){
                    this.updateLocationInput(this.locationFieldValue.lat, this.locationFieldValue.lng);
                    this.fitBoundMarker();
                }
            }

        },

        addMarkerToMap: function(lat, lng){
            var marker_position = {lat: parseFloat(lat), lng: parseFloat(lng)};
            this.marker = new google.maps.Marker({
                position: marker_position,
                map: this.map,
                draggable: true
            });
			this.marker.addListener("dragstart", this.dragMarkerSt.bind(this));
            this.marker.addListener("dragend", this.dragMarkerEd.bind(this));
			markers.push(this.marker);
        },

        fitBoundMarker: function () {
            var bounds = new google.maps.LatLngBounds();
            bounds.extend(this.marker.getPosition());
            this.map.fitBounds(bounds);
            if (this.markerFitZoom && this.isInt(this.markerFitZoom)){
                var markerFitZoom = parseInt(this.markerFitZoom);
                var listener = google.maps.event.addListener(this.map, "idle", function() {
                    if (this.getZoom() > markerFitZoom) {
                        this.setZoom(markerFitZoom)
                    }
                    google.maps.event.removeListener(listener);
                });
            }
        },
		
		updateLocationInput: function(lat_raw, lng_raw, place, add = true){
		    lat = parseFloat(lat_raw).toFixed(6);
		    lng = parseFloat(lng_raw).toFixed(6);
			var location_input_val = "MULTIPOINT (" + lat + " " + lng + ")";
			var legacy_location = this.locationInput.val();
			
			this.locationInput.val(function(){
				if ((legacy_location=="")){
					return location_input_val;
					}
				else{
					return legacy_location.replace(")","") + ", " + lat + " " + lng + ")";
				}
				}
			
			);
			this.updateCoordinatesInputs(lat, lng);
			if (add){
			    this.addMarkerToMap(lat, lng);
			};

			if ($.isEmptyObject(this.locationFieldValue)){
				$(document).trigger(this.markerCreateTriggerNameSpace,
					[place, lat, lng, this.wrapElemSelector, this.locationInput]
				);
			}else{
				$(document).trigger(this.markerChangeTriggerNameSpace,
					[place, lat, lng, this.wrapElemSelector, this.locationInput]
				);
			}
			
			this.callPlaceTriggerHandler(lat, lng, place);
			this.locationFieldValue = {
				"lng": lng,
				"lat": lat
			};
			this.deleteBtn.removeClass("mw-btn-default disabled").addClass("mw-btn-danger");
		},

        removeMarker: function(e){
			if (markers){
				for (var i = 0; i < markers.length; i++) {
				  markers[i].setMap(null);
				}
			}
            
        },
		
		//remove original marker location from the locationInput String
		dragMarkerSt: function(e){
            var legacy_location = this.locationInput.val();
			var lat = e.latLng.lat().toFixed(6);
			var lng = e.latLng.lng().toFixed(6);
			this.locationInput.val(function(){
				legacy_location = legacy_location.replace(", " + lat + " " + lng , "");
				legacy_location = legacy_location.replace("MULTIPOINT (" + lat + " " + lng + ")", "");
				return legacy_location;
					}
			);
        },

        dragMarkerEd: function(e){
            this.updateLocationInput(e.latLng.lat(), e.latLng.lng(), null, false)
        },

        handleAddMarkerBtnClick: function(e){
            $(this.mapElement).toggleClass("click");
            this.addMarkerBtn.toggleClass("active");
            if ($(this.addMarkerBtn).hasClass("active")){
                this.map.addListener("click", this.handleMapClick.bind(this));
            }else{
                google.maps.event.clearListeners(this.map, 'click');
            }
        },

        handleMapClick: function(e){
            this.updateLocationInput(e.latLng.lat(), e.latLng.lng())
			e.stop();
        }
    });

})(mapWidgets.jQuery);
