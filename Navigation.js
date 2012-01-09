define([
	"dojo/_base/declare"
], function(declare) {

return declare(null, {

	enable: function(enable) {
		if (enable === undefined) enable = true;
		this.map.engine.gmap.setOptions({
			disableDoubleClickZoom: !enable,
			draggable: enable,
			scrollwheel: enable
		});
	}
});

});