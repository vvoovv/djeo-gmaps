define([
	"require",
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // mixin, hitch, isArray
	"dojo/_base/array", // forEach
	"dojo/aspect", // after
	"dojo/io/script", // get
	"djeo/Engine",
	"./Placemark",
	"djeo/_tiles"
], function(require, declare, lang, array, aspect, script, Engine, Placemark, supportedLayers){

var GM = window.google && google.maps;

var wellKnownLayers = {
	roadmap: "ROADMAP",
	satellite: "SATELLITE",
	hybrid: "HYBRID",
	terrain: "TERRAIN"
},
mapEvents = {
	zoom_changed: 1,
	click: 1,
	mousemove: 1
}
;

// mixing supportedLayers and wellKnownLayers
supportedLayers = lang.mixin(lang.mixin({}, supportedLayers), wellKnownLayers);

function _wrapListener(listener) {
	return {
		remove: function() {
			GM.event.removeListener(listener);
		}
	}
}

return declare([Engine], {
	
	gmap: null,

	constructor: function(kwArgs) {
		this._require = require;
		// set ignored dependencies
		lang.mixin(this.ignoredDependencies, {"Highlight": 1, "Tooltip": 1});
		this._supportedLayers = supportedLayers;
		// initialize basic factories
		this._initBasicFactories(Placemark({
			map: this.map
		}));
	},
	
	initialize: function(/* Function */readyFunction) {
		if (GM) {
			// the first case: Google Maps API is completely loaded
			this.map.projection = "EPSG:4326";
			var gmap = new GM.Map(this.map.container, {
				zoom: 0,
				center: new GM.LatLng(0, 0),
				disableDefaultUI: true,
				disableDoubleClickZoom: true,
				draggable: false,
				scrollwheel: false
			});
			this.gmap = gmap;
			
			this.initialized = true;
			readyFunction();
		}
		else if (window._djeoGmapsInitialized) {
			// the second case: Google Maps API is being loaded
			// wait till window._djeoGmapsInitialized is called
			aspect.after(window, "_djeoGmapsInitialized", lang.hitch(this, function(){
				this.initialize(readyFunction);
			}));
		}
		else {
			window._djeoGmapsInitialized = lang.hitch(this, function(){
				// delete window._djeoGmapsInitialized does't work in IE8
				window._djeoGmapsInitialized = null;
				Placemark.init();
				GM = google.maps;
				this.initialize(readyFunction);
			});
			script.get({
				url: "http://maps.google.com/maps/api/js",
				content: {
					sensor: false,
					callback: "_djeoGmapsInitialized"
				}
			});
		}
	},
	
	_initialize: function() {
		
	},

	createContainer: function(feature) {
		var container = this.ge.createFolder('');
		this.appendChild(container, feature);
		return container;
	},
	
	appendChild: function(child, feature) {
		child.setMap(feature.map.engine.gmap);
	},
	
	getTopContainer: function() {
		var features = this.ge.getFeatures();
		return this.ge;
	},
	
	onForFeature: function(feature, event, method, context) {
		var connections = [];
		// normalize the callback function
		method = this.normalizeCallback(feature, event, method, context);
		array.forEach(feature.baseShapes, function(shape){
			connections.push( GM.event.addListener(shape, event, method) );
		});
		return connections;
	},
	
	disconnect: function(connections) {
		array.forEach(connections, function(connection){
			GM.event.removeListener(connection);
		});
	},
	
	onForMap: function(event, method, context) {
		return _wrapListener(
			GM.event.addListener(this.gmap, event, function(e){
				var ll = e.latLng;
				method.call(context, {
					mapCoords: [ll.lng(), ll.lat()]
				});
			})
		);
	},
	
	_on_zoom_changed: function(event, method, context) {
		return _wrapListener(
			GM.event.addListener(this.gmap, event, function(){
				method.call(context);
			})
		);
	},
	
	zoomTo: function(extent) {
		var gBounds = new GM.LatLngBounds( new GM.LatLng(extent[1],extent[0]), new GM.LatLng(extent[3],extent[2]) );
		this.gmap.fitBounds(gBounds);
	},
	
	destroy: function() {
		
	},
	
	enableLayer: function(/* String */layerId, /* Boolean */enabled) {
		// check if layerId is in wellKnownLayers
		var layerId_ = layerId.toLowerCase();
		if (layerId_ in wellKnownLayers) {
			if (enabled) this.gmap.setMapTypeId( GM.MapTypeId[wellKnownLayers[layerId_]] );
		}
		else {
			this.inherited(arguments);
		}
	},
	
	_setCamera: function(kwArgs) {
		this._set_center(kwArgs.center);
		this._set_zoom(kwArgs.zoom);
	},
	
	_set_center: function(center) {
		this.gmap.setCenter(new GM.LatLng(center[1], center[0]));
	},
	
	_get_center: function() {
		var center = this.gmap.getCenter();
		return [center.lng(), center.lat()];
	},
	
	_set_zoom: function(zoom) {
		this.gmap.setZoom(zoom);
	},
	
	_get_zoom: function() {
		return this.gmap.getZoom();
	},
	
	_appendDiv: function(div) {
		// we append the div directly to this.map.container
		this.map.container.appendChild(div);
	}
});

});