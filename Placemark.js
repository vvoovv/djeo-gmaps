define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // mixin
	"dojo/_base/array", // forEach
	"dojo/_base/Color",
	"dojo/has",
	"djeo/util/_base",
	"djeo/common/Placemark",
	"dojo/_base/sniff"
], function(declare, lang, array, Color, has, u, P){

var GM = window.google && google.maps;

var Placemark = declare([P], {

	constructor: function(kwArgs) {
		lang.mixin(this, kwArgs);
	},

	makePoint: function(feature, coords) {
		return new GM.Marker({
			position: new GM.LatLng(coords[1], coords[0])
		});
	},

	makeLineString: function(feature, coords) {
		return this._makeLineString(coords);
	},

	_makeLineString: function(coords) {
		var path = [];
		array.forEach(coords, function(point) {
			path.push(new GM.LatLng(point[1],point[0]));
		});
		return new GM.Polyline({
			path: path
		});
	},

	makePolygon: function(feature, coords) {
		return new GM.Polygon({
			paths: this._makePolygonPaths(coords, [])
		});
	},

	_makePolygonPaths: function(coords, paths) {
		array.forEach(coords, function(lineStringCoords) {
			var path = [];
			array.forEach(lineStringCoords, function(point){
				path.push(new GM.LatLng(point[1],point[0]));
			});
			paths.push(path);
		});
		return paths;
	},

	makeMultiLineString: function(feature, coords) {
		array.forEach(coords, function(lineStringCoords){
			// add features here (not in djeo.Placemark) and return null
			feature.baseShapes.push( this._makeLineString(lineStringCoords) );
		}, this);
		
		return null;
	},

	makeMultiPolygon: function(feature, coords) {
		var paths = [];
		array.forEach(coords, function(polygonCoords){
			this._makePolygonPaths(polygonCoords, paths);
		}, this);
		return new GM.Polygon({
			paths: paths
		});
	},
	
	applyPointStyle: function(feature, calculatedStyle, coords) {
		var specificStyle = calculatedStyle.point,
			specificShapeStyle = P.getSpecificShapeStyle(calculatedStyle.points, this.specificStyleIndex),
			marker = feature.baseShapes[0],
			shapeType = P.get("shape", calculatedStyle, specificStyle, specificShapeStyle),
			src = P.getImgSrc(calculatedStyle, specificStyle, specificShapeStyle),
			isVectorShape = true,
			scale = P.getScale(calculatedStyle, specificStyle, specificShapeStyle),
			mi = marker.getIcon(), // mi stands for markerImage
			miExists = mi ? true : false,
			heading = feature.orientation,
			hasHeading = feature.map.simulateOrientation && heading !== undefined
		;

		if (!mi) mi = {};

		if (!shapeType && src) isVectorShape = false;
		else if (!P.shapes[shapeType] && !miExists)
			// set default value for the shapeType only if we haven't already styled the feature (!miExists)
			shapeType = P.defaultShapeType;

		var url = this._getIconUrl(isVectorShape, shapeType, src);
		if (hasHeading) {
			if (lang.isObject(heading)) heading = heading.heading;
			heading = Math.round(u.radToDeg(heading));
			if (heading<0) heading = 360 + heading;
			if (url) url = getSpriteUrl(feature, url);
		}
		if (url) mi.url = url;

		var size = isVectorShape ? P.getSize(calculatedStyle, specificStyle, specificShapeStyle) : P.getImgSize(calculatedStyle, specificStyle, specificShapeStyle);
		if (size) {
			var anchor = isVectorShape ? [size[0]/2, size[1]/2] : P.getAnchor(calculatedStyle, specificStyle, specificShapeStyle, size);
			mi.size = new GM.Size(scale*size[0], scale*size[1]);
			mi.anchor = new GM.Point(scale*anchor[0], scale*anchor[1]);
			mi.scaledSize = new GM.Size(scale*size[0], scale*size[1]);
			if (hasHeading) {
				mi.origin = new GM.Point(0, size[1]*heading);
				mi.scaledSize.height = 360*mi.scaledSize.height;
			}
		}
		else if (miExists) {
			// check if we can apply relative scale (rScale)
			var rScale = P.get("rScale", calculatedStyle, specificStyle, specificShapeStyle);
			if (rScale !== undefined) {
				mi.size.width *= rScale;
				mi.size.height *= rScale;
				mi.anchor.x *= rScale;
				mi.anchor.y *= rScale;
				mi.scaledSize.width *= rScale;
				mi.scaledSize.height *= rScale;
				
				if (hasHeading) mi.origin.y *= rScale;
			}
		}

		marker.setIcon(mi);
	},
	
	applyLineStyle: function(feature, calculatedStyle, coords) {
		var specificStyle = calculatedStyle.line,
			specificShapeStyle = P.getSpecificShapeStyle(calculatedStyle.lines, this.specificStyleIndex),
			polylines = feature.baseShapes,
			stroke = P.get("stroke", calculatedStyle, specificStyle, specificShapeStyle),
			strokeOpacity = P.get("strokeOpacity", calculatedStyle, specificStyle, specificShapeStyle),
			strokeWidth = P.get("strokeWidth", calculatedStyle, specificStyle, specificShapeStyle);

		// if polylines.length>1 we have a MultiLineString 
		array.forEach(polylines, function(polyline){
			var polylineOptions = {};
			if (stroke) polylineOptions.strokeColor = getColor(stroke);
			if (strokeOpacity !== undefined) polylineOptions.strokeOpacity = strokeOpacity;
			if (strokeWidth !== undefined) polylineOptions.strokeWeight = strokeWidth;
			polyline.setOptions(polylineOptions);
		});
	},

	applyPolygonStyle: function(feature, calculatedStyle, coords) {
		// no specific shape styles for a polygon!
		var specificStyle = calculatedStyle.polygon,
			polygon = feature.baseShapes[0],
			fill = P.get("fill", calculatedStyle, specificStyle),
			fillOpacity = P.get("fillOpacity", calculatedStyle, specificStyle),
			stroke = P.get("stroke", calculatedStyle, specificStyle),
			strokeOpacity = P.get("strokeOpacity", calculatedStyle, specificStyle),
			strokeWidth = P.get("strokeWidth", calculatedStyle, specificStyle),
			polygonOptions = {};

		if (fill) polygonOptions.fillColor = getColor(fill);
		if (fillOpacity !== undefined) polygonOptions.fillOpacity = fillOpacity;

		if (stroke) polygonOptions.strokeColor = getColor(stroke);
		if (strokeOpacity !== undefined) polygonOptions.strokeOpacity = strokeOpacity;
		if (strokeWidth !== undefined) polygonOptions.strokeWeight = strokeWidth;

		polygon.setOptions(polygonOptions);
	},
	
	remove: function(feature) {
		array.forEach(feature.baseShapes, function(placemark){
			placemark.setMap(null);
		});
	},
	
	show: function(feature, show) {
		array.forEach(feature.baseShapes, function(placemark){
			placemark.setMap(show ? feature.map.engine.gmap : null);
		});
	},

	makeText: function(feature, calculatedStyle) {
	},
	
	setCoords: function(coords, feature) {
		feature.baseShapes[0].setPosition(new GM.LatLng(coords[1], coords[0]));
	},
	
	setOrientation: function(o, feature) {
		// orientation is actually heading
		if (!feature.map.simulateOrientation) return;
		var marker = feature.baseShapes[0],
			mi = marker.getIcon(), // mi stands for markerImage
			heading = Math.round(u.radToDeg(o)),
			size = mi.size
		;
		var url = feature.reg.url;
		if (!url) {
			url = getSpriteUrl(feature, mi.url);
		}
		if (heading<0) heading = 360 + heading;
		mi.url = url;
		mi.origin = new GM.Point(0, size.height*heading);
		mi.scaledSize.height = 360*size.height;
		marker.setIcon(mi);
	}
});

Placemark.init = function() {
	GM = google.maps;
};

function getColor(c) {
	// Google Maps API doesn't support CSS3 colors for IE
	return has("ie") ? (new Color(c)).toHex() : c;
};

function getSpriteUrl(feature, url) {
	var fileName = url.match(/\b\w+\.\w{3,4}$/)[0],
		fileName_ = fileName.split("."),
		path = url.substr(0, url.length-fileName_[0].length-fileName_[1].length-1)
	;
	url = path + fileName_[0] + "_" + fileName_[1] + "/" + fileName;
	feature.reg.url = url;
	return url;
}

return Placemark;
});
