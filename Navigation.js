define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare, lang) {

return declare(null, {

	enable: function(enable) {
		if (enable === undefined) enable = true;
		var gmap = this.map.engine.gmap;
		gmap.setOptions({
			disableDoubleClickZoom: !enable,
			draggable: enable,
			scrollwheel: enable
		});
		if (enable) {
			this.zoomListener = google.maps.event.addListener(gmap, 'zoom_changed', lang.hitch(this, this._onZoom));
		}
		else {
			google.maps.event.removeListener(this.zoomListener);
			delete this.zoomListener;
		}
	}
});

});