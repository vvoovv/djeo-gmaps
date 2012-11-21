define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang",
	"djeo/util/_base"
], function(declare, lang, u) {
	
// calculating number of tiles for each zoom
var numTiles = [1];
for (var z=1; z<20; z++) {
	numTiles[z] = 2*numTiles[z-1];
}

return declare(null, {
	
	init: function() {
		var gmap = this.map.engine.gmap,
			mapTypeId = u.uid().toString(),
			imageMapType = new google.maps.ImageMapType({
				tileSize: new google.maps.Size(256, 256),
				minZoom: 0,
				maxZoom: 18,
				getTileUrl: lang.hitch(this, function(coord, zoom) {
					if (coord.y<0 || coord.y>=numTiles[zoom]) return;
					var y = coord.y,
						x = coord.x % numTiles[zoom]
					;
					if (x<0) {
						x = numTiles[zoom] + x;
					}
					var _1 = this.yFirst ? y : x,
						_2 = this.yFirst ? x : y
					;
					return this.url[_2 % this.numUrls]+"/"+zoom+"/"+_1+"/"+_2+".png";
				})
			})
		;
		this.mapTypeId = mapTypeId;
		gmap.mapTypes.set(mapTypeId, imageMapType);
		gmap.setMapTypeId(mapTypeId);
	}
});

});
