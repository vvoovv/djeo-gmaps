define([
	"dojo/_base/declare"
], function(declare) {

return declare(null, {
	
	init: function() {
		this.infoWindow = new google.maps.InfoWindow();
	},

	process: function(event){
		var feature = event.feature,
			cs = feature.state.cs,
			iw = this.infoWindow,
			content = cs.info ? cs.info(feature) : this.content(feature)
		;
		iw.setPosition(event.nativeEvent.latLng);
		iw.setContent(content);
		iw.open(this.map.engine.gmap);
	}

});

});